import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/trips_create.dto';
import { UpdateTripDto } from './dto/trips_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  @Get()
  @Permissions('trips:read')
  @ApiOperation({ summary: 'Get all trips (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    // Auto-backfill trip records from technician sessions on first load
    await this.tripsService.syncFromSessions(tenantId).catch(() => { });

    const result = await this.tripsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Trips fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Post('sync')
  @Permissions('trips:create')
  @ApiOperation({ summary: 'Sync trip records from technician workflow sessions' })
  async syncFromSessions(@TenantId() tenantId: string) {
    const count = await this.tripsService.syncFromSessions(tenantId);
    return DataResponseDto.success({ synced: count }, `Synced ${count} trip records from technician sessions`);
  }

  @Get('all')
  @Permissions('trips:read')
  @ApiOperation({ summary: 'Get all trips (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const trips = await this.tripsService.findAll(tenantId);
    return DataResponseDto.success(trips, 'Trips fetched successfully');
  }

  @Get('user/:userId')
  @Permissions('trips:read')
  @ApiOperation({ summary: 'Get trips by user ID (paginated)' })
  async findByUserId(
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.tripsService.findByUserId(userId, tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'User trips fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @Permissions('trips:read')
  @ApiOperation({ summary: 'Get trip by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const trip = await this.tripsService.findById(id, tenantId);
    return DataResponseDto.success(trip);
  }

  @Post()
  @Permissions('trips:create')
  @ApiOperation({ summary: 'Create a new trip' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateTripDto) {
    const trip = await this.tripsService.create(tenantId, dto);
    return DataResponseDto.created(trip, 'Trip created successfully');
  }

  @Post('start')
  @Permissions('trips:create', 'scheduling:read')
  @ApiOperation({ summary: 'Start a new trip' })
  async startTrip(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTripDto,
  ) {
    dto.user_id = userId;
    dto.start_time = new Date().toISOString();
    const trip = await this.tripsService.startTrip(tenantId, dto);
    return DataResponseDto.created(trip, 'Trip started successfully');
  }

  @Patch(':id/end')
  @Permissions('trips:update')
  @ApiOperation({ summary: 'End an in-progress trip' })
  async endTrip(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateTripDto,
  ) {
    const trip = await this.tripsService.endTrip(id, tenantId, dto);
    return DataResponseDto.success(trip, 'Trip ended successfully');
  }

  @Put(':id')
  @Permissions('trips:update')
  @ApiOperation({ summary: 'Update a trip' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateTripDto,
  ) {
    const trip = await this.tripsService.update(id, tenantId, dto);
    return DataResponseDto.success(trip, 'Trip updated successfully');
  }

  @Delete(':id')
  @Permissions('trips:delete')
  @ApiOperation({ summary: 'Delete a trip (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.tripsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Trip deleted successfully');
  }
}
