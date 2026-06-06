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
import { BlueprintDefinitionsService } from './blueprint_definitions.service';
import { BlueprintEngineService, TransitionContext } from './blueprint_engine.service';
import { CreateBlueprintDefinitionDto } from './dto/blueprint_definitions_create.dto';
import { UpdateBlueprintDefinitionDto } from './dto/blueprint_definitions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { UserId } from '../shared/decorator/user.decorator';

@ApiTags('Blueprint Definitions')
@ApiBearerAuth()
@Controller('blueprint-definitions')
export class BlueprintDefinitionsController {
  constructor(
    private readonly blueprintDefinitionsService: BlueprintDefinitionsService,
    private readonly blueprintEngineService: BlueprintEngineService,
  ) { }

  @Get()
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint definitions (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.blueprintDefinitionsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Blueprint definitions fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get all blueprint definitions (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const blueprints = await this.blueprintDefinitionsService.findAll(tenantId);
    return DataResponseDto.success(blueprints, 'Blueprint definitions fetched successfully');
  }

  @Get(':id')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get blueprint definition by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const blueprint = await this.blueprintDefinitionsService.findById(id, tenantId);
    return DataResponseDto.success(blueprint);
  }

  @Post()
  @Permissions('blueprints:create')
  @ApiOperation({ summary: 'Create a new blueprint definition' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateBlueprintDefinitionDto) {
    const blueprint = await this.blueprintDefinitionsService.create(tenantId, dto);
    return DataResponseDto.created(blueprint, 'Blueprint definition created successfully');
  }

  @Put(':id')
  @Permissions('blueprints:update')
  @ApiOperation({ summary: 'Update a blueprint definition' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateBlueprintDefinitionDto,
  ) {
    const blueprint = await this.blueprintDefinitionsService.update(id, tenantId, dto);
    return DataResponseDto.success(blueprint, 'Blueprint definition updated successfully');
  }

  @Delete(':id')
  @Permissions('blueprints:delete')
  @ApiOperation({ summary: 'Delete a blueprint definition (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.blueprintDefinitionsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Blueprint definition deleted successfully');
  }

  @Get(':id/transitions/:fromStateId')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Get available transitions from a state' })
  async getAvailableTransitions(
    @Param('id') blueprintId: string,
    @Param('fromStateId') fromStateId: string,
    @TenantId() tenantId: string,
  ) {
    // Verify blueprint belongs to tenant
    await this.blueprintDefinitionsService.findById(blueprintId, tenantId);

    const transitions = await this.blueprintEngineService.getAvailableTransitions(
      blueprintId,
      fromStateId,
    );
    return DataResponseDto.success(transitions, 'Available transitions fetched successfully');
  }

  @Post(':id/validate-transition')
  @Permissions('blueprints:read')
  @ApiOperation({ summary: 'Validate a state transition' })
  async validateTransition(
    @Param('id') blueprintId: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() body: { fromStateId: string; toStateId: string; context?: TransitionContext },
  ) {
    // Verify blueprint belongs to tenant
    await this.blueprintDefinitionsService.findById(blueprintId, tenantId);

    const result: any = await this.blueprintEngineService.validateTransition(
      blueprintId,
      body.fromStateId,
      body.toStateId,
      userId,
      body.context || {},
    );

    if (result.success) {
      return DataResponseDto.success(result, 'Transition is valid');
    } else {
      return DataResponseDto.error(result.message, 400);
    }
  }

  @Post(':id/execute-transition')
  @Permissions('blueprints:update')
  @ApiOperation({ summary: 'Execute a state transition' })
  async executeTransition(
    @Param('id') blueprintId: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @Body() body: {
      fromStateId: string;
      toStateId: string;
      recordId: string;
      context?: TransitionContext;
    },
  ) {
    // Verify blueprint belongs to tenant
    await this.blueprintDefinitionsService.findById(blueprintId, tenantId);

    const result: any = await this.blueprintEngineService.executeTransition(
      blueprintId,
      body.fromStateId,
      body.toStateId,
      body.recordId,
      userId,
      body.context || {},
    );

    if (result.success) {
      return DataResponseDto.success(result, 'Transition executed successfully');
    } else {
      return DataResponseDto.error(result.message, 400);
    }
  }
}
