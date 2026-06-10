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
import { AutomationActionsService } from './automation_actions.service';
import { CreateAutomationActionDto } from './dto/automation_actions_create.dto';
import { UpdateAutomationActionDto } from './dto/automation_actions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Automation Actions')
@ApiBearerAuth()
@Controller('automation-actions')
export class AutomationActionsController {
  constructor(private readonly automationActionsService: AutomationActionsService) {}

  @Get()
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all automation actions (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.automationActionsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Automation actions fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all automation actions (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const actions = await this.automationActionsService.findAll(tenantId);
    return DataResponseDto.success(actions, 'Automation actions fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get automation action by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const action = await this.automationActionsService.findById(id, tenantId);
    return DataResponseDto.success(action);
  }

  @Post()
  @Permissions('workflow_rules:create')
  @ApiOperation({ summary: 'Create a new automation action' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateAutomationActionDto) {
    const action = await this.automationActionsService.create(tenantId, dto);
    return DataResponseDto.created(action, 'Automation action created successfully');
  }

  @Put(':id')
  @Permissions('workflow_rules:update')
  @ApiOperation({ summary: 'Update an automation action' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateAutomationActionDto,
  ) {
    const action = await this.automationActionsService.update(id, tenantId, dto);
    return DataResponseDto.success(action, 'Automation action updated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_rules:delete')
  @ApiOperation({ summary: 'Delete an automation action' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.automationActionsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Automation action deleted successfully');
  }
}
