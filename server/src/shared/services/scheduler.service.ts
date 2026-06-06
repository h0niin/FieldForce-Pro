import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SlaTimersService } from '../../SLA_TIMERS/sla_timers.service';
import { NotificationsService } from '../../NOTIFICATIONS/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly slaTimersService: SlaTimersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Check for SLA breaches and send warnings
   * Runs every 5 minutes
   */
  @Cron('*/5 * * * *')
  async checkSLABreaches(): Promise<void> {
    this.logger.log('🔍 SLA breach check started');

    try {
      const { breached, warning90, warning75 } =
        await this.slaTimersService.findTimersNeedingAttention();

      // Process breached timers
      if (breached.length > 0) {
        this.logger.warn(`🚨 ${breached.length} SLA timer(s) BREACHED`);
        for (const timer of breached) {
          try {
            await this.notificationsService.create(timer.tenant_id, {
              user_id: timer.technician_id,
              type: 'sla_breach',
              title: '🚨 SLA Timer Breached',
              body: `The SLA deadline for this work order has passed. Please complete the job as soon as possible.`,
              data: {
                work_order_id: timer.work_order_id,
                sla_timer_id: timer.id,
                document_type: 'SLA_BREACH',
                entity_id: timer.work_order_id,
                link: `/work-orders?wo_id=${timer.work_order_id}`,
              },
              channel: 'in_app',
            });
          } catch (err) {
            this.logger.error(`Failed to send breach notification for timer ${timer.id}: ${err.message}`);
          }
        }
        await this.slaTimersService.markBreached(breached.map((t) => t.id));
      }

      // Process 90% warning timers
      if (warning90.length > 0) {
        this.logger.warn(`⚠️ ${warning90.length} SLA timer(s) at 90% threshold`);
        for (const timer of warning90) {
          try {
            const remainingMs = new Date(timer.deadline_at).getTime() - Date.now();
            const remainingMin = Math.max(0, Math.round(remainingMs / 60000));
            await this.notificationsService.create(timer.tenant_id, {
              user_id: timer.technician_id,
              type: 'sla_warning_critical',
              title: '⚠️ SLA Deadline Critical',
              body: `Only ${remainingMin} minute(s) remaining before SLA breach. Wrap up your work.`,
              data: {
                work_order_id: timer.work_order_id,
                sla_timer_id: timer.id,
                document_type: 'SLA_WARNING',
                entity_id: timer.work_order_id,
                link: `/work-orders?wo_id=${timer.work_order_id}`,
              },
              channel: 'in_app',
            });
          } catch (err) {
            this.logger.error(`Failed to send 90% warning for timer ${timer.id}: ${err.message}`);
          }
        }
        await this.slaTimersService.markWarning90(warning90.map((t) => t.id));
      }

      // Process 75% warning timers
      if (warning75.length > 0) {
        this.logger.log(`⏰ ${warning75.length} SLA timer(s) at 75% threshold`);
        for (const timer of warning75) {
          try {
            const remainingMs = new Date(timer.deadline_at).getTime() - Date.now();
            const remainingMin = Math.max(0, Math.round(remainingMs / 60000));
            await this.notificationsService.create(timer.tenant_id, {
              user_id: timer.technician_id,
              type: 'sla_warning',
              title: '⏰ SLA Deadline Approaching',
              body: `${remainingMin} minute(s) remaining before SLA deadline. Please plan accordingly.`,
              data: {
                work_order_id: timer.work_order_id,
                sla_timer_id: timer.id,
                document_type: 'SLA_WARNING',
                entity_id: timer.work_order_id,
                link: `/work-orders?wo_id=${timer.work_order_id}`,
              },
              channel: 'in_app',
            });
          } catch (err) {
            this.logger.error(`Failed to send 75% warning for timer ${timer.id}: ${err.message}`);
          }
        }
        await this.slaTimersService.markWarning75(warning75.map((t) => t.id));
      }

      const totalProcessed = breached.length + warning90.length + warning75.length;
      if (totalProcessed > 0) {
        this.logger.log(`SLA check complete: ${breached.length} breached, ${warning90.length} critical, ${warning75.length} warning`);
      }
    } catch (error) {
      this.logger.error(`SLA breach check failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Check for overdue invoices and mark them as overdue
   * Runs daily at midnight
   */
  @Cron('0 0 * * *')
  async checkOverdueInvoices(): Promise<void> {
    this.logger.log('💰 OVERDUE INVOICE CHECK — placeholder (not yet implemented)');
  }

  /**
   * Mark expired estimates
   * Runs daily at midnight
   */
  @Cron('0 0 * * *')
  async markExpiredEstimates(): Promise<void> {
    this.logger.log('📋 EXPIRED ESTIMATE CHECK — placeholder (not yet implemented)');
  }

  /**
   * Send reminder notifications
   * Runs every 4 hours
   */
  @Cron('0 */4 * * *')
  async sendReminders(): Promise<void> {
    this.logger.log('🔔 REMINDER NOTIFICATIONS — placeholder (not yet implemented)');
  }

  /**
   * Manual trigger for SLA breach check (for testing)
   */
  async triggerSLACheck(): Promise<void> {
    await this.checkSLABreaches();
  }

  /**
   * Manual trigger for overdue invoice check (for testing)
   */
  async triggerOverdueInvoiceCheck(): Promise<void> {
    await this.checkOverdueInvoices();
  }

  /**
   * Manual trigger for expired estimate check (for testing)
   */
  async triggerExpiredEstimateCheck(): Promise<void> {
    await this.markExpiredEstimates();
  }

  /**
   * Manual trigger for reminder notifications (for testing)
   */
  async triggerReminderCheck(): Promise<void> {
    await this.sendReminders();
  }
}
