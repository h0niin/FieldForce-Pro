import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Trip } from './trips.entity';
import { CreateTripDto } from './dto/trips_create.dto';
import { UpdateTripDto } from './dto/trips_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { PageDto } from '../shared/dto/page.dto';
import { PageMetaDto } from '../shared/dto/page-meta.dto';
import { KEYNAMES, REPOSITORY } from '../shared/constants/keynames';
import { Op } from 'sequelize';
import { User } from '../USERS/users.entity';
import { WorkOrder } from '../WORK_ORDERS/work_orders.entity';
import { WorkOrderTechnicianSession } from '../WORK_ORDER_TECHNICIAN_SESSIONS/work_order_technician_sessions.entity';
import { ServiceLocation } from '../SERVICE_LOCATIONS/service_locations.entity';

const TRIP_INCLUDES = [
  { model: User, attributes: ['id', 'first_name', 'last_name'] },
  { model: WorkOrder, attributes: ['id', 'wo_number', 'summary'] },
];

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @Inject(KEYNAMES.TRIPS)
    private readonly tripRepository: typeof Trip,
    @Inject(REPOSITORY.WORK_ORDER_TECHNICIAN_SESSIONS)
    private readonly sessionRepository: typeof WorkOrderTechnicianSession,
  ) { }

  async findAllPaginated(
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Trip>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      is_deleted: false,
    };

    if (pageOptionsDto.search) {
      where[Op.or as unknown as string] = [
        { status: { [Op.iLike]: `%${pageOptionsDto.search}%` } },
      ];
    }

    const { count, rows } = await this.tripRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      include: TRIP_INCLUDES,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows.map(trip => this.mapToMobile(trip)), meta);
  }

  async findAll(tenantId: string): Promise<any[]> {
    const trips = await this.tripRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      order: [['created_at', 'DESC']],
      include: TRIP_INCLUDES,
    });
    return trips.map(trip => this.mapToMobile(trip));
  }

  async findById(id: string, tenantId: string): Promise<any> {
    const trip = await this.findModelById(id, tenantId);
    return this.mapToMobile(trip);
  }

  private async findModelById(id: string, tenantId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id, tenant_id: tenantId, is_deleted: false },
      include: TRIP_INCLUDES,
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  async findByUserId(
    userId: string,
    tenantId: string,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Trip>> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId,
      user_id: userId,
      is_deleted: false,
    };

    const { count, rows } = await this.tripRepository.findAndCountAll({
      where,
      order: [['created_at', pageOptionsDto.order]],
      limit: pageOptionsDto.take,
      offset: pageOptionsDto.skip,
      include: TRIP_INCLUDES,
    });

    const meta = new PageMetaDto({ pageOptionsDto, itemCount: count });
    return new PageDto(rows.map(trip => this.mapToMobile(trip)), meta);
  }

  async create(tenantId: string, dto: CreateTripDto): Promise<any> {
    const trip = await this.tripRepository.create({
      tenant_id: tenantId,
      ...dto,
    });
    return this.findById(trip.id, tenantId);
  }

  async startTrip(tenantId: string, dto: CreateTripDto): Promise<any> {
    const trip = await this.tripRepository.create({
      tenant_id: tenantId,
      ...dto,
      status: 'in_progress',
    });
    return this.findById(trip.id, tenantId);
  }

  async endTrip(
    id: string,
    tenantId: string,
    dto: UpdateTripDto,
  ): Promise<any> {
    const trip = await this.findModelById(id, tenantId);

    if (trip.status !== 'in_progress') {
      throw new BadRequestException(
        `Cannot end trip with status '${trip.status}'. Only in-progress trips can be ended.`,
      );
    }

    await trip.update({
      ...dto,
      status: 'completed',
      end_time: new Date(),
    });
    return this.findById(id, tenantId);
  }

  /**
   * Ends the most recent in-progress trip for a given work order.
   * Called automatically when technician marks "Reached" in the field workflow.
   */
  async endTripByWorkOrder(
    tenantId: string,
    workOrderId: string,
    endLat?: number | null,
    endLng?: number | null,
  ): Promise<void> {
    const trip = await this.tripRepository.findOne({
      where: { tenant_id: tenantId, work_order_id: workOrderId, status: 'in_progress', is_deleted: false },
      order: [['created_at', 'DESC']],
    });
    if (!trip) return;

    const updates: Record<string, unknown> = {
      status: 'completed',
      end_time: new Date(),
    };

    if (endLat != null && endLng != null) {
      updates.end_lat = endLat;
      updates.end_lng = endLng;
      // Haversine straight-line distance
      const R = 6371;
      const lat1 = Number(trip.start_lat) * Math.PI / 180;
      const lat2 = endLat * Math.PI / 180;
      const dLat = (endLat - Number(trip.start_lat)) * Math.PI / 180;
      const dLng = (endLng - Number(trip.start_lng)) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      updates.distance_km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
    }

    await trip.update(updates);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateTripDto,
  ): Promise<any> {
    const trip = await this.findModelById(id, tenantId);
    await trip.update(dto);
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const trip = await this.findModelById(id, tenantId);
    await trip.update({ is_deleted: true });
  }

  /**
   * Sync trip records with work_order_technician_sessions.
   * - Creates missing trips from sessions that have trip_started_at
   * - Updates existing in_progress trips whose session has progressed past "reached"
   * - Patches trips missing work_order_id from matching sessions
   */
  async syncFromSessions(tenantId: string): Promise<number> {
    // Find sessions that have trip data
    const sessions = await this.sessionRepository.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        trip_started_at: { [Op.ne]: null },
      },
      include: [{
        model: WorkOrder,
        attributes: ['id', 'wo_number', 'location_id'],
        include: [{ model: ServiceLocation, attributes: ['lat', 'lng'] }],
      }],
    });

    if (!sessions.length) return 0;

    // Build session lookup by work_order_id
    const sessionByWoId = new Map(sessions.map((s) => [s.work_order_id, s]));

    // Find ALL existing trips for this tenant (to update stale ones too)
    const existingTrips = await this.tripRepository.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
    });

    const existingByWoId = new Map<string, Trip>();
    const tripsWithoutWo: Trip[] = [];
    for (const trip of existingTrips) {
      if (trip.work_order_id) {
        existingByWoId.set(trip.work_order_id, trip);
      } else {
        tripsWithoutWo.push(trip);
      }
    }

    let changed = 0;

    // ── 1. Fix existing trips that are missing work_order_id ──────────────
    // Match orphan trips to sessions by user_id + similar start_time
    for (const orphan of tripsWithoutWo) {
      for (const session of sessions) {
        if (session.technician_id !== orphan.user_id) continue;
        // Already has a trip linked
        if (existingByWoId.has(session.work_order_id)) continue;

        const sessionStart = new Date(session.trip_started_at).getTime();
        const tripStart = new Date(orphan.start_time).getTime();
        // Match if start times are within 5 minutes
        if (Math.abs(sessionStart - tripStart) < 5 * 60 * 1000) {
          const updates: Record<string, unknown> = { work_order_id: session.work_order_id };

          // Also complete the trip if session has reached
          if (orphan.status === 'in_progress' && session.reached_at) {
            Object.assign(updates, this.buildCompletionData(session));
          }

          try {
            await orphan.update(updates);
            existingByWoId.set(session.work_order_id, orphan);
            changed++;
          } catch (err) {
            this.logger.error(`Failed to patch orphan trip ${orphan.id}:`, err);
          }
          break;
        }
      }
    }

    // ── 2. Update stale in_progress trips whose session has progressed ────
    for (const [woId, trip] of existingByWoId) {
      if (trip.status !== 'in_progress') continue;
      const session = sessionByWoId.get(woId);
      if (!session || !session.reached_at) continue;

      try {
        await trip.update(this.buildCompletionData(session));
        changed++;
      } catch (err) {
        this.logger.error(`Failed to complete trip ${trip.id}:`, err);
      }
    }

    // ── 3. Create missing trips from sessions with no trip record ─────────
    for (const session of sessions) {
      if (existingByWoId.has(session.work_order_id)) continue;

      const startLat = session.trip_start_lat != null ? Number(session.trip_start_lat) : 0;
      const startLng = session.trip_start_lng != null ? Number(session.trip_start_lng) : 0;
      const isCompleted = session.reached_at != null;

      const tripData: Record<string, unknown> = {
        tenant_id: tenantId,
        user_id: session.technician_id,
        work_order_id: session.work_order_id,
        start_lat: startLat,
        start_lng: startLng,
        start_time: session.trip_started_at,
        status: isCompleted ? 'completed' : 'in_progress',
      };

      if (isCompleted) {
        Object.assign(tripData, this.buildCompletionData(session));
      }

      try {
        await this.tripRepository.create(tripData);
        changed++;
      } catch (err) {
        this.logger.error(`Failed to backfill trip for WO ${session.work_order_id}:`, err);
      }
    }

    if (changed > 0) {
      this.logger.log(`Synced ${changed} trip records from technician sessions`);
    }
    return changed;
  }

  /** Build end-of-trip fields from a session that has reached_at. */
  private buildCompletionData(session: WorkOrderTechnicianSession): Record<string, unknown> {
    const data: Record<string, unknown> = {
      status: 'completed',
      end_time: session.reached_at,
    };

    const startLat = session.trip_start_lat != null ? Number(session.trip_start_lat) : 0;
    const startLng = session.trip_start_lng != null ? Number(session.trip_start_lng) : 0;

    // Get destination from work order location
    const plain = session.get({ plain: true }) as any;
    const loc = plain?.work_order?.location;
    if (loc?.lat && loc?.lng) {
      data.end_lat = Number(loc.lat);
      data.end_lng = Number(loc.lng);

      // Haversine distance
      if (startLat !== 0 && startLng !== 0) {
        const R = 6371;
        const lat1 = startLat * Math.PI / 180;
        const lat2 = Number(loc.lat) * Math.PI / 180;
        const dLat = (Number(loc.lat) - startLat) * Math.PI / 180;
        const dLng = (Number(loc.lng) - startLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        data.distance_km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
      }
    }

    return data;
  }

  private mapToMobile(trip: Trip) {
    if (!trip) return null;
    const plain = trip.get({ plain: true });

    // Compute duration_minutes from start_time / end_time
    let duration_minutes: number | null = null;
    if (plain.start_time && plain.end_time) {
      const startMs = new Date(plain.start_time).getTime();
      const endMs = new Date(plain.end_time).getTime();
      duration_minutes = Math.round((endMs - startMs) / 60000);
    }

    return {
      ...plain,
      duration_minutes,
      started_at: plain.start_time,
      completed_at: plain.end_time || null,
    };
  }
}
