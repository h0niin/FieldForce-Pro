import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { WorkingCalendar } from './working_calendars.entity';
import { SlaEscalation } from './sla_escalations.entity';
import { SlaPauseTrigger } from './sla_pause_triggers.entity';

@Injectable()
export class SlaConfigService {
  constructor(
    @Inject(KEYNAMES.SLA_POLICIES)
    private readonly slaPolicyRepository: typeof SlaPolicy,
    @Inject(KEYNAMES.WORKING_CALENDARS)
    private readonly workingCalendarRepository: typeof WorkingCalendar,
    @Inject(KEYNAMES.SLA_ESCALATIONS)
    private readonly slaEscalationRepository: typeof SlaEscalation,
    @Inject(KEYNAMES.SLA_PAUSE_TRIGGERS)
    private readonly slaPauseTriggerRepository: typeof SlaPauseTrigger,
  ) {}

  async findAllPolicies(tenantId: string) {
    return this.slaPolicyRepository.findAll({ where: { tenant_id: tenantId, is_deleted: false } });
  }

  async createPolicy(tenantId: string, data: any) {
    return this.slaPolicyRepository.create({ ...data, tenant_id: tenantId });
  }

  async findAllCalendars(tenantId: string) {
    return this.workingCalendarRepository.findAll({ where: { tenant_id: tenantId } });
  }

  async createCalendar(tenantId: string, data: any) {
    return this.workingCalendarRepository.create({ ...data, tenant_id: tenantId });
  }

  async findAllEscalations(tenantId: string) {
    return this.slaEscalationRepository.findAll({ where: { tenant_id: tenantId } });
  }

  async createEscalation(tenantId: string, data: any) {
    return this.slaEscalationRepository.create({ ...data, tenant_id: tenantId });
  }

  async findAllPauseTriggers(tenantId: string) {
    return this.slaPauseTriggerRepository.findAll({ where: { tenant_id: tenantId } });
  }

  async createPauseTrigger(tenantId: string, data: any) {
    return this.slaPauseTriggerRepository.create({ ...data, tenant_id: tenantId });
  }
}
