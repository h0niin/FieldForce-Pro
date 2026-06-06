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
import { WorkflowRulesService } from './workflow_rules.service';
import { CreateWorkflowRuleDto } from './dto/workflow_rules_create.dto';
import { UpdateWorkflowRuleDto } from './dto/workflow_rules_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Workflow Rules')
@ApiBearerAuth()
@Controller('workflow-rules')
export class WorkflowRulesController {
  constructor(private readonly workflowRulesService: WorkflowRulesService) {}

  @Get()
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all workflow rules (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.workflowRulesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Workflow rules fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all workflow rules (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const rules = await this.workflowRulesService.findAll(tenantId);
    return DataResponseDto.success(rules, 'Workflow rules fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get workflow rule by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const rule = await this.workflowRulesService.findById(id, tenantId);
    return DataResponseDto.success(rule);
  }

  @Post()
  @Permissions('workflow_rules:create')
  @ApiOperation({ summary: 'Create a new workflow rule' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkflowRuleDto) {
    const rule = await this.workflowRulesService.create(tenantId, dto);
    return DataResponseDto.created(rule, 'Workflow rule created successfully');
  }

  @Put(':id')
  @Permissions('workflow_rules:update')
  @ApiOperation({ summary: 'Update a workflow rule' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkflowRuleDto,
  ) {
    const rule = await this.workflowRulesService.update(id, tenantId, dto);
    return DataResponseDto.success(rule, 'Workflow rule updated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_rules:delete')
  @ApiOperation({ summary: 'Delete a workflow rule (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workflowRulesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Workflow rule deleted successfully');
  }
}
