import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkOrderTechnicianSession } from './work_order_technician_sessions.entity';
import { TechnicianSessionTripDto } from './dto/technician_session_trip.dto';
import { TechnicianSessionFinishDto } from './dto/technician_session_finish.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { WorkOrdersService } from '../WORK_ORDERS/work_orders.service';
import { NotificationsService } from '../NOTIFICATIONS/notifications.service';
import { UsersService } from '../USERS/users.service';
import { TripsService } from '../TRIPS/trips.service';
import { CreateTripDto } from '../TRIPS/dto/trips_create.dto';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { SlaTimersService } from '../SLA_TIMERS/sla_timers.service';
import { SlaTimerType } from '../SLA_TIMERS/sla_timers.entity';

@Injectable()
export class WorkOrderTechnicianSessionsService {
  private readonly logger = new Logger(WorkOrderTechnicianSessionsService.name);

  constructor(
    @Inject(KEYNAMES.WORK_ORDER_TECHNICIAN_SESSIONS)
    private readonly sessionRepository: typeof WorkOrderTechnicianSession,
    @Inject(KEYNAMES.SERVICE_APPOINTMENTS)
    private readonly serviceAppointmentRepository: typeof ServiceAppointment,
    private readonly workOrdersService: WorkOrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly tripsService: TripsService,
    private readonly slaTimersService: SlaTimersService,
  ) {}

