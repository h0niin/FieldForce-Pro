import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlueprintStatesService } from './blueprint_states.service';
import { CreateBlueprintStateDto } from './dto/blueprint_states_create.dto';
import { UpdateBlueprintStateDto } from './dto/blueprint_states_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Blueprint States')
@ApiBearerAuth()
@Controller('blueprint-states')
export class BlueprintStatesController {
  constructor(private readonly blueprintStatesService: BlueprintStatesService) {}

  @Get()
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint states (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.blueprintStatesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Blueprint states fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint states (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const states = await this.blueprintStatesService.findAll(tenantId);
    return DataResponseDto.success(states, 'Blueprint states fetched successfully');
  }

  @Get('blueprint/:blueprintId')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all states for a specific blueprint' })
  async findByBlueprintId(
    @Param('blueprintId') blueprintId: string,
    @TenantId() tenantId: string,
  ) {
    const states = await this.blueprintStatesService.findByBlueprintId(blueprintId, tenantId);
    return DataResponseDto.success(states, 'Blueprint states fetched successfully');
  }

  @Get(':id')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get blueprint state by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const state = await this.blueprintStatesService.findById(id, tenantId);
    return DataResponseDto.success(state);
  }

  @Post()
  @Permissions('blueprints:create')
  @ApiOperation({ summary: 'Create a new blueprint state' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateBlueprintStateDto) {
    const state = await this.blueprintStatesService.create(tenantId, dto);
    return DataResponseDto.created(state, 'Blueprint state created successfully');
  }

  @Put(':id')
  @Permissions('blueprints:update')
  @ApiOperation({ summary: 'Update a blueprint state' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateBlueprintStateDto,
  ) {
    const state = await this.blueprintStatesService.update(id, tenantId, dto);
    return DataResponseDto.success(state, 'Blueprint state updated successfully');
  }

  @Delete(':id')
  @Permissions('blueprints:delete')
  @ApiOperation({ summary: 'Delete a blueprint state (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.blueprintStatesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Blueprint state deleted successfully');
  }
}
