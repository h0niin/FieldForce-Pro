import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { WorkingCalendar } from './working_calendars.entity';
import { SlaEscalation } from './sla_escalations.entity';
import { SlaPauseTrigger } from './sla_pause_triggers.entity';
import { Category } from '../CATEGORIES/categories.entity';
import { SubCategory } from '../SUB_CATEGORIES/sub_categories.entity';
import { Priority } from '../PRIORITIES/priorities.entity';
import { Location } from '../LOCATIONS/locations.entity';

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
    @Inject(KEYNAMES.CATEGORIES)
    private readonly categoryRepository: typeof Category,
    @Inject(KEYNAMES.SUB_CATEGORIES)
    private readonly subCategoryRepository: typeof SubCategory,
    @Inject(KEYNAMES.PRIORITIES)
    private readonly priorityRepository: typeof Priority,
    @Inject(KEYNAMES.LOCATIONS)
    private readonly locationRepository: typeof Location,
  ) {}

  private readonly logger = new Logger(SlaConfigService.name);

  async findAllPolicies(tenantId: string) {
    return this.slaPolicyRepository.findAll({ where: { tenant_id: tenantId, is_deleted: false }, order: [['created_at', 'DESC']] });
  }

  async createPolicy(tenantId: string, data: any) {
    console.log('--- SLA SUBMISSION PAYLOAD ---', JSON.stringify(data, null, 2));
    try {
      let workingCalendarId = data.working_calendar_id;
      if (!workingCalendarId) {
        const defaultCalendar = await this.workingCalendarRepository.findOne({
          where: { tenant_id: tenantId, is_default: true, is_active: true }
        });
        if (defaultCalendar) {
          workingCalendarId = defaultCalendar.id;
        }
      }

      if (data.category_id && String(data.category_id).trim() !== "") {
        const category = await this.categoryRepository.findByPk(data.category_id);
        if (!category) throw new BadRequestException('Validation Failed: Category ID provided is invalid.');
      }

      if (data.sub_category_id && String(data.sub_category_id).trim() !== "") {
        const subCategory = await this.subCategoryRepository.findByPk(data.sub_category_id);
        if (!subCategory) throw new BadRequestException('Validation Failed: Sub-category ID provided is invalid.');
      }

      if (data.priority_id && String(data.priority_id).trim() !== "") {
        const priority = await this.priorityRepository.findByPk(data.priority_id);
        if (!priority) throw new BadRequestException('Validation Failed: Priority ID provided is invalid.');
      }

      // TEMPORARY BYPASS: Location validation disabled pending architecture review.
      // The entity ID mismatch (Customer Location vs Territory/Zone) prevents valid lookups.
      // if (data.location_id && String(data.location_id).trim() !== '') {
      //   const location = await this.locationRepository.findOne({ where: { id: data.location_id } });
      //   if (!location) throw new BadRequestException('Validation Failed: Location ID provided is invalid.');
      // }

      const sanitizeUUID = (val: any) => (!val || String(val).trim() === '' ? null : val);

      return await this.slaPolicyRepository.create({
        ...data,
        category_id: sanitizeUUID(data.category_id),
        sub_category_id: sanitizeUUID(data.sub_category_id),
        priority_id: sanitizeUUID(data.priority_id),
        location_id: null, // TEMPORARY BYPASS: forced null until architecture is resolved
        tenant_id: tenantId,
        working_calendar_id: workingCalendarId,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create SLA Policy: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to create SLA Policy. Ensure all related entities (category, priority) are valid.');
    }
  }

  async updatePolicy(id: string, tenantId: string, data: any) {
    try {
      const policy = await this.slaPolicyRepository.findOne({ where: { id, tenant_id: tenantId, is_deleted: false } });
      if (!policy) throw new NotFoundException('SLA Policy not found');

      const sanitizeUUID = (val: any) => (!val || val === '' ? null : val);
      const updateData = { ...data };
      
      if ('category_id' in updateData) {
        updateData.category_id = sanitizeUUID(updateData.category_id);
        if (updateData.category_id) {
          const cat = await this.categoryRepository.findOne({ where: { id: updateData.category_id, tenant_id: tenantId } });
          if (!cat) throw new BadRequestException('Invalid Category ID provided.');
        }
      }
      
      if ('sub_category_id' in updateData) {
        updateData.sub_category_id = sanitizeUUID(updateData.sub_category_id);
        if (updateData.sub_category_id) {
          const subCat = await this.subCategoryRepository.findOne({ where: { id: updateData.sub_category_id, tenant_id: tenantId } });
          if (!subCat) throw new BadRequestException('Invalid Sub-category ID provided.');
        }
      }
      
      if ('priority_id' in updateData) {
        updateData.priority_id = sanitizeUUID(updateData.priority_id);
        if (updateData.priority_id) {
          const priority = await this.priorityRepository.findOne({ where: { id: updateData.priority_id, tenant_id: tenantId } });
          if (!priority) throw new BadRequestException('Invalid Priority ID provided.');
        }
      }
      
      if ('location_id' in updateData) {
        updateData.location_id = sanitizeUUID(updateData.location_id);
        if (updateData.location_id) {
          const location = await this.locationRepository.findOne({ where: { id: updateData.location_id, tenant_id: tenantId } });
          if (!location) throw new BadRequestException('Invalid Location ID provided.');
        }
      }

      await policy.update(updateData);
      return policy;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update SLA Policy: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update SLA Policy.');
    }
  }

  async deletePolicy(id: string, tenantId: string) {
    const policy = await this.slaPolicyRepository.findOne({ where: { id, tenant_id: tenantId, is_deleted: false } });
    if (!policy) throw new NotFoundException('SLA Policy not found');

    if (policy.name.startsWith('Default ')) {
      throw new BadRequestException('System Default rules cannot be deleted. You may set them to Inactive instead.');
    }

    await policy.update({ is_deleted: true, is_active: false });
  }

  async findAllCalendars(tenantId: string) {
    return this.workingCalendarRepository.findAll({ where: { tenant_id: tenantId } });
  }

  async createCalendar(tenantId: string, data: any) {
    try {
      return await this.workingCalendarRepository.create({ ...data, tenant_id: tenantId });
    } catch (error: any) {
      this.logger.error(`Failed to create Working Calendar: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create Working Calendar.');
    }
  }

  async updateCalendar(id: string, tenantId: string, data: any) {
    const calendar = await this.workingCalendarRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!calendar) throw new NotFoundException('Working Calendar not found');
    return calendar.update(data);
  }

  async deleteCalendar(id: string, tenantId: string) {
    const calendar = await this.workingCalendarRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!calendar) throw new NotFoundException('Working Calendar not found');
    if (calendar.is_default) throw new BadRequestException('Cannot delete default calendar');
    await calendar.destroy();
  }

  async findAllEscalations(tenantId: string) {
    return this.slaEscalationRepository.findAll({ 
      where: { tenant_id: tenantId },
      include: [{ model: SlaPolicy, as: 'policy', attributes: ['id', 'name'] }]
    });
  }

  async createEscalation(tenantId: string, data: any) {
    try {
      return await this.slaEscalationRepository.create({
        tenant_id: tenantId,
        sla_policy_id: data.sla_policy_id,
        name: `Escalation for Policy ${data.sla_policy_id.substring(0, 8)}`,
        target_type: data.trigger_type || 'warning',
        trigger_time_minutes: data.time_threshold_minutes,
        actions: { type: data.action },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create Escalation: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create Escalation Rule.');
    }
  }

  async updateEscalation(id: string, tenantId: string, data: any) {
    const escalation = await this.slaEscalationRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!escalation) throw new NotFoundException('Escalation not found');
    return escalation.update(data);
  }

  async deleteEscalation(id: string, tenantId: string) {
    const escalation = await this.slaEscalationRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!escalation) throw new NotFoundException('Escalation not found');
    await escalation.destroy();
  }

  async findAllPauseTriggers(tenantId: string) {
    return this.slaPauseTriggerRepository.findAll({ 
      where: { tenant_id: tenantId },
      include: [{ model: SlaPolicy, as: 'policy', attributes: ['id', 'name'] }]
    });
  }

  async createPauseTrigger(tenantId: string, data: any) {
    try {
      return await this.slaPauseTriggerRepository.create({
        tenant_id: tenantId,
        sla_policy_id: data.sla_policy_id,
        status_name: data.trigger_status,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create Pause Trigger: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create Pause Trigger.');
    }
  }

  async updatePauseTrigger(id: string, tenantId: string, data: any) {
    const trigger = await this.slaPauseTriggerRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!trigger) throw new NotFoundException('Pause trigger not found');
    return trigger.update(data);
  }

  async deletePauseTrigger(id: string, tenantId: string) {
    const trigger = await this.slaPauseTriggerRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!trigger) throw new NotFoundException('Pause trigger not found');
    await trigger.destroy();
  }
}