  async getSession(
    tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrderTechnicianSession | null> {
    return this.sessionRepository.findOne({
      where: { tenant_id: tenantId, work_order_id: workOrderId, is_deleted: false },
    });
  }

  async getOrCreateSession(
    tenantId: string,
    workOrderId: string,
    technicianId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const existing = await this.getSession(tenantId, workOrderId);
    if (existing) return existing;

    const session = await this.sessionRepository.create({
      tenant_id: tenantId,
      work_order_id: workOrderId,
      technician_id: technicianId,
      step: 'pending_approval',
    });

    // Set assigned_to on the work order
    try {
      const wo = await this.workOrdersService.findById(workOrderId, tenantId);
      if (!wo.assigned_to) {
        await wo.update({ assigned_to: technicianId });
      }
    } catch (err) {
      this.logger.error(`[getOrCreateSession] Failed to set assigned_to for WO ${workOrderId}: ${err.message}`);
    }

    // Start acceptance + total_resolution SLA timers
    try {
      await Promise.all([
        this.slaTimersService.createTimer(tenantId, workOrderId, technicianId, session.id, SlaTimerType.ACCEPTANCE),
        this.slaTimersService.createTimer(tenantId, workOrderId, technicianId, session.id, SlaTimerType.TOTAL_RESOLUTION),
      ]);
    } catch (err) {
      this.logger.error(`[getOrCreateSession] Failed to create SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    return session;
  }

  private async requireSession(
    tenantId: string,
    workOrderId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.getSession(tenantId, workOrderId);
    if (!session) {
      throw new NotFoundException('Technician session not found for this work order');
    }
    return session;
  }

  private requireTechnician(session: WorkOrderTechnicianSession, userId: string): void {
    if (session.technician_id !== userId) {
      throw new ForbiddenException('Only the assigned technician can perform this action');
    }
  }

  async approve(tenantId: string, workOrderId: string, userId: string): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'pending_approval') {
      throw new BadRequestException(`Cannot approve from step '${session.step}'`);
    }

    await session.update({ step: 'approved', approved_at: new Date() });

    // Sync linked appointment(s) to in_progress as soon as technician accepts
    await this.syncAppointmentStatus(tenantId, workOrderId, 'in_progress');

    const workOrder = await this.workOrdersService.findById(workOrderId, tenantId);
    const technician = await this.usersService.findById(userId);

    // Complete acceptance SLA timer and start work_completion timer
    try {
      await this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.ACCEPTANCE);
      await this.slaTimersService.createTimerForSession(
        tenantId,
        workOrderId,
        userId,
        session.id,
      );
    } catch (err) {
      this.logger.error(`[approve] Failed to manage SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    await this.notifyTenantUsers(tenantId, workOrderId, {
      type: 'technician_session_approved',
      title: 'Technician Approved Work Order',
      body: `Technician ${technician.first_name} ${technician.last_name} approved WO #${workOrder.wo_number}`,
    }, userId);

    return session.reload();
  }

  async reject(
    tenantId: string,
    workOrderId: string,
    userId: string,
    reason: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (!['pending_approval', 'approved'].includes(session.step)) {
      throw new BadRequestException(`Cannot reject from step '${session.step}'`);
    }

    await session.update({
      step: 'rejected',
      rejection_reason: reason,
      rejected_at: new Date(),
    });

    // Complete acceptance + total_resolution SLA timers on rejection
    try {
      await Promise.all([
        this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.ACCEPTANCE),
        this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.TOTAL_RESOLUTION),
      ]);
    } catch (err) {
      this.logger.error(`[reject] Failed to complete SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    // Sync linked appointment(s) to cancelled when technician rejects
    await this.syncAppointmentStatus(tenantId, workOrderId, 'cancelled');

    const workOrder = await this.workOrdersService.findById(workOrderId, tenantId);
    const technician = await this.usersService.findById(userId);
    await this.notifyTenantUsers(tenantId, workOrderId, {
      type: 'technician_session_rejected',
      title: 'Technician Rejected Work Order',
      body: `Technician ${technician.first_name} ${technician.last_name} rejected WO #${workOrder.wo_number}: ${reason}`,
    }, userId);

    return session.reload();
  }

  async startTrip(
    tenantId: string,
    workOrderId: string,
    userId: string,
    dto: TechnicianSessionTripDto,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'approved') {
      throw new BadRequestException(`Cannot start trip from step '${session.step}'`);
    }

    await session.update({
      step: 'trip_started',
      trip_started_at: new Date(),
      trip_start_lat: dto.start_lat,
      trip_start_lng: dto.start_lng,
      trip_start_type: dto.trip_start_type || 'manual',
    });

    // Start travel SLA timer
    try {
      await this.slaTimersService.createTimer(tenantId, workOrderId, userId, session.id, SlaTimerType.TRAVEL);
    } catch (err) {
      this.logger.error(`[startTrip] Failed to create travel SLA timer for WO ${workOrderId}: ${err.message}`);
    }

    // Ensure linked appointment(s) are in_progress (safety net if approve() sync was missed)
    await this.syncAppointmentStatus(tenantId, workOrderId, 'in_progress');

    // Create a trips record so this shows in Trip History
    try {
      await this.tripsService.startTrip(tenantId, {
        user_id: userId,
        work_order_id: workOrderId,
        start_lat: dto.start_lat,
        start_lng: dto.start_lng,
        start_time: new Date().toISOString(),
      } as CreateTripDto);
    } catch (err) {
      console.error('[TechnicianSession] Failed to create trip record:', err);
    }

    return session.reload();
  }

  async markReached(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'trip_started') {
      throw new BadRequestException(`Cannot mark reached from step '${session.step}'`);
    }

    await session.update({ step: 'reached', reached_at: new Date() });

