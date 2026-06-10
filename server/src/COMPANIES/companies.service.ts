import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Company } from './companies.entity';
import { CreateCompanyDto } from './dto/companies_create.dto';
import { UpdateCompanyDto } from './dto/companies_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { ActivityLogsService } from '../ACTIVITY_LOGS/activity_logs.service';
import { generateEntityDiff } from '../utils/diff-logger.util';

@Injectable()
export class CompaniesService {
  constructor(
    @Inject(KEYNAMES.COMPANIES)
    private readonly companyRepository: typeof Company,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Company>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { industry: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
        { tax_id: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.companyRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows, meta);
  }

  async findAll(tenantId: string): Promise<Company[]> {
    return this.companyRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string, tenantId: string): Promise<Company> {
    const { User } = await import('../USERS/users.entity');
    const company = await this.companyRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: User, as: 'updater', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async create(tenantId: string, dto: CreateCompanyDto, userId: string): Promise<Company> {
    // Check for duplicate company name
    const existing = await this.companyRepository.findOne({
      where: {
        name: dto.name,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('Company with this name already exists');
    }

    const company = await this.companyRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      updated_by: userId,
      ...dto,
    });

    await this.activityLogsService.logActivity(
      tenantId,
      'Company',
      company.id,
      'CREATED',
      `Company ${company.name} was created.`,
    );

    return company;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateCompanyDto,
    userId: string,
  ): Promise<Company> {
    const company = await this.findById(id, tenantId);

    // If updating name, check for duplicates
    if (dto.name && dto.name !== company.name) {
      const existing = await this.companyRepository.findOne({
        where: {
          name: dto.name,
          tenant_id: tenantId,
          is_deleted: false,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        throw new ConflictException('Company with this name already exists');
      }
    }

    const diffArray = generateEntityDiff(company, dto);
    const diffString = diffArray.join(', ');
    const description = diffString !== '' 
      ? diffString
      : 'Company details were updated.';

    await company.update({ ...dto, updated_by: userId });

    await this.activityLogsService.logActivity(
      tenantId,
      'Company',
      company.id,
      'UPDATED',
      description,
    );

    return company;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const company = await this.findById(id, tenantId);
    await company.update({ is_deleted: true });
  }

  async getInsights(id: string, tenantId: string) {
    try {
      const { Asset } = await import('../ASSETS/assets.entity');
      const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
      const { Invoice } = await import('../INVOICES/invoices.entity');
      const { ServiceRequest } = await import('../SERVICE_REQUESTS/service_requests.entity');
      const { Estimate } = await import('../ESTIMATES/estimates.entity');
      const { ServiceAppointment } = await import('../SERVICE_APPOINTMENTS/service_appointments.entity');
      const { Contact } = await import('../CONTACTS/contacts.entity');
      const { ServiceLocation } = await import('../SERVICE_LOCATIONS/service_locations.entity');

    const contacts = await Contact.findAll({ where: { company_id: id, tenant_id: tenantId, is_deleted: false }, attributes: ['id'] });
    const assets = await Asset.findAll({ where: { company_id: id, tenant_id: tenantId, is_deleted: false }, attributes: ['id'] });
    const locations = await ServiceLocation.findAll({ where: { company_id: id, tenant_id: tenantId, is_deleted: false }, attributes: ['id'] });
    
    const contactIds = contacts.map(c => c.id);
    const assetIds = assets.map(a => a.id);
    const locationIds = locations.map(l => l.id);
    
    const baseOrCondition: any[] = [];
    if (contactIds.length > 0) baseOrCondition.push({ contact_id: { [Op.in]: contactIds } });
    if (assetIds.length > 0) baseOrCondition.push({ asset_id: { [Op.in]: assetIds } });

    // For items that have location_id
    const locationOrCondition = [...baseOrCondition];
    if (locationIds.length > 0) locationOrCondition.push({ location_id: { [Op.in]: locationIds } });

    let open_requests = 0;
    let open_estimates = 0;
    let open_work_orders = 0;
    let open_service_appointments = 0;
    let overdue_work_orders = 0;
    let overdue_service_appointments = 0;
    let overdue_invoices = 0;
    let amount_generated_from_work_orders = 0;

    const now = new Date();

    if (locationOrCondition.length > 0) {
      // Requests
      open_requests = await ServiceRequest.count({ 
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          status: { [Op.notIn]: ['closed', 'rejected', 'converted_to_wo', 'spam'] },
          [Op.or]: locationOrCondition
        } 
      });

      // Work Orders (We fetch IDs for Appointments/Invoices/Estimates)
      const workOrders = await WorkOrder.findAll({ 
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          [Op.or]: locationOrCondition
        },
        attributes: ['id']
      });
      const workOrderIds = workOrders.map(wo => wo.id);

      open_work_orders = await WorkOrder.count({ 
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          status: { [Op.notIn]: ['completed', 'cancelled', 'closed'] },
          [Op.or]: locationOrCondition
        } 
      });
      
      overdue_work_orders = await WorkOrder.count({ 
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          status: { [Op.notIn]: ['completed', 'cancelled', 'closed'] },
          scheduled_end: { [Op.lt]: now },
          [Op.or]: locationOrCondition
        } 
      });

      // Estimates
      const estimateOrCondition = [...baseOrCondition];
      if (workOrderIds.length > 0) estimateOrCondition.push({ work_order_id: { [Op.in]: workOrderIds } });
      
      if (estimateOrCondition.length > 0) {
        open_estimates = await Estimate.count({ 
          where: { 
            tenant_id: tenantId, is_deleted: false, 
            status: { [Op.notIn]: ['approved', 'rejected', 'expired'] },
            [Op.or]: estimateOrCondition
          } 
        });
      }

      // Appointments
      if (workOrderIds.length > 0 || assetIds.length > 0) {
        const appointmentOrCondition = [];
        if (workOrderIds.length > 0) appointmentOrCondition.push({ work_order_id: { [Op.in]: workOrderIds } });
        if (assetIds.length > 0) appointmentOrCondition.push({ asset_id: { [Op.in]: assetIds } });

        open_service_appointments = await ServiceAppointment.count({ 
          where: { 
            tenant_id: tenantId, is_deleted: false, 
            status: { [Op.notIn]: ['completed', 'cancelled', 'no_show'] },
            [Op.or]: appointmentOrCondition
          } 
        });

        overdue_service_appointments = await ServiceAppointment.count({ 
          where: { 
            tenant_id: tenantId, is_deleted: false, 
            status: { [Op.notIn]: ['completed', 'cancelled', 'no_show'] },
            scheduled_start: { [Op.lt]: now },
            [Op.or]: appointmentOrCondition
          } 
        });
      }

      // Amount Generated from Work Orders (via invoices)
      const invoiceOrCondition: any[] = [{ company_id: id }];
      if (workOrderIds.length > 0) invoiceOrCondition.push({ work_order_id: { [Op.in]: workOrderIds } });
      if (contactIds.length > 0) invoiceOrCondition.push({ contact_id: { [Op.in]: contactIds } });

      const paidInvoices = await Invoice.findAll({
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          status: 'paid', 
          [Op.or]: invoiceOrCondition
        },
        attributes: [[this.companyRepository.sequelize!.fn('SUM', this.companyRepository.sequelize!.cast(this.companyRepository.sequelize!.col('total'), 'NUMERIC')), 'total']]
      });
      amount_generated_from_work_orders = Number(paidInvoices[0]?.get('total')) || 0;

      overdue_invoices = await Invoice.count({ 
        where: { 
          tenant_id: tenantId, is_deleted: false, 
          status: { [Op.notIn]: ['paid', 'void', 'draft'] },
          due_date: { [Op.lt]: now },
          [Op.or]: invoiceOrCondition
        } 
      });
    }

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
              const name = row['Company Name'] || row.name;
              const industry = row['Industry'] || row.industry;
              const website = row['Website'] || row.website;

              if (!name) {
                failed++;
                continue;
              }

              const existing = await this.companyRepository.findOne({
                where: { name: name, tenant_id: tenantId, is_deleted: false }
              });

              if (existing) {
                await existing.update({
                  industry: industry || existing.industry,
                  website: website || existing.website,
                  updated_by: userId
                });
                imported++;
              } else {
                await this.companyRepository.create({
                  tenant_id: tenantId,
                  name: name,
                  industry: industry,
                  website: website,
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

    const whereClause: any = { tenant_id: tenantId, is_deleted: false };
    if (ids && ids.length > 0) {
      whereClause.id = { [Op.in]: ids };
    }

    const records = await this.companyRepository.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (!records || records.length === 0) {
      return '';
    }

    const exportData = records.map((record: any) => ({
      'Company Name': record.name,
      'Industry': record.industry || '',
      'Website': record.website || '',
      'Created By': record.creator ? `${record.creator.first_name} ${record.creator.last_name}` : '',
      'Created At': new Date(record.created_at).toLocaleString()
    }));

    const json2csvParser = new Parser();
    return json2csvParser.parse(exportData);
  }

  async changeOwner(recordIds: string[], newOwnerId: string, tenantId: string, userId: string): Promise<void> {
    await this.companyRepository.update(
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

    const sequelize = this.companyRepository.sequelize;
    if (!sequelize) {
      throw new ConflictException('Sequelize instance not found');
    }

    const transaction = await sequelize.transaction();

    try {
      const { Contact } = await import('../CONTACTS/contacts.entity');
      const { WorkOrder } = await import('../WORK_ORDERS/work_orders.entity');
      const { Invoice } = await import('../INVOICES/invoices.entity');
      const { ServiceRequest } = await import('../SERVICE_REQUESTS/service_requests.entity');
      const { Estimate } = await import('../ESTIMATES/estimates.entity');
      const { ServiceLocation } = await import('../SERVICE_LOCATIONS/service_locations.entity');
      const { Asset } = await import('../ASSETS/assets.entity');
      const { ActivityLog } = await import('../ACTIVITY_LOGS/activity_logs.entity');

      await Contact.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await WorkOrder.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await Invoice.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await ServiceRequest.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await Estimate.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await ServiceLocation.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      await Asset.update({ company_id: masterId }, { where: { company_id: duplicateId, tenant_id: tenantId }, transaction });
      
      // Update Activity Logs
      await ActivityLog.update({ entity_id: masterId }, { where: { entity_id: duplicateId, entity_type: 'Company', tenant_id: tenantId }, transaction });

      // Merge empty fields from duplicate to master if master is missing them
      const updateData: any = {};
      if (!master.website && duplicate.website) updateData.website = duplicate.website;
      if (!master.billing_street && duplicate.billing_street) updateData.billing_street = duplicate.billing_street;
      if (!master.billing_city && duplicate.billing_city) updateData.billing_city = duplicate.billing_city;
      if (!master.billing_state && duplicate.billing_state) updateData.billing_state = duplicate.billing_state;
      if (!master.billing_zip_code && duplicate.billing_zip_code) updateData.billing_zip_code = duplicate.billing_zip_code;
      if (!master.billing_country && duplicate.billing_country) updateData.billing_country = duplicate.billing_country;
      
      if (Object.keys(updateData).length > 0) {
        await master.update(updateData, { transaction });
      }

      // Soft delete the duplicate
      await duplicate.update({ is_deleted: true, updated_by: userId }, { transaction });

      // Log the merge
      await this.activityLogsService.logActivity(
        tenantId,
        'Company',
        masterId,
        'MERGED',
        `Company ${duplicate.name} was merged into this record.`,
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
