import { Injectable, Inject, Logger } from '@nestjs/common';
import { Op } from 'sequelize';
import { User } from '../USERS/users.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { ServiceRequest } from '../SERVICE_REQUESTS/service_requests.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { Asset } from '../ASSETS/assets.entity';

export enum AssignmentStrategy {
  ROUND_ROBIN = 'round_robin',
  TERRITORY_BASED = 'territory_based',
  SKILL_BASED = 'skill_based',
  LOAD_BALANCED = 'load_balanced',
  PRIORITY_BASED = 'priority_based',
}

export interface AssignmentCriteria {
  strategy: AssignmentStrategy;
  skills?: string[];
  territory?: string;
  priority?: string;
  customerId?: string;
  assetId?: string;
  serviceType?: string;
}

export interface AssignmentResult {
  success: boolean;
  assignedTo?: string;
  assignedToName?: string;
  reason?: string;
  strategy: AssignmentStrategy;
}

@Injectable()
export class AutoAssignmentService {
  private readonly logger = new Logger(AutoAssignmentService.name);
  private roundRobinIndex: Map<string, number> = new Map();

  constructor(
    @Inject('USERS')
    private usersRepository: typeof User,
    @Inject('WORK_ORDERS')
    private workOrdersRepository: typeof WorkOrder,
    @Inject('SERVICE_REQUESTS')
    private serviceRequestsRepository: typeof ServiceRequest,
    @Inject('SERVICE_APPOINTMENTS')
    private serviceAppointmentsRepository: typeof ServiceAppointment,
  ) {}

  /**
   * Main assignment method that routes to appropriate strategy
   */
  async assignWorkOrder(
    tenantId: string,
    workOrderId: string,
    criteria: AssignmentCriteria,
  ): Promise<AssignmentResult> {
    this.logger.log(`Assigning work order ${workOrderId} using strategy: ${criteria.strategy}`);

    let result: AssignmentResult;

    switch (criteria.strategy) {
      case AssignmentStrategy.ROUND_ROBIN:
        result = await this.assignRoundRobin(tenantId, workOrderId);
        break;
      case AssignmentStrategy.TERRITORY_BASED:
        result = await this.assignByTerritory(tenantId, workOrderId, criteria.territory);
        break;
      case AssignmentStrategy.SKILL_BASED:
        result = await this.assignBySkills(tenantId, workOrderId, criteria.skills || []);
        break;
      case AssignmentStrategy.LOAD_BALANCED:
        result = await this.assignByLoad(tenantId, workOrderId);
        break;
      case AssignmentStrategy.PRIORITY_BASED:
        result = await this.assignByPriority(tenantId, workOrderId, criteria.priority);
        break;
      default:
        result = await this.assignRoundRobin(tenantId, workOrderId);
    }

    if (result.success && result.assignedTo) {
      await this.updateWorkOrderAssignment(tenantId, workOrderId, result.assignedTo);
    }

    return result;
  }

  /**
   * Round-robin assignment - assigns to technicians in rotation
   */
  private async assignRoundRobin(
    tenantId: string,
    workOrderId: string,
  ): Promise<AssignmentResult> {
    try {
      // Get all active technicians
      const technicians = await this.getAvailableTechnicians(tenantId);

      if (technicians.length === 0) {
        return {
          success: false,
          reason: 'No available technicians',
          strategy: AssignmentStrategy.ROUND_ROBIN,
        };
      }

      // Get current index for this tenant
      const currentIndex = this.roundRobinIndex.get(tenantId) || 0;
      const selectedTechnician = technicians[currentIndex % technicians.length];

      // Update index for next assignment
      this.roundRobinIndex.set(tenantId, (currentIndex + 1) % technicians.length);

      return {
        success: true,
        assignedTo: selectedTechnician.id,
        assignedToName: `${selectedTechnician.first_name} ${selectedTechnician.last_name}`,
        strategy: AssignmentStrategy.ROUND_ROBIN,
      };
    } catch (error) {
      this.logger.error(`Round-robin assignment failed: ${error.message}`);
      return {
        success: false,
        reason: error.message,
        strategy: AssignmentStrategy.ROUND_ROBIN,
      };
    }
  }

