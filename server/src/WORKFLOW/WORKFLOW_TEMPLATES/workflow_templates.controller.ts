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
import { WorkflowTemplatesService } from './workflow_templates.service';
import { CreateWorkflowTemplateDto, UpdateWorkflowTemplateDto } from './dto/workflow_templates.dto';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';
import { DataResponseDto } from '../../shared/dto/data-response.dto';
import { TenantId } from '../../shared/decorator/tenant.decorator';
import { Permissions } from '../../shared/decorator/permission.decorator';

@ApiTags('Workflow Templates')
@ApiBearerAuth()
@Controller('workflow-templates')
export class WorkflowTemplatesController {
  constructor(
    private readonly workflowTemplatesService: WorkflowTemplatesService,
  ) {}

  @Get()
  @Permissions('workflow_templates:read')
  @ApiOperation({ summary: 'Get all workflow templates (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.workflowTemplatesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Workflow templates fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('workflow_templates:read')
  @ApiOperation({ summary: 'Get all workflow templates (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const templates = await this.workflowTemplatesService.findAll(tenantId);
    return DataResponseDto.success(templates, 'Workflow templates fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_templates:read')
  @ApiOperation({ summary: 'Get workflow template by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const template = await this.workflowTemplatesService.findById(id, tenantId);
    return DataResponseDto.success(template);
  }

  @Post()
  @Permissions('workflow_templates:create')
  @ApiOperation({ summary: 'Create a new workflow template' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkflowTemplateDto) {
    const template = await this.workflowTemplatesService.create(tenantId, dto);
    return DataResponseDto.created(template, 'Workflow template created successfully');
  }

  @Put(':id')
  @Permissions('workflow_templates:update')
  @ApiOperation({ summary: 'Update a workflow template' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkflowTemplateDto,
  ) {
    const template = await this.workflowTemplatesService.update(id, tenantId, dto);
    return DataResponseDto.success(template, 'Workflow template updated successfully');
  }

  @Patch(':id/activate')
  @Permissions('workflow_templates:update')
  @ApiOperation({ summary: 'Activate a workflow template (deactivates others for same document type)' })
  async activate(@Param('id') id: string, @TenantId() tenantId: string) {
    const template = await this.workflowTemplatesService.activate(id, tenantId);
    return DataResponseDto.success(template, 'Workflow template activated successfully');
  }

  @Patch(':id/deactivate')
  @Permissions('workflow_templates:update')
  @ApiOperation({ summary: 'Deactivate a workflow template' })
  async deactivate(@Param('id') id: string, @TenantId() tenantId: string) {
    const template = await this.workflowTemplatesService.deactivate(id, tenantId);
    return DataResponseDto.success(template, 'Workflow template deactivated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_templates:delete')
  @ApiOperation({ summary: 'Delete a workflow template (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workflowTemplatesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Workflow template deleted successfully');
  }
}
