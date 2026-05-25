import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SlaTimer, SlaTimerStatus, SlaTimerSource, SlaTimerType } from './sla_timers.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op, Sequelize } from 'sequelize';

/** Default SLA duration: 2 hours in milliseconds */
const DEFAULT_SLA_MS = 2 * 60 * 60 * 1000;

const DEFAULT_ACCEPTANCE_SLA_MS = 30 * 60 * 1000;      // 30 minutes
const DEFAULT_TRAVEL_SLA_MS = 45 * 60 * 1000;          // 45 minutes
const DEFAULT_ON_SITE_PREP_SLA_MS = 15 * 60 * 1000;    // 15 minutes
const DEFAULT_TOTAL_RESOLUTION_SLA_MS = 4 * 60 * 60 * 1000; // 4 hours

/** Minimum number of historical samples required to use avg instead of default */
const MIN_SAMPLE_COUNT = 3;

/** Buffer multiplier added to historical average (20% more time) */
const HISTORICAL_BUFFER = 1.2;

/** Maximum number of recent completed jobs to consider */
const HISTORICAL_LIMIT = 20;

@Injectable()
export class SlaTimersService {
  private readonly logger = new Logger(SlaTimersService.name);

  constructor(
    @Inject(KEYNAMES.SLA_TIMERS)
    private readonly slaTimerRepository: typeof SlaTimer,
    @Inject(KEYNAMES.WORK_ORDERS)
    private readonly workOrderRepository: typeof WorkOrder,
    @Inject(KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS)
    private readonly sessionRepository: typeof WorkOrderTechnicianSession,
  ) {}

