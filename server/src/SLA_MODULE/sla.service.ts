import { Injectable, Inject, Logger } from '@nestjs/common';
import { KEYNAMES } from '../shared/constants/keynames';
import { SlaPolicy } from './sla_policies.entity';
import { ServiceRequestSla } from './service_request_slas.entity';
import { SlaAuditLog } from './sla_audit_logs.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @Inject(KEYNAMES.SLA_POLICIES)
    private readonly slaPolicyRepository: typeof SlaPolicy,
    @Inject(KEYNAMES.SERVICE_REQUEST_SLAS)
    private readonly serviceRequestSlaRepository: typeof ServiceRequestSla,
    @Inject(KEYNAMES.SLA_AUDIT_LOGS)
    private readonly slaAuditLogRepository: typeof SlaAuditLog,
  ) {}

  async attachSlaToServiceRequest(
    tenantId: string,
    serviceRequest: ServiceRequest,
    transaction?: any,
  ): Promise<ServiceRequestSla | null> {
    try {
      // 1. Sanitize Data: Convert empty strings or undefined to null
      const categoryId = serviceRequest.category_id || null;
      const subCategoryId = serviceRequest.sub_category_id || null;
      const priorityId = serviceRequest.priority_id || null;
      const locationId = serviceRequest.location_id || null; // This might be the SLA location lookup ID

      // 2. Fetch all policies for the tenant (caching this in redis would be ideal in prod)
      const policies = await this.slaPolicyRepository.findAll({
        where: { tenant_id: tenantId, is_active: true, is_deleted: false },
        transaction,
      });

      if (!policies || policies.length === 0) {
        this.logger.warn(`No active SLA policies found for tenant ${tenantId}`);
        return null;
      }

      // 3. Cascading Matcher
      let matchedPolicy = null;

      // Exact Match: category_id + sub_category_id + priority_id + location_id
      matchedPolicy = policies.find(
        (p) =>
          p.category_id === categoryId &&
          p.sub_category_id === subCategoryId &&
          p.priority_id === priorityId &&
          p.location_id === locationId,
      );

      // Fallback 1: category_id + sub_category_id + priority_id (location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === subCategoryId &&
            p.priority_id === priorityId &&
            p.location_id === null,
        );
      }

      // Fallback 2: category_id + sub_category_id (priority: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === subCategoryId &&
            p.priority_id === null &&
            p.location_id === null,
        );
      }

      // Fallback 3: category_id (sub_category: null, priority: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === categoryId &&
            p.sub_category_id === null &&
            p.priority_id === null &&
            p.location_id === null,
        );
      }

      // Catch-All: priority_id (category: null, sub_category: null, location: null)
      if (!matchedPolicy) {
        matchedPolicy = policies.find(
          (p) =>
            p.category_id === null &&
            p.sub_category_id === null &&
            p.priority_id === priorityId &&
            p.location_id === null,
        );
      }

      if (!matchedPolicy) {
        this.logger.warn(`No matching SLA policy found for SR ${serviceRequest.id}`);
        return null;
      }

      // 4. Calculate deadlines
      const now = new Date();
      const responseDeadline = new Date(now.getTime() + matchedPolicy.response_time_minutes * 60000);
      const resolutionDeadline = new Date(now.getTime() + matchedPolicy.resolution_time_minutes * 60000);

      // 5. Create ServiceRequestSla record
      const slaRecord = await this.serviceRequestSlaRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: serviceRequest.id,
          policy_id: matchedPolicy.id,
          response_deadline: responseDeadline,
          response_status: 'PENDING',
          resolution_deadline: resolutionDeadline,
          resolution_status: 'PENDING',
        },
        { transaction },
      );

      // 6. Create Audit Log
      await this.slaAuditLogRepository.create(
        {
          tenant_id: tenantId,
          service_request_id: serviceRequest.id,
          action: 'SLA_ATTACHED',
          details: {
            policy_id: matchedPolicy.id,
            policy_name: matchedPolicy.name,
            response_deadline: responseDeadline,
            resolution_deadline: resolutionDeadline,
          },
        },
        { transaction },
      );

      return slaRecord;
    } catch (error) {
      this.logger.error(`Error attaching SLA to ServiceRequest ${serviceRequest.id}: ${(error as Error).message}`);
      throw error;
    }
  }
}
