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
import { BlueprintTransitionsService } from './blueprint_transitions.service';
import { CreateBlueprintTransitionDto } from './dto/blueprint_transitions_create.dto';
import { UpdateBlueprintTransitionDto } from './dto/blueprint_transitions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Blueprint Transitions')
@ApiBearerAuth()
@Controller('blueprint-transitions')
export class BlueprintTransitionsController {
  constructor(private readonly blueprintTransitionsService: BlueprintTransitionsService) {}

  @Get()
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint transitions (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.blueprintTransitionsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Blueprint transitions fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint transitions (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const transitions = await this.blueprintTransitionsService.findAll(tenantId);
    return DataResponseDto.success(transitions, 'Blueprint transitions fetched successfully');
  }

  @Get('blueprint/:blueprintId')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all transitions for a specific blueprint' })
  async findByBlueprintId(
    @Param('blueprintId') blueprintId: string,
    @TenantId() tenantId: string,
  ) {
    const transitions = await this.blueprintTransitionsService.findByBlueprintId(blueprintId, tenantId);
    return DataResponseDto.success(transitions, 'Blueprint transitions fetched successfully');
  }

  @Get(':id')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get blueprint transition by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const transition = await this.blueprintTransitionsService.findById(id, tenantId);
    return DataResponseDto.success(transition);
  }

  @Post()
  @Permissions('blueprints:create')
  @ApiOperation({ summary: 'Create a new blueprint transition' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateBlueprintTransitionDto) {
    const transition = await this.blueprintTransitionsService.create(tenantId, dto);
    return DataResponseDto.created(transition, 'Blueprint transition created successfully');
  }

  @Put(':id')
  @Permissions('blueprints:update')
  @ApiOperation({ summary: 'Update a blueprint transition' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateBlueprintTransitionDto,
  ) {
    const transition = await this.blueprintTransitionsService.update(id, tenantId, dto);
    return DataResponseDto.success(transition, 'Blueprint transition updated successfully');
  }

  @Delete(':id')
  @Permissions('blueprints:delete')
  @ApiOperation({ summary: 'Delete a blueprint transition (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.blueprintTransitionsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Blueprint transition deleted successfully');
  }
}