  /**
   * Territory-based assignment - assigns based on geographic territory
   */
  private async assignByTerritory(
    tenantId: string,
    workOrderId: string,
    territory?: string,
  ): Promise<AssignmentResult> {
    try {
      // Get work order details to determine location
      const workOrder = await this.workOrdersRepository.findOne({
        where: {
          id: workOrderId,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });

      if (!workOrder) {
        return {
          success: false,
          reason: 'Work order not found',
          strategy: AssignmentStrategy.TERRITORY_BASED,
        };
      }

      // Determine territory from work order (could be from service location, customer address, etc.)
      const workOrderTerritory = territory || (workOrder.custom_fields as any)?.territory || 'default';

      // Find technicians assigned to this territory
      // For now, get all available technicians since custom_fields aren't implemented
      const technicians = await this.getAvailableTechnicians(tenantId);

      if (technicians.length === 0) {
        // Fall back to any available technician
        return this.assignRoundRobin(tenantId, workOrderId);
      }

      // Select technician with least active work orders in this territory
      const technicianWorkloads = await Promise.all(
        technicians.map(async (tech) => {
          const activeCount = await this.workOrdersRepository.count({
            where: {
              tenant_id: tenantId,
              assigned_to: tech.id,
              status: ['In Progress', 'Scheduled'],
              is_deleted: false,
            },
          });
          return { technician: tech, workload: activeCount };
        }),
      );

      // Sort by workload and select the one with least work
      technicianWorkloads.sort((a, b) => a.workload - b.workload);
      const selectedTechnician = technicianWorkloads[0].technician;

      return {
        success: true,
        assignedTo: selectedTechnician.id,
        assignedToName: `${selectedTechnician.first_name} ${selectedTechnician.last_name}`,
        strategy: AssignmentStrategy.TERRITORY_BASED,
      };
    } catch (error) {
      this.logger.error(`Territory-based assignment failed: ${error.message}`);
      return {
        success: false,
        reason: error.message,
        strategy: AssignmentStrategy.TERRITORY_BASED,
      };
    }
  }

  /**
   * Skill-based assignment - assigns based on required skills
   */
  private async assignBySkills(
    tenantId: string,
    workOrderId: string,
    requiredSkills: string[],
  ): Promise<AssignmentResult> {
    try {
      // Get work order to determine required skills
      const workOrder = await this.workOrdersRepository.findOne({
        where: {
          id: workOrderId,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });

      if (!workOrder) {
        return {
          success: false,
          reason: 'Work order not found',
          strategy: AssignmentStrategy.SKILL_BASED,
        };
      }

      // Determine required skills from work order
      const skills: string[] = requiredSkills.length > 0
        ? requiredSkills
        : (workOrder.custom_fields as any)?.required_skills || [];

      if (skills.length === 0) {
        // No specific skills required, use round-robin
        return this.assignRoundRobin(tenantId, workOrderId);
      }

      // Find technicians with matching skills
      const technicians = await this.getAvailableTechnicians(tenantId);

      // Filter technicians by skills (simplified for now since custom_fields aren't available)
      // In production, this would check actual skill data from user profiles or a skills table
      const skilledTechnicians = technicians;

      if (skilledTechnicians.length === 0) {
        // In production, this would try to find technicians with partial skill matches
        // For now, return no match
        return {
          success: false,
          reason: `No technicians with required skills: ${skills.join(', ')}`,
          strategy: AssignmentStrategy.SKILL_BASED,
        };
      }

      // Select technician with least active work orders
      const technicianWorkloads = await Promise.all(
        skilledTechnicians.map(async (tech) => {
          const activeCount = await this.workOrdersRepository.count({
            where: {
              tenant_id: tenantId,
              assigned_to: tech.id,
              status: ['In Progress', 'Scheduled'],
              is_deleted: false,
            },
          });
          return { technician: tech, workload: activeCount };
        }),
      );

      technicianWorkloads.sort((a, b) => a.workload - b.workload);
      const selectedTechnician = technicianWorkloads[0].technician;

      return {
        success: true,
        assignedTo: selectedTechnician.id,
        assignedToName: `${selectedTechnician.first_name} ${selectedTechnician.last_name}`,
        strategy: AssignmentStrategy.SKILL_BASED,
      };
    } catch (error) {
      this.logger.error(`Skill-based assignment failed: ${error.message}`);
      return {
        success: false,
        reason: error.message,
        strategy: AssignmentStrategy.SKILL_BASED,
      };
    }
  }

  /**
   * Load-balanced assignment - assigns based on current workload
   */
  private async assignByLoad(
    tenantId: string,
    workOrderId: string,
  ): Promise<AssignmentResult> {
    try {
      const technicians = await this.getAvailableTechnicians(tenantId);

      if (technicians.length === 0) {
        return {
          success: false,
          reason: 'No available technicians',
          strategy: AssignmentStrategy.LOAD_BALANCED,
        };
      }

      // Calculate workload for each technician
      const technicianWorkloads = await Promise.all(
        technicians.map(async (tech) => {
          const activeWorkOrders = await this.workOrdersRepository.count({
            where: {
              tenant_id: tenantId,
              assigned_to: tech.id,
              status: ['In Progress', 'Scheduled'],
              is_deleted: false,
            },
          });

          const todayAppointments = await this.serviceAppointmentsRepository.count({
            where: {
              tenant_id: tenantId,
              technician_id: tech.id,
              status: ['Scheduled', 'Dispatched', 'In Transit', 'On Site', 'In Progress'],
              scheduled_start: {
                [Op.gte]: new Date().setHours(0, 0, 0, 0),
                [Op.lt]: new Date().setHours(23, 59, 59, 999),
              },
              is_deleted: false,
            },
          });

          return {
            technician: tech,
            totalLoad: activeWorkOrders + todayAppointments * 2, // Weight today's appointments more
          };
        }),
      );

      // Sort by load and select the one with least work
      technicianWorkloads.sort((a, b) => a.totalLoad - b.totalLoad);
      const selectedTechnician = technicianWorkloads[0].technician;

      return {
        success: true,
        assignedTo: selectedTechnician.id,
        assignedToName: `${selectedTechnician.first_name} ${selectedTechnician.last_name}`,
        strategy: AssignmentStrategy.LOAD_BALANCED,
      };
    } catch (error) {
      this.logger.error(`Load-balanced assignment failed: ${error.message}`);
      return {
        success: false,
        reason: error.message,
        strategy: AssignmentStrategy.LOAD_BALANCED,
      };
    }
  }

  /**
   * Priority-based assignment - assigns high priority work to senior technicians
   */
  private async assignByPriority(
    tenantId: string,
    workOrderId: string,
    priority?: string,
  ): Promise<AssignmentResult> {
    try {
      const workOrder = await this.workOrdersRepository.findOne({
        where: {
          id: workOrderId,
          tenant_id: tenantId,
          is_deleted: false,
        },
      });

      if (!workOrder) {
        return {
          success: false,
          reason: 'Work order not found',
          strategy: AssignmentStrategy.PRIORITY_BASED,
        };
      }

      const workOrderPriority = priority || workOrder.priority || 'medium';

      if (workOrderPriority === 'high' || workOrderPriority === 'urgent') {
        // Find senior technicians for high priority work
        // For now, get all technicians since we don't have experience data
        const seniorTechnicians = await this.getAvailableTechnicians(tenantId);

        if (seniorTechnicians.length > 0) {
          // Use load balancing among senior technicians
          const result = await this.selectByLoad(tenantId, seniorTechnicians);
          return { ...result, strategy: AssignmentStrategy.PRIORITY_BASED };
        }
      }

      // For normal priority or if no senior technicians available
      return this.assignByLoad(tenantId, workOrderId);
    } catch (error) {
      this.logger.error(`Priority-based assignment failed: ${error.message}`);
      return {
        success: false,
        reason: error.message,
        strategy: AssignmentStrategy.PRIORITY_BASED,
      };
    }
  }

  /**
   * Helper method to get available technicians
   */
  private async getAvailableTechnicians(tenantId: string): Promise<User[]> {
    // For now, we get all active users
    // In production, you'd filter by role through user_roles relation
    return this.usersRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_active: true,
        is_deleted: false,
      },
    });
  }

  /**
   * Helper method to select technician by load
   */
  private async selectByLoad(
    tenantId: string,
    technicians: User[],
  ): Promise<Omit<AssignmentResult, 'strategy'>> {
    const technicianWorkloads = await Promise.all(
      technicians.map(async (tech) => {
        const activeCount = await this.workOrdersRepository.count({
          where: {
            tenant_id: tenantId,
            assigned_to: tech.id,
            status: ['In Progress', 'Scheduled'],
            is_deleted: false,
          },
        });
        return { technician: tech, workload: activeCount };
      }),
    );

    technicianWorkloads.sort((a, b) => a.workload - b.workload);
    const selectedTechnician = technicianWorkloads[0].technician;

    return {
      success: true,
      assignedTo: selectedTechnician.id,
      assignedToName: `${selectedTechnician.first_name} ${selectedTechnician.last_name}`,
    };
  }

  /**
   * Update work order with assignment
   */
  private async updateWorkOrderAssignment(
    tenantId: string,
    workOrderId: string,
    assignedTo: string,
  ): Promise<void> {
    await this.workOrdersRepository.update(
      {
        assigned_to: assignedTo,
        status: 'Scheduled',
        updated_at: new Date(),
      },
      {
        where: {
          id: workOrderId,
          tenant_id: tenantId,
          is_deleted: false,
        },
      },
    );

    this.logger.log(`Work order ${workOrderId} assigned to ${assignedTo}`);
  }

  /**
   * Assign service request to technician
   */
  async assignServiceRequest(
    tenantId: string,
    serviceRequestId: string,
    criteria: AssignmentCriteria,
  ): Promise<AssignmentResult> {
    // Similar logic but for service requests
    // This would typically convert to work order first
    this.logger.log(`Assigning service request ${serviceRequestId} using strategy: ${criteria.strategy}`);

    // For now, return a placeholder
    return {
      success: true,
      reason: 'Service request assignment not yet implemented',
      strategy: criteria.strategy,
    };
  }
}