    // Complete travel SLA timer, start on_site_prep timer
    try {
      await this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.TRAVEL);
      await this.slaTimersService.createTimer(tenantId, workOrderId, userId, session.id, SlaTimerType.ON_SITE_PREP);
    } catch (err) {
      this.logger.error(`[markReached] Failed to manage SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    // End the trips record — technician has arrived at destination
    try {
      const workOrder = await this.workOrdersService.findById(workOrderId, tenantId);
      const endLat = workOrder.location?.lat ? Number(workOrder.location.lat) : null;
      const endLng = workOrder.location?.lng ? Number(workOrder.location.lng) : null;
      await this.tripsService.endTripByWorkOrder(tenantId, workOrderId, endLat, endLng);
    } catch (err) {
      console.error('[TechnicianSession] Failed to end trip record:', err);
    }

    return session.reload();
  }

  async confirmItems(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'reached') {
      throw new BadRequestException(`Cannot confirm items from step '${session.step}'`);
    }

    await session.update({ step: 'items_confirmed', items_confirmed_at: new Date() });
    return session.reload();
  }

  async confirmCall(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'items_confirmed') {
      throw new BadRequestException(`Cannot confirm call from step '${session.step}'`);
    }

    await session.update({ step: 'call_confirmed', call_confirmed_at: new Date() });
    return session.reload();
  }

  async startWork(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'call_confirmed') {
      throw new BadRequestException(`Cannot start work from step '${session.step}'`);
    }

    await session.update({
      step: 'work_started',
      work_started_at: new Date(),
      before_photos_at: new Date(),
    });

    // Complete on_site_prep SLA timer
    try {
      await this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.ON_SITE_PREP);
    } catch (err) {
      this.logger.error(`[startWork] Failed to complete on_site_prep SLA timer for WO ${workOrderId}: ${err.message}`);
    }

    try {
      await this.workOrdersService.setStatus(workOrderId, tenantId, 'in_progress');
    } catch {
      // WO status transition may not be allowed — non-fatal
    }

    // Sync linked appointment(s) to in_progress
    await this.syncAppointmentStatus(tenantId, workOrderId, 'in_progress');

    const workOrder = await this.workOrdersService.findById(workOrderId, tenantId);
    const technician = await this.usersService.findById(userId);
    await this.notifyTenantUsers(tenantId, workOrderId, {
      type: 'technician_started_work',
      title: 'Technician Started Work',
      body: `Technician ${technician.first_name} ${technician.last_name} started work on WO #${workOrder.wo_number}`,
    }, userId);

    return session.reload();
  }

  async pauseWork(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'work_started') {
      throw new BadRequestException(`Cannot pause from step '${session.step}'`);
    }

    await session.update({ step: 'paused', paused_at: new Date() });

    // Pause work_completion + total_resolution SLA timers
    try {
      await Promise.all([
        this.slaTimersService.pauseTimer(workOrderId),
        this.slaTimersService.pauseTimerByType(workOrderId, SlaTimerType.TOTAL_RESOLUTION),
      ]);
    } catch (err) {
      this.logger.error(`[pauseWork] Failed to pause SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    try {
      await this.workOrdersService.setStatus(workOrderId, tenantId, 'on_hold');
    } catch {
      // Non-fatal
    }

    return session.reload();
  }

  async resumeWork(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'paused') {
      throw new BadRequestException(`Cannot resume from step '${session.step}'`);
    }

    await session.update({ step: 'work_started', resumed_at: new Date() });

    // Resume work_completion + total_resolution SLA timers
    try {
      await Promise.all([
        this.slaTimersService.resumeTimer(workOrderId),
        this.slaTimersService.resumeTimerByType(workOrderId, SlaTimerType.TOTAL_RESOLUTION),
      ]);
    } catch (err) {
      this.logger.error(`[resumeWork] Failed to resume SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    try {
      await this.workOrdersService.setStatus(workOrderId, tenantId, 'in_progress');
    } catch {
      // Non-fatal
    }

    return session.reload();
  }

  async markBeforePhotos(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'work_started') {
      throw new BadRequestException(`Cannot mark before photos from step '${session.step}'`);
    }

    await session.update({ step: 'after_photos', before_photos_at: new Date() });
    return session.reload();
  }

  async markAfterPhotos(
    tenantId: string,
    workOrderId: string,
    userId: string,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'after_photos') {
      throw new BadRequestException(`Cannot mark after photos from step '${session.step}'`);
    }

    await session.update({ step: 'after_photos', after_photos_at: new Date() });
    return session.reload();
  }

  async finish(
    tenantId: string,
    workOrderId: string,
    userId: string,
    dto: TechnicianSessionFinishDto,
  ): Promise<WorkOrderTechnicianSession> {
    const session = await this.requireSession(tenantId, workOrderId);
    this.requireTechnician(session, userId);

    if (session.step !== 'after_photos') {
      throw new BadRequestException(`Cannot finish from step '${session.step}'`);
    }

    const now = new Date();
    await session.update({
      step: 'finished',
      after_photos_at: session.after_photos_at ?? now,
      finished_at: now,
    });

    try {
      await this.workOrdersService.setStatus(workOrderId, tenantId, 'completed');
    } catch {
      // Non-fatal
    }

    // Sync linked appointment(s) to completed
    await this.syncAppointmentStatus(tenantId, workOrderId, 'completed');

    // Complete ALL SLA timers (safety net for any still running)
    try {
      await Promise.all([
        this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.TRAVEL),
        this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.ON_SITE_PREP),
        this.slaTimersService.completeTimer(workOrderId),
        this.slaTimersService.completeTimerByType(workOrderId, SlaTimerType.TOTAL_RESOLUTION),
      ]);
    } catch (err) {
      this.logger.error(`[finish] Failed to complete SLA timers for WO ${workOrderId}: ${err.message}`);
    }

    const workOrder = await this.workOrdersService.findById(workOrderId, tenantId);
    const technician = await this.usersService.findById(userId);
    await this.notifyTenantUsers(tenantId, workOrderId, {
      type: 'technician_finished_work',
      title: 'Technician Finished Work Order',
      body: `Technician ${technician.first_name} ${technician.last_name} finished WO #${workOrder.wo_number}`,
    }, userId);

    return session.reload();
  }

  /**
   * Update all linked service appointments for a work order to the given status.
   */
  private async syncAppointmentStatus(
    tenantId: string,
    workOrderId: string,
    status: 'in_progress' | 'completed' | 'cancelled',
  ): Promise<void> {
    try {
      this.logger.log(`[syncAppointmentStatus] Looking for appointments: WO=${workOrderId}, tenant=${tenantId}, target status=${status}`);

      const appointments = await this.serviceAppointmentRepository.findAll({
        where: {
          work_order_id: workOrderId,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });

      this.logger.log(`[syncAppointmentStatus] Found ${appointments.length} appointment(s) for WO ${workOrderId}`);

      for (const appt of appointments) {
        this.logger.log(`[syncAppointmentStatus] Appointment ${appt.id} current status='${appt.status}'`);
        // Only update if the appointment isn't already in a terminal state
        if (appt.status !== 'completed' && appt.status !== 'cancelled') {
          await appt.update({ status });
          this.logger.log(`[syncAppointmentStatus] Appointment ${appt.id} status synced to '${status}' (WO: ${workOrderId})`);
        } else {
          this.logger.log(`[syncAppointmentStatus] Skipping appointment ${appt.id} — already in terminal state '${appt.status}'`);
        }
      }
    } catch (error) {
      this.logger.error(`[syncAppointmentStatus] FAILED for WO ${workOrderId}: ${error.message}`, error.stack);
    }
  }

  private async notifyTenantUsers(
    tenantId: string,
    workOrderId: string,
    payload: { type: string; title: string; body: string },
    excludeUserId?: string,
  ): Promise<void> {
    try {
      // Notify only admin-role users — not managers, technicians, or other roles
      const users = await this.usersService.findAdmins(tenantId);
      const recipients = excludeUserId
        ? users.filter((u) => u.id !== excludeUserId)
        : users;

      for (const user of recipients) {
        await this.notificationsService.create(tenantId, {
          user_id: user.id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: {
            work_order_id: workOrderId,
            document_type: 'FIELD_WORKFLOW',
            entity_id: workOrderId,
            link: `/work-orders?wo_id=${workOrderId}#field-workflow`,
          },
          channel: 'in_app',
        });
      }
    } catch {
      // Notification failure is non-fatal — don't break the main flow
    }
  }
}