  /**
   * Create an SLA timer for a work order when the technician accepts the job.
   * Calculates deadline from historical data or falls back to 2hr default.
   */
  async createTimerForSession(
    tenantId: string,
    workOrderId: string,
    technicianId: string,
    sessionId: string,
  ): Promise<SlaTimer> {
    // Check if a work_completion timer already exists for this work order
    const existing = await this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: SlaTimerType.WORK_COMPLETION, is_deleted: false },
    });
    if (existing) {
      this.logger.warn(`SLA work_completion timer already exists for WO ${workOrderId}, skipping creation`);
      return existing;
    }

    // Get work order details for category and priority
    const workOrder = await this.workOrderRepository.findOne({
      where: { id: workOrderId, tenant_id: tenantId, is_deleted: false },
    });
    if (!workOrder) {
      throw new NotFoundException(`Work order ${workOrderId} not found`);
    }

    const category = workOrder.category || null;
    const priority = workOrder.priority || null;

    // Calculate SLA duration from historical data
    const { durationMs, sampleCount, source } = await this.calculateSlaDuration(
      tenantId,
      category,
      priority,
    );

    const now = new Date();
    const deadlineAt = new Date(now.getTime() + durationMs);

    const timer = await this.slaTimerRepository.create({
      tenant_id: tenantId,
      work_order_id: workOrderId,
      technician_id: technicianId,
      session_id: sessionId,
      timer_type: SlaTimerType.WORK_COMPLETION,
      category,
      priority,
      started_at: now,
      deadline_at: deadlineAt,
      sla_duration_ms: durationMs,
      source,
      sample_count: sampleCount,
      status: SlaTimerStatus.RUNNING,
    });

    const durationMinutes = Math.round(durationMs / 60000);
    this.logger.log(
      `SLA timer created for WO ${workOrderId}: ${durationMinutes}min ` +
      `(source=${source}, samples=${sampleCount}, deadline=${deadlineAt.toISOString()})`,
    );

    return timer;
  }

  /**
   * Pause the SLA timer for a work order (when technician pauses work).
   */
  async pauseTimer(workOrderId: string): Promise<SlaTimer | null> {
    const timer = await this.findActiveTimer(workOrderId);
    if (!timer) return null;

    if (timer.paused_at) {
      this.logger.warn(`SLA timer for WO ${workOrderId} is already paused`);
      return timer;
    }

    if (['completed_on_time', 'completed_late'].includes(timer.status)) {
      this.logger.warn(`SLA timer for WO ${workOrderId} is already completed, cannot pause`);
      return timer;
    }

    await timer.update({
      paused_at: new Date(),
      status: SlaTimerStatus.PAUSED,
    });

    this.logger.log(`SLA timer paused for WO ${workOrderId}`);
    return timer.reload();
  }

  /**
   * Resume the SLA timer for a work order (when technician resumes work).
   * Shifts the deadline forward by the paused duration.
   */
  async resumeTimer(workOrderId: string): Promise<SlaTimer | null> {
    const timer = await this.findActiveTimer(workOrderId);
    if (!timer) return null;

    if (!timer.paused_at) {
      this.logger.warn(`SLA timer for WO ${workOrderId} is not paused, cannot resume`);
      return timer;
    }

    const pauseDurationMs = Date.now() - new Date(timer.paused_at).getTime();
    const newTotalPausedMs = Number(timer.total_paused_ms) + pauseDurationMs;
    const newDeadline = new Date(new Date(timer.deadline_at).getTime() + pauseDurationMs);

    // Determine resumed status based on time remaining
    const nowMs = Date.now();
    const elapsedMs = nowMs - new Date(timer.started_at).getTime() - newTotalPausedMs;
    const percentUsed = elapsedMs / Number(timer.sla_duration_ms);
    let newStatus = SlaTimerStatus.RUNNING;
    if (percentUsed >= 1) {
      newStatus = SlaTimerStatus.BREACHED;
    } else if (percentUsed >= 0.75) {
      newStatus = SlaTimerStatus.WARNING;
    }

    await timer.update({
      paused_at: null,
      total_paused_ms: newTotalPausedMs,
      deadline_at: newDeadline,
      status: newStatus,
    });

    this.logger.log(
      `SLA timer resumed for WO ${workOrderId}: paused for ${Math.round(pauseDurationMs / 1000)}s, ` +
      `new deadline=${newDeadline.toISOString()}`,
    );
    return timer.reload();
  }

  /**
   * Complete the SLA timer when the technician finishes the job.
   */
  async completeTimer(workOrderId: string): Promise<SlaTimer | null> {
    const timer = await this.findActiveTimer(workOrderId);
    if (!timer) return null;

    const now = new Date();
    const totalElapsedMs = now.getTime() - new Date(timer.started_at).getTime();
    // If the timer is currently paused, add the current pause duration
    let finalPausedMs = Number(timer.total_paused_ms);
    if (timer.paused_at) {
      finalPausedMs += now.getTime() - new Date(timer.paused_at).getTime();
    }
    const actualDurationMs = totalElapsedMs - finalPausedMs;
    const wasOnTime = actualDurationMs <= Number(timer.sla_duration_ms);

    await timer.update({
      completed_at: now,
      actual_duration_ms: actualDurationMs,
      total_paused_ms: finalPausedMs,
      paused_at: null,
      status: wasOnTime ? SlaTimerStatus.COMPLETED_ON_TIME : SlaTimerStatus.COMPLETED_LATE,
    });

    const durationMinutes = Math.round(actualDurationMs / 60000);
    const allocatedMinutes = Math.round(Number(timer.sla_duration_ms) / 60000);
    this.logger.log(
      `SLA timer completed for WO ${workOrderId}: ${durationMinutes}min / ${allocatedMinutes}min ` +
      `(${wasOnTime ? 'ON TIME' : 'LATE'})`,
    );
    return timer.reload();
  }

  /**
   * Get all SLA timers for a work order, grouped by type.
   */
  async getTimersByWorkOrder(tenantId: string, workOrderId: string): Promise<{
    acceptance: SlaTimer | null;
    travel: SlaTimer | null;
    on_site_prep: SlaTimer | null;
    work_completion: SlaTimer | null;
    total_resolution: SlaTimer | null;
  }> {
    const timers = await this.slaTimerRepository.findAll({
      where: {
        tenant_id: tenantId,
        work_order_id: workOrderId,
        is_deleted: false,
      },
    });
    return {
      acceptance: timers.find(t => t.timer_type === SlaTimerType.ACCEPTANCE) ?? null,
      travel: timers.find(t => t.timer_type === SlaTimerType.TRAVEL) ?? null,
      on_site_prep: timers.find(t => t.timer_type === SlaTimerType.ON_SITE_PREP) ?? null,
      work_completion: timers.find(t => t.timer_type === SlaTimerType.WORK_COMPLETION) ?? null,
      total_resolution: timers.find(t => t.timer_type === SlaTimerType.TOTAL_RESOLUTION) ?? null,
    };
  }

  /**
   * Get SLA compliance stats for the tenant.
   */
  async getTimerStats(tenantId: string): Promise<{
    total_timers: number;
    completed_on_time: number;
    completed_late: number;
    currently_running: number;
    currently_breached: number;
    compliance_rate: number;
    avg_actual_duration_ms: number;
  }> {
    const all = await this.slaTimerRepository.findAll({
      where: { tenant_id: tenantId, timer_type: SlaTimerType.WORK_COMPLETION, is_deleted: false },
      attributes: ['status', 'actual_duration_ms'],
    });

    const completedOnTime = all.filter((t) => t.status === SlaTimerStatus.COMPLETED_ON_TIME).length;
    const completedLate = all.filter((t) => t.status === SlaTimerStatus.COMPLETED_LATE).length;
    const totalCompleted = completedOnTime + completedLate;
    const running = all.filter((t) =>
      [SlaTimerStatus.RUNNING, SlaTimerStatus.PAUSED, SlaTimerStatus.WARNING].includes(t.status as SlaTimerStatus),
    ).length;
    const breached = all.filter((t) => t.status === SlaTimerStatus.BREACHED).length;

    const completedDurations = all
      .filter((t) => t.actual_duration_ms !== null)
      .map((t) => Number(t.actual_duration_ms));
    const avgDuration = completedDurations.length > 0
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 0;

    return {
      total_timers: all.length,
      completed_on_time: completedOnTime,
      completed_late: completedLate,
      currently_running: running,
      currently_breached: breached,
      compliance_rate: totalCompleted > 0 ? Math.round((completedOnTime / totalCompleted) * 100) : 100,
      avg_actual_duration_ms: Math.round(avgDuration),
    };
  }

  /**
   * Find all running timers that have breached or are approaching thresholds.
   * Used by the cron scheduler.
   */
  async findTimersNeedingAttention(): Promise<{
    breached: SlaTimer[];
    warning90: SlaTimer[];
    warning75: SlaTimer[];
  }> {
    const now = Date.now();

    const activeTimers = await this.slaTimerRepository.findAll({
      where: {
        status: {
          [Op.in]: [SlaTimerStatus.RUNNING, SlaTimerStatus.WARNING],
        },
        paused_at: null, // Only check non-paused timers
        is_deleted: false,
      },
    });

    const breached: SlaTimer[] = [];
    const warning90: SlaTimer[] = [];
    const warning75: SlaTimer[] = [];

    for (const timer of activeTimers) {
      const elapsedMs = now - new Date(timer.started_at).getTime() - Number(timer.total_paused_ms);
      const slaDurationMs = Number(timer.sla_duration_ms);
      const percentUsed = elapsedMs / slaDurationMs;

      if (percentUsed >= 1 && !timer.breach_sent) {
        breached.push(timer);
      } else if (percentUsed >= 0.9 && !timer.warning_90_sent) {
        warning90.push(timer);
      } else if (percentUsed >= 0.75 && !timer.warning_75_sent) {
        warning75.push(timer);
      }
    }

    return { breached, warning90, warning75 };
  }

  /**
   * Mark timers as breached and update their warning flags.
   */
  async markBreached(timerIds: string[]): Promise<void> {
    if (timerIds.length === 0) return;
    await this.slaTimerRepository.update(
      { status: SlaTimerStatus.BREACHED, breach_sent: true },
      { where: { id: { [Op.in]: timerIds } } },
    );
  }

  async markWarning90(timerIds: string[]): Promise<void> {
    if (timerIds.length === 0) return;
    await this.slaTimerRepository.update(
      { status: SlaTimerStatus.WARNING, warning_90_sent: true },
      { where: { id: { [Op.in]: timerIds } } },
    );
  }

  async markWarning75(timerIds: string[]): Promise<void> {
    if (timerIds.length === 0) return;
    await this.slaTimerRepository.update(
      { status: SlaTimerStatus.WARNING, warning_75_sent: true },
      { where: { id: { [Op.in]: timerIds } } },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Generic timer lifecycle (used by non-work_completion timers)
  // ──────────────────────────────────────────────────────────────────────────────

  private static readonly TIMER_DEFAULTS: Record<string, number> = {
    [SlaTimerType.ACCEPTANCE]: DEFAULT_ACCEPTANCE_SLA_MS,
    [SlaTimerType.TRAVEL]: DEFAULT_TRAVEL_SLA_MS,
    [SlaTimerType.ON_SITE_PREP]: DEFAULT_ON_SITE_PREP_SLA_MS,
    [SlaTimerType.TOTAL_RESOLUTION]: DEFAULT_TOTAL_RESOLUTION_SLA_MS,
    [SlaTimerType.WORK_COMPLETION]: DEFAULT_SLA_MS,
  };

  async createTimer(
    tenantId: string,
    workOrderId: string,
    technicianId: string,
    sessionId: string,
    timerType: SlaTimerType,
  ): Promise<SlaTimer> {
    const existing = await this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: timerType, is_deleted: false },
    });
    if (existing) return existing;

    const durationMs = SlaTimersService.TIMER_DEFAULTS[timerType] ?? DEFAULT_SLA_MS;
    const now = new Date();
    const deadlineAt = new Date(now.getTime() + durationMs);

    const timer = await this.slaTimerRepository.create({
      tenant_id: tenantId,
      work_order_id: workOrderId,
      technician_id: technicianId,
      session_id: sessionId,
      timer_type: timerType,
      started_at: now,
      deadline_at: deadlineAt,
      sla_duration_ms: durationMs,
      source: SlaTimerSource.DEFAULT,
      sample_count: 0,
      status: SlaTimerStatus.RUNNING,
    });

    this.logger.log(
      `SLA ${timerType} timer created for WO ${workOrderId}: ${Math.round(durationMs / 60000)}min`,
    );
    return timer;
  }

  async completeTimerByType(workOrderId: string, timerType: SlaTimerType): Promise<SlaTimer | null> {
    const timer = await this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: timerType, is_deleted: false },
    });
    if (!timer) return null;
    if (['completed_on_time', 'completed_late'].includes(timer.status)) return timer;

    const now = new Date();
    const totalElapsedMs = now.getTime() - new Date(timer.started_at).getTime();
    let finalPausedMs = Number(timer.total_paused_ms);
    if (timer.paused_at) {
      finalPausedMs += now.getTime() - new Date(timer.paused_at).getTime();
    }
    const actualDurationMs = totalElapsedMs - finalPausedMs;
    const wasOnTime = actualDurationMs <= Number(timer.sla_duration_ms);

    await timer.update({
      completed_at: now,
      actual_duration_ms: actualDurationMs,
      total_paused_ms: finalPausedMs,
      paused_at: null,
      status: wasOnTime ? SlaTimerStatus.COMPLETED_ON_TIME : SlaTimerStatus.COMPLETED_LATE,
    });

    this.logger.log(
      `SLA ${timerType} timer completed for WO ${workOrderId}: ` +
      `${Math.round(actualDurationMs / 60000)}min (${wasOnTime ? 'ON TIME' : 'LATE'})`,
    );
    return timer.reload();
  }

  async pauseTimerByType(workOrderId: string, timerType: SlaTimerType): Promise<SlaTimer | null> {
    const timer = await this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: timerType, is_deleted: false },
    });
    if (!timer || timer.paused_at || ['completed_on_time', 'completed_late'].includes(timer.status)) {
      return timer ?? null;
    }
    await timer.update({ paused_at: new Date(), status: SlaTimerStatus.PAUSED });
    return timer.reload();
  }

  async resumeTimerByType(workOrderId: string, timerType: SlaTimerType): Promise<SlaTimer | null> {
    const timer = await this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: timerType, is_deleted: false },
    });
    if (!timer || !timer.paused_at) return timer ?? null;

    const pauseDurationMs = Date.now() - new Date(timer.paused_at).getTime();
    const newTotalPausedMs = Number(timer.total_paused_ms) + pauseDurationMs;
    const newDeadline = new Date(new Date(timer.deadline_at).getTime() + pauseDurationMs);

    const elapsedMs = Date.now() - new Date(timer.started_at).getTime() - newTotalPausedMs;
    const percentUsed = elapsedMs / Number(timer.sla_duration_ms);
    let newStatus = SlaTimerStatus.RUNNING;
    if (percentUsed >= 1) newStatus = SlaTimerStatus.BREACHED;
    else if (percentUsed >= 0.75) newStatus = SlaTimerStatus.WARNING;

    await timer.update({
      paused_at: null,
      total_paused_ms: newTotalPausedMs,
      deadline_at: newDeadline,
      status: newStatus,
    });
    return timer.reload();
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────────────────────────

  private async findActiveTimer(workOrderId: string): Promise<SlaTimer | null> {
    return this.slaTimerRepository.findOne({
      where: { work_order_id: workOrderId, timer_type: SlaTimerType.WORK_COMPLETION, is_deleted: false },
    });
  }

  /**
   * Calculate SLA duration from historical completed sessions.
   * Queries last N completed jobs of the same tenant + category + priority,
   * computes the average actual working time, and adds a buffer.
   * Falls back to DEFAULT_SLA_MS if insufficient data.
   */
  private async calculateSlaDuration(
    tenantId: string,
    category: string | null,
    priority: string | null,
  ): Promise<{
    durationMs: number;
    sampleCount: number;
    source: SlaTimerSource;
  }> {
    try {
      // Build the where clause for matching work orders
      const woWhere: Record<string, unknown> = {
        tenant_id: tenantId,
        is_deleted: false,
      };
      if (category) {
        woWhere.category = category;
      }
      if (priority) {
        woWhere.priority = priority;
      }

      // Find completed sessions for matching work orders
      const completedSessions = await this.sessionRepository.findAll({
        where: {
          step: 'finished',
          is_deleted: false,
          finished_at: { [Op.ne]: null },
        },
        include: [
          {
            model: WorkOrder,
            as: 'work_order',
            where: woWhere,
            attributes: ['id'],
            required: true,
          },
        ],
        attributes: ['id', 'work_order_id', 'created_at', 'finished_at'],
        order: [['finished_at', 'DESC']],
        limit: HISTORICAL_LIMIT,
      });

      if (completedSessions.length < MIN_SAMPLE_COUNT) {
        this.logger.log(
          `Insufficient historical data: ${completedSessions.length}/${MIN_SAMPLE_COUNT} samples ` +
          `(category=${category}, priority=${priority}). Using default ${DEFAULT_SLA_MS / 60000}min`,
        );
        return {
          durationMs: DEFAULT_SLA_MS,
          sampleCount: completedSessions.length,
          source: SlaTimerSource.DEFAULT,
        };
      }

      // Calculate average duration, accounting for any SLA pause time
      const durations: number[] = [];
      for (const session of completedSessions) {
        const sessionDurationMs =
          new Date(session.finished_at).getTime() - new Date(session.created_at).getTime();

        // Check if there's an SLA timer for this session to subtract pause time
        const slaTimer = await this.slaTimerRepository.findOne({
          where: { work_order_id: session.work_order_id, timer_type: SlaTimerType.WORK_COMPLETION, is_deleted: false },
          attributes: ['total_paused_ms'],
        });

        const pausedMs = slaTimer ? Number(slaTimer.total_paused_ms) : 0;
        const actualWorkMs = sessionDurationMs - pausedMs;

        if (actualWorkMs > 0) {
          durations.push(actualWorkMs);
        }
      }

      if (durations.length < MIN_SAMPLE_COUNT) {
        return {
          durationMs: DEFAULT_SLA_MS,
          sampleCount: durations.length,
          source: SlaTimerSource.DEFAULT,
        };
      }

      const avgDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
      const bufferedDurationMs = Math.round(avgDurationMs * HISTORICAL_BUFFER);

      // Enforce reasonable bounds: minimum 1hr for work completion, maximum 24hr
      const MIN_WORK_COMPLETION_MS = 60 * 60 * 1000;
      const finalDurationMs = Math.max(
        MIN_WORK_COMPLETION_MS,
        Math.min(bufferedDurationMs, 24 * 60 * 60 * 1000),
      );

      this.logger.log(
        `Historical SLA calculated: avg=${Math.round(avgDurationMs / 60000)}min ` +
        `(+${Math.round((HISTORICAL_BUFFER - 1) * 100)}% buffer = ${Math.round(finalDurationMs / 60000)}min) ` +
        `from ${durations.length} samples (category=${category}, priority=${priority})`,
      );

      return {
        durationMs: finalDurationMs,
        sampleCount: durations.length,
        source: SlaTimerSource.HISTORICAL_AVG,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate historical SLA: ${error.message}`, error.stack);
      return {
        durationMs: DEFAULT_SLA_MS,
        sampleCount: 0,
        source: SlaTimerSource.DEFAULT,
      };
    }
  }
}
