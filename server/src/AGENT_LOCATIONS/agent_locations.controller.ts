import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AgentLocationsService } from './agent_locations.service';
import { CreateAgentLocationDto, BatchCreateAgentLocationDto } from './dto/agent_locations_create.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Agent Locations')
@ApiBearerAuth()
@Controller('agent-locations')
export class AgentLocationsController {
  constructor(private readonly agentLocationsService: AgentLocationsService) {}

  @Get()
  @Permissions('agent_locations:read')
  @ApiOperation({ summary: 'Get all agent locations (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.agentLocationsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Agent locations fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('agent_locations:read')
  @ApiOperation({ summary: 'Get all agent locations (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const locations = await this.agentLocationsService.findAll(tenantId);
    return DataResponseDto.success(locations, 'Agent locations fetched successfully');
  }

  @Get('user/:userId/latest')
  @Permissions('agent_locations:read')
  @ApiOperation({ summary: 'Get latest location for a user' })
  async findLatestByUserId(
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
  ) {
    const location = await this.agentLocationsService.findLatestByUserId(userId, tenantId);
    return DataResponseDto.success(location, 'Latest agent location fetched successfully');
  }

  @Get('user/:userId/history')
  @Permissions('agent_locations:read')
  @ApiOperation({ summary: 'Get location history for a user within a date range' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (ISO 8601)', example: '2025-01-15T00:00:00Z' })
  @ApiQuery({ name: 'end_date', required: true, description: 'End date (ISO 8601)', example: '2025-01-15T23:59:59Z' })
  async findByUserIdInRange(
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.agentLocationsService.findByUserIdInRange(
      userId,
      tenantId,
      startDate,
      endDate,
      pageOptionsDto,
    );
    return DataResponseDto.success(result.data, 'Agent location history fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @Permissions('agent_locations:read')
  @ApiOperation({ summary: 'Get agent location by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const location = await this.agentLocationsService.findById(id, tenantId);
    return DataResponseDto.success(location);
  }

  @Post()
  @Permissions('agent_locations:create')
  @ApiOperation({ summary: 'Create a single agent location entry' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateAgentLocationDto) {
    const location = await this.agentLocationsService.create(tenantId, dto);
    return DataResponseDto.created(location, 'Agent location created successfully');
  }

  @Post('batch')
  @Permissions('agent_locations:create')
  @ApiOperation({ summary: 'Create multiple agent location entries (bulk GPS updates)' })
  async createBatch(@TenantId() tenantId: string, @Body() dto: BatchCreateAgentLocationDto) {
    const locations = await this.agentLocationsService.createBatch(tenantId, dto);
    return DataResponseDto.created(locations, 'Agent locations batch created successfully');
  }
}
