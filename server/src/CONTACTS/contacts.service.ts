import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { REPOSITORY } from '../shared/constants/keynames';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { Contact } from './contacts.entity';
import { CreateContactDto } from './dto/contacts_create.dto';
import { UpdateContactDto } from './dto/contacts_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { PageDto } from '../shared/dto/page.dto';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(REPOSITORY.CONTACTS)
    private readonly contactRepository: typeof Contact,
    private readonly activityLogsService: ActivityLogsService,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Contact>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.company_id) {
      where.company_id = pageOptionsDto.company_id;
    }

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { first_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { last_name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { email: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { phone: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.contactRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string, companyId?: string): Promise<Contact[]> {
    const where: any = { tenant_id: tenantId, is_deleted: false };
    if (companyId) {
      where.company_id = companyId;
    }
    return this.contactRepository.findAll({
      where,
      order: [['first_name', 'ASC'], ['last_name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Contact> {
    const { User } = await import('../USERS/users.entity');
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'updater', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async create(tenantId: string, dto: CreateContactDto, userId: string): Promise<Contact> {
    // Check for duplicate email if provided
    if (dto.email) {
      const existing = await this.contactRepository.findOne({
        where: {
          email: dto.email,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });
      if (existing) {
        throw new ConflictException('Contact with this email already exists');
      }
    }

    const contact = await this.contactRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      ...dto,
    });

    await this.activityLogsService.logActivity(
      tenantId,
      'Contact',
      contact.id,
      'CREATED',
      `Contact ${contact.first_name} ${contact.last_name} was created.`,
    );

    return this.findById(contact.id, tenantId);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateContactDto,
    userId: string,
  ): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Check for duplicate email if being updated
    if (dto.email && dto.email !== contact.email) {
      const existing = await this.contactRepository.findOne({
        where: {
          email: dto.email,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        throw new ConflictException('Contact with this email already exists');
      }
    }

    const diffArray = generateEntityDiff(contact, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== ''
      ? diffString
      : 'Contact details were updated.';

    await contact.update({ ...dto, updated_by: userId });

    await this.activityLogsService.logActivity(
      tenantId,
      'Contact',
      contact.id,
      'UPDATED',
      description,
    );

    return this.findById(contact.id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const contact = await this.contactRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Soft delete
    await contact.update({ is_deleted: true });
  }

  async getInsights(id: string, tenantId: string) {
    try {
      const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
      const { Invoice } = await import('../INVOICES/invoices.entity');
      const { ServiceRequest } = await import('../SERVICE_REQUESTS/service_requests.entity');
      const { Estimate } = await import('../ESTIMATES/estimates.entity');
      const { ServiceAppointment } = await import('../SERVICE_APPOINTMENTS/service_appointments.entity');
      const { ServiceLocation } = await import('../SERVICE_LOCATIONS/service_locations.entity');

    // 1. Get all Service Locations for this contact
    const locations = await ServiceLocation.findAll({ 
      where: { contact_id: id, tenant_id: tenantId, is_deleted: false },
      attributes: ['id']
    });
    const locationIds = locations.map(l => l.id);

    const locationOrContactWhere = locationIds.length > 0 
      ? { [Op.or]: [{ contact_id: id }, { location_id: { [Op.in]: locationIds } }] }
      : { contact_id: id };

    // Requests
    const open_requests = await ServiceRequest.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...locationOrContactWhere,
        status: { [Op.notIn]: ['closed', 'rejected', 'converted_to_wo', 'spam'] }
      } 
    });

    // Work Orders (We also fetch IDs to use for Appointments/Invoices/Estimates)
    const workOrders = await WorkOrder.findAll({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...locationOrContactWhere
      },
      attributes: ['id']
    });
    const workOrderIds = workOrders.map(wo => wo.id);

    const open_work_orders = await WorkOrder.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...locationOrContactWhere,
        status: { [Op.notIn]: ['completed', 'cancelled', 'closed'] }
      } 
    });
    
    const now = new Date();
    const overdue_work_orders = await WorkOrder.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...locationOrContactWhere,
        status: { [Op.notIn]: ['completed', 'cancelled', 'closed'] },
        scheduled_end: { [Op.lt]: now }
      } 
    });

    // Estimates
    const estimateWhere = workOrderIds.length > 0
      ? { [Op.or]: [{ contact_id: id }, { work_order_id: { [Op.in]: workOrderIds } }] }
      : { contact_id: id };

    const open_estimates = await Estimate.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...estimateWhere,
        status: { [Op.notIn]: ['approved', 'rejected', 'expired'] }
      } 
    });

    // Amount Generated from Work Orders (via invoices)
    const invoiceWhere = workOrderIds.length > 0
      ? { [Op.or]: [{ contact_id: id }, { work_order_id: { [Op.in]: workOrderIds } }] }
      : { contact_id: id };

    const paidInvoices = await Invoice.findAll({
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        status: 'paid', 
        ...invoiceWhere
      },
      attributes: [[this.contactRepository.sequelize!.fn('SUM', this.contactRepository.sequelize!.cast(this.contactRepository.sequelize!.col('total'), 'NUMERIC')), 'total']]
    });
    const amount_generated_from_work_orders = Number(paidInvoices[0]?.get('total')) || 0;

    // Appointments
    const open_service_appointments = workOrderIds.length > 0 ? await ServiceAppointment.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        work_order_id: { [Op.in]: workOrderIds },
        status: { [Op.notIn]: ['completed', 'cancelled', 'no_show'] }
      } 
    }) : 0;

    const overdue_service_appointments = workOrderIds.length > 0 ? await ServiceAppointment.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        work_order_id: { [Op.in]: workOrderIds },
        status: { [Op.notIn]: ['completed', 'cancelled', 'no_show'] },
        scheduled_start: { [Op.lt]: now }
      } 
    }) : 0;

    const overdue_invoices = await Invoice.count({ 
      where: { 
        tenant_id: tenantId, is_deleted: false, 
        ...invoiceWhere,
        status: { [Op.notIn]: ['paid', 'void', 'draft'] },
        due_date: { [Op.lt]: now }
      } 
    });

      return {
        open_requests,
        open_estimates,
        open_work_orders,
        open_service_appointments,
        overdue_work_orders,
        overdue_service_appointments,
        overdue_invoices,
        amount_generated_from_work_orders,
      };
    } catch (error: any) {
      console.error('--- INSIGHTS CRASH ---', error);
      import('@nestjs/common').then(({ BadRequestException }) => {
        throw new BadRequestException(error.message || 'Failed to fetch insights due to a database error');
      });
      // Fallback while exception resolves
      return {
        open_requests: 0,
        open_estimates: 0,
        open_work_orders: 0,
        open_service_appointments: 0,
        overdue_work_orders: 0,
        overdue_service_appointments: 0,
        overdue_invoices: 0,
        amount_generated_from_work_orders: 0,
      };
    }
  }

  async importCsv(fileBuffer: Buffer, tenantId: string, userId: string): Promise<any> {
    const Papa = require('papaparse');
    const csvString = fileBuffer.toString('utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          const rows = results.data;
          let imported = 0;
          let failed = 0;

          for (const row of rows as any[]) {
            try {
              const firstName = row['First Name'] || row.first_name;
              const lastName = row['Last Name'] || row.last_name;
              const email = row['Email'] || row.email;
              const phone = row['Phone'] || row.phone;

              if (!firstName || !lastName || !email) {
                failed++;
                continue;
              }

              const existing = await this.contactRepository.findOne({
                where: { email: email, tenant_id: tenantId, is_deleted: false }
              });

              if (existing) {
                await existing.update({
                  first_name: firstName || existing.first_name,
                  last_name: lastName || existing.last_name,
                  phone: phone || existing.phone,
                  updated_by: userId
                });
                imported++;
              } else {
                await this.contactRepository.create({
                  tenant_id: tenantId,
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
                  phone: phone,
                  created_by: userId,
                  updated_by: userId
                });
                imported++;
              }
            } catch (err) {
              failed++;
            }
          }

          resolve({ imported, failed, total: rows.length });
        },
        error: (error: any) => reject(error)
      });
    });
  }

  async exportCsv(tenantId: string, ids?: string[]): Promise<string> {
    const { Parser } = require('json2csv');
    const { User } = await import('../USERS/users.entity');
    const { Company } = await import('../COMPANIES/companies.entity');

    const whereClause: any = { tenant_id: tenantId, is_deleted: false };
    if (ids && ids.length > 0) {
      whereClause.id = { [Op.in]: ids };
    }

    const records = await this.contactRepository.findAll({
      where: whereClause,
      include: [
        { model: Company, attributes: ['name'] },
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (!records || records.length === 0) {
      return '';
    }

    const exportData = records.map((record: any) => ({
      'First Name': record.first_name,
      'Last Name': record.last_name,
      'Company': record.company?.name || '',
      'Email': record.email,
      'Phone': record.phone,
      'Created By': record.creator ? `${record.creator.first_name} ${record.creator.last_name}` : '',
      'Created At': new Date(record.created_at).toLocaleString()
    }));

    const json2csvParser = new Parser();
    return json2csvParser.parse(exportData);
  }

  async changeOwner(recordIds: string[], newOwnerId: string, tenantId: string, userId: string): Promise<void> {
    await this.contactRepository.update(
      { created_by: newOwnerId, updated_by: userId },
      { 
        where: { 
          id: { [Op.in]: recordIds }, 
          tenant_id: tenantId, 
          is_deleted: false 
        } 
      }
    );
  }

  async mergeRecords(masterId: string, duplicateId: string, tenantId: string, userId: string): Promise<void> {
    const master = await this.findById(masterId, tenantId);
    const duplicate = await this.findById(duplicateId, tenantId);

    if (!master || !duplicate) {
      throw new NotFoundException('Master or Duplicate record not found');
    }

    const sequelize = this.contactRepository.sequelize;
    if (!sequelize) {
      throw new ConflictException('Sequelize instance not found');
    }

    const transaction = await sequelize.transaction();

    try {
      const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
      const { Invoice } = await import('../INVOICES/invoices.entity');
      const { ServiceRequest } = await import('../SERVICE_REQUESTS/service_requests.entity');
      const { Estimate } = await import('../ESTIMATES/estimates.entity');
      const { ServiceLocation } = await import('../SERVICE_LOCATIONS/service_locations.entity');
      const { Asset } = await import('../ASSETS/assets.entity');
      const { ActivityLog } = await import('../ACTIVITY_LOGS/activity_logs.entity');

      await WorkOrder.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      await Invoice.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      await ServiceRequest.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      await Estimate.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      await ServiceLocation.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      await Asset.update({ contact_id: masterId }, { where: { contact_id: duplicateId, tenant_id: tenantId }, transaction });
      
      // Update Activity Logs
      await ActivityLog.update({ entity_id: masterId }, { where: { entity_id: duplicateId, entity_type: 'Contact', tenant_id: tenantId }, transaction });

      // Merge empty fields from duplicate to master if master is missing them
      const updateData: any = {};
      if (!master.phone && duplicate.phone) updateData.phone = duplicate.phone;
      if (!master.company_id && duplicate.company_id) updateData.company_id = duplicate.company_id;
      
      if (Object.keys(updateData).length > 0) {
        await master.update(updateData, { transaction });
      }

      // Soft delete the duplicate
      await duplicate.update({ is_deleted: true, updated_by: userId }, { transaction });

      // Log the merge
      await this.activityLogsService.logActivity(
        tenantId,
        'Contact',
        masterId,
        'MERGED',
        `Contact ${duplicate.first_name} ${duplicate.last_name} (${duplicate.email}) was merged into this record.`,
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
