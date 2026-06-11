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
import { TimeBasedRulesService } from './time_based_rules.service';
import { CreateTimeBasedRuleDto } from './dto/time_based_rules_create.dto';
import { UpdateTimeBasedRuleDto } from './dto/time_based_rules_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Time Based Rules')
@ApiBearerAuth()
@Controller('time-based-rules')
export class TimeBasedRulesController {
  constructor(private readonly timeBasedRulesService: TimeBasedRulesService) {}

  @Get()
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all time based rules (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.timeBasedRulesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Time based rules fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get all time based rules (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const rules = await this.timeBasedRulesService.findAll(tenantId);
    return DataResponseDto.success(rules, 'Time based rules fetched successfully');
  }

  @Get(':id')
  @Permissions('workflow_rules:read')
  @ApiOperation({ summary: 'Get time based rule by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const rule = await this.timeBasedRulesService.findById(id, tenantId);
    return DataResponseDto.success(rule);
  }

  @Post()
  @Permissions('workflow_rules:create')
  @ApiOperation({ summary: 'Create a new time based rule' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateTimeBasedRuleDto) {
    const rule = await this.timeBasedRulesService.create(tenantId, dto);
    return DataResponseDto.created(rule, 'Time based rule created successfully');
  }

  @Put(':id')
  @Permissions('workflow_rules:update')
  @ApiOperation({ summary: 'Update a time based rule' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateTimeBasedRuleDto,
  ) {
    const rule = await this.timeBasedRulesService.update(id, tenantId, dto);
    return DataResponseDto.success(rule, 'Time based rule updated successfully');
  }

  @Delete(':id')
  @Permissions('workflow_rules:delete')
  @ApiOperation({ summary: 'Delete a time based rule' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.timeBasedRulesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Time based rule deleted successfully');
  }
}
