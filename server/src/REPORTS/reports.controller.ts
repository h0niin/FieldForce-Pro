import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report_query.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('work-orders')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get work order report' })
  async getWorkOrderReport(
    @TenantId() tenantId: string,
    @Query() queryDto: ReportQueryDto,
  ) {
    const result = await this.reportsService.getWorkOrderReport(tenantId, queryDto);
    return DataResponseDto.success(result, 'Work order report fetched successfully');
  }

  @Get('invoices')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get invoice report' })
  async getInvoiceReport(
    @TenantId() tenantId: string,
    @Query() queryDto: ReportQueryDto,
  ) {
    const result = await this.reportsService.getInvoiceReport(tenantId, queryDto);
    return DataResponseDto.success(result, 'Invoice report fetched successfully');
  }

  @Get('performance')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get performance report' })
  async getPerformanceReport(
    @TenantId() tenantId: string,
    @Query() queryDto: ReportQueryDto,
  ) {
    const result = await this.reportsService.getPerformanceReport(tenantId, queryDto);
    return DataResponseDto.success(result, 'Performance report fetched successfully');
  }

  @Get('service-requests')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get service request report' })
  async getServiceRequestReport(
    @TenantId() tenantId: string,
    @Query() queryDto: ReportQueryDto,
  ) {
    const result = await this.reportsService.getServiceRequestReport(tenantId, queryDto);
    return DataResponseDto.success(result, 'Service request report fetched successfully');
  }

  @Get('payments')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'Get payment report' })
  async getPaymentReport(
    @TenantId() tenantId: string,
    @Query() queryDto: ReportQueryDto,
  ) {
    const result = await this.reportsService.getPaymentReport(tenantId, queryDto);
    return DataResponseDto.success(result, 'Payment report fetched successfully');
  }
}
