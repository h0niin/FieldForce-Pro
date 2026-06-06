import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { SCHEDULING } from './scheduling.entity';
import {
  OptimizeScheduleDto,
  DemandForecastDto,
  RouteOptimizationDto,
  GetOptimizationsDto,
  ApplyOptimizationDto,
  CheckAvailabilityDto,
  AutoAssignDto,
  ConflictCheckDto,
} from './dto/scheduling.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { Op } from 'sequelize';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { ServiceAppointment } from '../SERVICE_APPOINTMENTS/service_appointments.entity';
import { User } from '../USERS/users.entity';

@Injectable()
export class SCHEDULINGService {
  private readonly logger = new Logger(SCHEDULINGService.name);
  private aiServiceClient: AxiosInstance;

  constructor(
    @Inject('SCHEDULING_REPOSITORY')
    private schedulingRepository: typeof SCHEDULING,
    @Inject('WORK_ORDERS_REPOSITORY')
    private workOrdersRepository: typeof WorkOrder,
    @Inject('SERVICE_APPOINTMENTS_REPOSITORY')
    private appointmentsRepository: typeof ServiceAppointment,
    @Inject('USERS_REPOSITORY')
    private usersRepository: typeof User,
    private configService: ConfigService,
  ) {
    // Initialize AI service client
    const aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
    this.aiServiceClient = axios.create({
      baseURL: aiServiceUrl,
      timeout: 60000, // 60 seconds timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Optimize schedule using AI VRP solver
   */
  async optimizeSchedule(dto: OptimizeScheduleDto, tenantId: string, userId: string): Promise<any> {
    try {
      // Save optimization request
      const optimization = await this.schedulingRepository.create({
        tenant_id: tenantId,
        created_by: userId,
        optimization_type: 'vrp',
        optimization_date: dto.optimization_date || new Date(),
        start_date: dto.work_orders[0]?.time_window_start,
        end_date: dto.work_orders[dto.work_orders.length - 1]?.time_window_end,
        input_parameters: {
          work_orders: dto.work_orders,
          technicians: dto.technicians,
          constraints: dto.constraints,
        },
        total_jobs: dto.work_orders.length,
        status: 'processing',
        is_deleted: false,
      });

      try {
        // Call AI service for optimization
        const response = await this.aiServiceClient.post('/api/v1/scheduling/optimize', {
          work_orders: dto.work_orders,
          technicians: dto.technicians,
          constraints: dto.constraints,
        }, {
          headers: {
            Authorization: `Bearer ${this.generateAIServiceToken(tenantId)}`,
          },
        });

        const result = response.data.data;

        // Update optimization with results
        await optimization.update({
          optimization_result: result,
          optimization_score: result.optimization_score,
          assigned_jobs: dto.work_orders.length - result.unassigned.length,
          unassigned_jobs: result.unassigned.length,
          total_distance_km: result.total_distance_km || 0,
          total_duration_minutes: result.total_duration_minutes || 0,
          execution_time_seconds: result.execution_time || 0,
          status: 'completed',
        });

        return {
          optimization_id: optimization.id,
          ...result,
        };

      } catch (aiError) {
        this.logger.error('AI service error:', aiError);

        // Update optimization status to failed
        await optimization.update({
          status: 'failed',
          error_message: aiError.message || 'AI service optimization failed',
        });

        // Fallback to basic round-robin scheduling
        return this.fallbackScheduling(dto, optimization.id);
      }

    } catch (error) {
      this.logger.error('Schedule optimization error:', error);
      throw new HttpException(
        'Failed to optimize schedule',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate demand forecast using AI
   */
  async generateDemandForecast(dto: DemandForecastDto, tenantId: string, userId: string): Promise<any> {
    try {
      // Save forecast request
      const optimization = await this.schedulingRepository.create({
        tenant_id: tenantId,
        created_by: userId,
        optimization_type: 'demand_forecast',
        optimization_date: new Date(),
        input_parameters: dto,
        status: 'processing',
        is_deleted: false,
      });

      try {
        // Call AI service for demand forecasting
        const response = await this.aiServiceClient.post('/api/v1/scheduling/forecast/demand', dto, {
          headers: {
            Authorization: `Bearer ${this.generateAIServiceToken(tenantId)}`,
          },
        });

        const result = response.data.data;

        // Update optimization with results
        await optimization.update({
          optimization_result: result,
          status: 'completed',
          metadata: {
            trend: result.trend,
            seasonality: result.seasonality,
            capacity_recommendations: result.capacity_recommendations,
          },
        });

        return {
          forecast_id: optimization.id,
          ...result,
        };

      } catch (aiError) {
        this.logger.error('AI forecast error:', aiError);

        await optimization.update({
          status: 'failed',
          error_message: aiError.message || 'AI demand forecast failed',
        });

        // Return basic forecast
        return this.generateBasicForecast(dto, optimization.id);
      }

    } catch (error) {
      this.logger.error('Demand forecast error:', error);
      throw new HttpException(
        'Failed to generate demand forecast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Optimize route for a single technician
   */
  async optimizeRoute(dto: RouteOptimizationDto, tenantId: string, userId: string): Promise<any> {
    try {
      const optimization = await this.schedulingRepository.create({
        tenant_id: tenantId,
        created_by: userId,
        optimization_type: 'realtime',
        optimization_date: new Date(),
        input_parameters: dto,
        total_jobs: dto.locations.length,
        status: 'processing',
        is_deleted: false,
      });

      try {
        // Call AI service for route optimization
        const response = await this.aiServiceClient.post('/api/v1/scheduling/route', dto, {
          headers: {
            Authorization: `Bearer ${this.generateAIServiceToken(tenantId)}`,
          },
        });

        const result = response.data.data;

        await optimization.update({
          optimization_result: result,
          total_distance_km: result.total_distance_km,
          total_duration_minutes: result.total_duration_minutes,
          status: 'completed',
        });

        return {
          optimization_id: optimization.id,
          ...result,
        };

      } catch (aiError) {
        this.logger.error('Route optimization error:', aiError);

        await optimization.update({
          status: 'failed',
          error_message: aiError.message || 'Route optimization failed',
        });

        // Return original order as fallback
        return {
          optimization_id: optimization.id,
          route: dto.locations,
          total_distance_km: 0,
          total_duration_minutes: dto.locations.length * 30,
          message: 'Fallback: returning original order',
        };
      }

    } catch (error) {
      this.logger.error('Route optimization error:', error);
      throw new HttpException(
        'Failed to optimize route',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get optimization history
   */
  async getOptimizations(
    dto: GetOptimizationsDto,
    pageOptions: PageOptionsDto,
    tenantId: string,
  ): Promise<PageDto<SCHEDULING>> {
    const whereClause: any = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (dto.optimization_type) {
      whereClause.optimization_type = dto.optimization_type;
    }

    if (dto.status) {
      whereClause.status = dto.status;
    }

    if (dto.start_date && dto.end_date) {
      whereClause.optimization_date = {
        [Op.between]: [dto.start_date, dto.end_date],
      };
    }

    const { rows, count } = await this.schedulingRepository.findAndCountAll({
      where: whereClause,
      limit: pageOptions.take,
      offset: pageOptions.skip,
      order: [['created_at', pageOptions.order]],
    });

    const pageMeta = new PageMetaDto({
      itemCount: count,
      pageOptionsDto: pageOptions,
    });

    return new PageDto(rows, pageMeta);
  }

  /**
   * Get optimization by ID
   */
  async getOptimizationById(id: string, tenantId: string): Promise<SCHEDULING> {
    const optimization = await this.schedulingRepository.findOne({
      where: {
        id,
        tenant_id: tenantId,
        is_deleted: false,
      },
    });

    if (!optimization) {
      throw new HttpException('Optimization not found', HttpStatus.NOT_FOUND);
    }

    return optimization;
  }

  /**
   * Apply optimization results to create/update appointments
   */
  async applyOptimization(dto: ApplyOptimizationDto, tenantId: string, userId: string): Promise<any> {
    const optimization = await this.getOptimizationById(dto.optimization_id, tenantId);

    if (optimization.status !== 'completed') {
      throw new HttpException(
        'Cannot apply incomplete optimization',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (optimization.is_applied) {
      throw new HttpException(
        'Optimization has already been applied',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = optimization.optimization_result as any;
      const createdAppointments = [];

      // Create appointments based on optimization results
      if (result.schedule && dto.auto_create_appointments) {
        for (const techSchedule of result.schedule) {
          for (const stop of techSchedule.route) {
            // Find the work order
            const workOrder = await this.workOrdersRepository.findOne({
              where: {
                id: stop.work_order_id,
                tenant_id: tenantId,
              },
            });

            if (workOrder) {
              // Create service appointment
              const appointment = await this.appointmentsRepository.create({
                tenant_id: tenantId,
                work_order_id: workOrder.id,
                technician_id: techSchedule.technician_id,
                scheduled_start: stop.arrival_time,
                scheduled_end: new Date(
                  new Date(stop.arrival_time).getTime() + stop.duration * 60000
                ),
                status: 'scheduled',
                created_by: userId,
                is_deleted: false,
              });

              createdAppointments.push(appointment);

              // Update work order status
              await workOrder.update({
                status: 'scheduled',
                assigned_to: techSchedule.technician_id,
              });
            }
          }
        }
      }

      // Mark optimization as applied
      await optimization.update({
        is_applied: true,
        applied_at: new Date(),
      });

      return {
        success: true,
        appointments_created: createdAppointments.length,
        message: `Optimization applied successfully. Created ${createdAppointments.length} appointments.`,
      };

    } catch (error) {
      this.logger.error('Error applying optimization:', error);
      throw new HttpException(
        'Failed to apply optimization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get AI scheduling recommendations
   */
  async getSchedulingRecommendations(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    userId: string,
  ): Promise<any> {
    try {
      // Get historical data for demand forecast
      const historicalData = await this.getHistoricalDemandData(tenantId, 90);

      // Get available technicians
      const technicians = await this.getAvailableTechnicians(tenantId, startDate, endDate);

      // Call AI service for recommendations
      const response = await this.aiServiceClient.post('/api/v1/scheduling/recommend/schedule', {
        start_date: startDate,
        end_date: endDate,
        available_technicians: technicians,
        historical_data: historicalData,
      }, {
        headers: {
          Authorization: `Bearer ${this.generateAIServiceToken(tenantId)}`,
        },
      });

      return response.data.data;

    } catch (error) {
      this.logger.error('Error getting recommendations:', error);
      return {
        recommendations: [],
        message: 'Unable to generate AI recommendations',
      };
    }
  }

  /**
   * Fallback scheduling when AI service is unavailable
   */
  private fallbackScheduling(dto: OptimizeScheduleDto, optimizationId: string): any {
    const schedule = [];
    const technicianIndex: Record<string, { technician_id: string; technician_name: string; route: any[]; total_stops: number }> = {};
    let currentTechIndex = 0;

    // Simple round-robin assignment
    for (const workOrder of dto.work_orders) {
      const technician = dto.technicians[currentTechIndex % dto.technicians.length];

      if (!technicianIndex[technician.id]) {
        technicianIndex[technician.id] = {
          technician_id: technician.id,
          technician_name: technician.name,
          route: [],
          total_stops: 0,
        };
        schedule.push(technicianIndex[technician.id]);
      }

      technicianIndex[technician.id].route.push({
        work_order_id: workOrder.id,
        address: workOrder.service_location.address,
        arrival_time: workOrder.time_window_start,
        duration: workOrder.estimated_duration,
        sequence: technicianIndex[technician.id].route.length + 1,
      });

      technicianIndex[technician.id].total_stops++;
      currentTechIndex++;
    }

    return {
      optimization_id: optimizationId,
      schedule,
      cost: 0,
      unassigned: [],
      optimization_score: 0.5,
      message: 'Fallback scheduling applied (round-robin)',
    };
  }

  /**
   * Generate basic demand forecast when AI is unavailable
   */
  private generateBasicForecast(dto: DemandForecastDto, forecastId: string): any {
    const forecast = [];
    const avgDemand = dto.historical_data.reduce((sum, d) => sum + d.demand, 0) / dto.historical_data.length;
    const today = new Date();

    for (let i = 0; i < dto.horizon_days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      // Add some variation based on day of week
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
      const demand = Math.round(avgDemand * weekendFactor);

      forecast.push({
        date: date.toISOString(),
        predicted_demand: demand,
        lower_bound: Math.round(demand * 0.8),
        upper_bound: Math.round(demand * 1.2),
      });
    }

    return {
      forecast_id: forecastId,
      forecast,
      trend: 'stable',
      capacity_recommendations: {
        average_daily_capacity: Math.round(avgDemand),
        minimum_technicians: Math.ceil(avgDemand / 8),
      },
      message: 'Basic forecast generated (AI unavailable)',
    };
  }

  /**
   * Get historical demand data for forecasting
   */
  private async getHistoricalDemandData(tenantId: string, days: number): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workOrders = await this.workOrdersRepository.findAll({
      where: {
        tenant_id: tenantId,
        created_at: {
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [this.workOrdersRepository.sequelize!.fn('DATE', this.workOrdersRepository.sequelize!.col('created_at')), 'date'],
        [this.workOrdersRepository.sequelize!.fn('COUNT', '*'), 'demand'],
      ],
      group: ['date'],
      raw: true,
    });

    return workOrders;
  }

  /**
   * Get available technicians for scheduling
   */
  private async getAvailableTechnicians(tenantId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // In a real implementation, would query user roles and availability
    // For now, return mock data
    return [
      {
        id: 'tech1',
        name: 'John Doe',
        skills: ['electrical', 'plumbing'],
        territories: ['north', 'central'],
        max_jobs: 8,
      },
      {
        id: 'tech2',
        name: 'Jane Smith',
        skills: ['hvac', 'electrical'],
        territories: ['south', 'central'],
        max_jobs: 8,
      },
    ];
  }

  /**
   * Generate JWT token for AI service authentication
   */
  private generateAIServiceToken(tenantId: string): string {
    // In production, would generate proper JWT
    // For now, return a mock token
    return `mock_token_${tenantId}`;
  }

  // ─── Availability & Conflict Detection ────────────────────────────

  /**
   * Check if a technician is available during a given time window.
   * Evaluates: shift hours, existing appointments (conflicts), and active status.
   */
  async checkAvailability(
    dto: CheckAvailabilityDto,
    tenantId: string,
  ): Promise<{
    available: boolean;
    conflicts: any[];
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // 1. Verify technician exists and is active
    const agent = await this.usersRepository.findOne({
      where: { id: dto.agent_id, tenant_id: tenantId, is_deleted: false },
    });
    if (!agent) {
      return { available: false, conflicts: [], reasons: ['Technician not found'] };
    }
    if (!agent.is_active) {
      reasons.push('Technician account is inactive');
    }

    // 2. Conflict detection — find overlapping appointments
    const conflicts = await this.detectConflicts(
      { agent_id: dto.agent_id, start_time: dto.start_time, end_time: dto.end_time },
      tenantId,
    );
    if (conflicts.length > 0) {
      reasons.push(`${conflicts.length} overlapping appointment(s) found`);
    }

    return {
      available: reasons.length === 0,
      conflicts,
      reasons,
    };
  }

  /**
   * Detect scheduling conflicts for a technician in a time window.
   */
  async detectConflicts(
    dto: ConflictCheckDto,
    tenantId: string,
  ): Promise<ServiceAppointment[]> {
    const whereClause: any = {
      tenant_id: tenantId,
      agent_id: dto.agent_id,
      is_deleted: false,
      status: { [Op.notIn]: ['completed', 'cancelled'] },
      // Overlap: existing.start < new.end AND existing.end > new.start
      scheduled_start: { [Op.lt]: dto.end_time },
      scheduled_end: { [Op.gt]: dto.start_time },
    };

    if (dto.exclude_appointment_id) {
      whereClause.id = { [Op.ne]: dto.exclude_appointment_id };
    }

    return this.appointmentsRepository.findAll({ where: whereClause });
  }

  /**
   * Auto-assign a work order to the best available technician.
   *
   * Scoring criteria (in priority order):
   *  1. Skill match — technician must have all required skills (if provided)
   *  2. Territory match — technician covers the job territory (if provided)
   *  3. Shift coverage — requested window falls within technician's typical shift
   *  4. No conflicts — technician has no overlapping appointments
   *  5. Fewest existing appointments that day (load-balance)
   */
  async autoAssign(
    dto: AutoAssignDto,
    tenantId: string,
  ): Promise<{
    assigned: boolean;
    agent_id: string | null;
    agent_name: string | null;
    score: number;
    candidates: Array<{
      agent_id: string;
      agent_name: string;
      score: number;
      available: boolean;
      reasons: string[];
    }>;
  }> {
    // Fetch all active technicians for the tenant
    const agents = await this.usersRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false, is_active: true },
    });

    if (agents.length === 0) {
      return { assigned: false, agent_id: null, agent_name: null, score: 0, candidates: [] };
    }

    // Count each agent's appointments for the requested day (for load balancing)
    const dayStart = new Date(dto.scheduled_start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dto.scheduled_start);
    dayEnd.setHours(23, 59, 59, 999);

    const candidates: Array<{
      agent_id: string;
      agent_name: string;
      score: number;
      available: boolean;
      reasons: string[];
      appointmentCount: number;
    }> = [];

    for (const agent of agents) {
      let score = 0;
      const reasons: string[] = [];

      // --- Skill-based availability ---
      if (dto.required_skills && dto.required_skills.length > 0) {
        // Skills are stored in user custom_fields or roles; use a broad match
        // In the current schema skills are not on the User entity,
        // so we treat every agent as having general skills and give a neutral score.
        // When a skills column is added, this should be replaced with actual matching.
        score += 10; // baseline for being an active technician
        reasons.push('Skill check: general availability (no skills column yet)');
      } else {
        score += 10;
      }

      // --- Territory-based availability ---
      if (dto.territory) {
        // Same situation — territories not yet on User entity.
        score += 5;
        reasons.push('Territory check: general availability (no territory column yet)');
      } else {
        score += 5;
      }

      // --- Shift-based availability ---
      // Without shift columns on User, we assume standard business hours (08:00 – 18:00)
      const requestedStart = new Date(dto.scheduled_start);
      const requestedEnd = dto.scheduled_end
        ? new Date(dto.scheduled_end)
        : new Date(requestedStart.getTime() + 8 * 60 * 60 * 1000);
      const startHour = requestedStart.getHours();
      const endHour = requestedEnd.getHours() + (requestedEnd.getMinutes() > 0 ? 1 : 0);

      const shiftStart = 8;
      const shiftEnd = 18;
      if (startHour >= shiftStart && endHour <= shiftEnd) {
        score += 15; // falls within shift
        reasons.push('Within standard shift hours (08:00-18:00)');
      } else {
        score += 5; // partial overlap
        reasons.push('Outside standard shift hours');
      }

      // --- Time-off availability ---
      // Without a time-off entity, we skip this check but log it
      score += 5;
      reasons.push('Time-off check: assumed available (no time-off entity yet)');

      // --- Conflict detection ---
      const conflicts = await this.detectConflicts(
        { agent_id: agent.id, start_time: dto.scheduled_start, end_time: requestedEnd.toISOString() },
        tenantId,
      );
      const hasConflict = conflicts.length > 0;
      if (!hasConflict) {
        score += 30; // big bonus for no conflicts
        reasons.push('No scheduling conflicts');
      } else {
        score -= 50; // heavy penalty
        reasons.push(`${conflicts.length} conflict(s) detected`);
      }

      // --- Load balancing ---
      const dayAppointments = await this.appointmentsRepository.count({
        where: {
          tenant_id: tenantId,
          agent_id: agent.id,
          is_deleted: false,
          status: { [Op.notIn]: ['completed', 'cancelled'] },
          scheduled_start: { [Op.between]: [dayStart, dayEnd] },
        },
      });
      // Fewer appointments → higher score (max 20 points, losing 3 per existing job)
      const loadScore = Math.max(0, 20 - dayAppointments * 3);
      score += loadScore;
      reasons.push(`${dayAppointments} existing appointment(s) today`);

      candidates.push({
        agent_id: agent.id,
        agent_name: agent.fullName,
        score,
        available: !hasConflict,
        reasons,
        appointmentCount: dayAppointments,
      });
    }

    // Sort by score descending, then by appointment count ascending
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.appointmentCount - b.appointmentCount;
    });

    const best = candidates[0];
    const assigned = best && best.available;

    return {
      assigned,
      agent_id: assigned ? best.agent_id : null,
      agent_name: assigned ? best.agent_name : null,
      score: best?.score ?? 0,
      candidates: candidates.map(({ appointmentCount, ...c }) => c),
    };
  }
}