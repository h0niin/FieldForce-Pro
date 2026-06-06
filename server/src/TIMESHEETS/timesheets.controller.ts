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
import { TimesheetsService } from './timesheets.service';
import { CreateTimesheetDto } from './dto/timesheets_create.dto';
import { UpdateTimesheetDto } from './dto/timesheets_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Timesheets')
@ApiBearerAuth()
@Controller('timesheets')
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get()
  @Permissions('timesheets:read')
  @ApiOperation({ summary: 'Get all timesheets (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.timesheetsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Timesheets fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('timesheets:read')
  @ApiOperation({ summary: 'Get all timesheets (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const timesheets = await this.timesheetsService.findAll(tenantId);
    return DataResponseDto.success(timesheets, 'Timesheets fetched successfully');
  }

  @Get('user/:userId')
  @Permissions('timesheets:read')
  @ApiOperation({ summary: 'Get timesheets by user ID (paginated)' })
  async findByUserId(
    @Param('userId') userId: string,
    @TenantId() tenantId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ) {
    const result = await this.timesheetsService.findByUserId(userId, tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'User timesheets fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @Permissions('timesheets:read')
  @ApiOperation({ summary: 'Get timesheet by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const timesheet = await this.timesheetsService.findById(id, tenantId);
    return DataResponseDto.success(timesheet);
  }

  @Post()
  @Permissions('timesheets:create')
  @ApiOperation({ summary: 'Create a new timesheet entry' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateTimesheetDto) {
    const timesheet = await this.timesheetsService.create(tenantId, dto);
    return DataResponseDto.created(timesheet, 'Timesheet created successfully');
  }

  @Put(':id')
  @Permissions('timesheets:update')
  @ApiOperation({ summary: 'Update a timesheet entry' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateTimesheetDto,
  ) {
    const timesheet = await this.timesheetsService.update(id, tenantId, dto);
    return DataResponseDto.success(timesheet, 'Timesheet updated successfully');
  }

  @Patch(':id/approve')
  @Permissions('timesheets:update')
  @ApiOperation({ summary: 'Approve a pending timesheet' })
  async approve(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('approved_by') approvedBy: string,
  ) {
    const timesheet = await this.timesheetsService.approve(id, tenantId, approvedBy);
    return DataResponseDto.success(timesheet, 'Timesheet approved successfully');
  }

  @Patch(':id/reject')
  @Permissions('timesheets:update')
  @ApiOperation({ summary: 'Reject a pending timesheet' })
  async reject(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('approved_by') approvedBy: string,
  ) {
    const timesheet = await this.timesheetsService.reject(id, tenantId, approvedBy);
    return DataResponseDto.success(timesheet, 'Timesheet rejected successfully');
  }

  @Delete(':id')
  @Permissions('timesheets:delete')
  @ApiOperation({ summary: 'Delete a timesheet entry (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.timesheetsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Timesheet deleted successfully');
  }
}
