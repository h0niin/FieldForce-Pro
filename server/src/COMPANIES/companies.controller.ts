import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/companies_create.dto';
import { UpdateCompanyDto } from './dto/companies_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.companiesService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Companies fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all companies (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const companies = await this.companiesService.findAll(tenantId);
    return DataResponseDto.success(companies, 'Companies fetched successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const company = await this.companiesService.findById(id, tenantId);
    return DataResponseDto.success(company);
  }

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get company insights' })
  async getInsights(@Param('id') id: string, @TenantId() tenantId: string) {
    const insights = await this.companiesService.getInsights(id, tenantId);
    return DataResponseDto.success(insights, 'Insights fetched successfully');
  }

  @Post()
  @Permissions('companies:create')
  @ApiOperation({ summary: 'Create a new company' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateCompanyDto, @CurrentUser('id') userId: string) {
    const company = await this.companiesService.create(tenantId, dto, userId);
    return DataResponseDto.created(company, 'Company created successfully');
  }

  @Put(':id')
  @Permissions('companies:update')
  @ApiOperation({ summary: 'Update a company' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser('id') userId: string,
  ) {
    const company = await this.companiesService.update(id, tenantId, dto, userId);
    return DataResponseDto.success(company, 'Company updated successfully');
  }

  @Delete(':id')
  @Permissions('companies:delete')
  @ApiOperation({ summary: 'Delete a company (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.companiesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Company deleted successfully');
  }

  @Post('import')
  @Permissions('companies:create')
  @ApiOperation({ summary: 'Import companies from CSV' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) // 5MB limit
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.companiesService.importCsv(file.buffer, tenantId, userId);
    return DataResponseDto.success(result, 'Companies imported successfully');
  }

  @Post('export/csv')
  @Permissions('companies:read')
  @ApiOperation({ summary: 'Export companies to CSV' })
  async exportCsv(@TenantId() tenantId: string, @Res() res: Response, @Body() body?: { recordIds?: string[] }) {
    const csvData = await this.companiesService.exportCsv(tenantId, body?.recordIds);
    res.header('Content-Type', 'text/csv');
    res.attachment('companies.csv');
    return res.send(csvData);
  }

  @Put('bulk/change-owner')
  @Permissions('companies:update')
  @ApiOperation({ summary: 'Bulk change owner of companies' })
  async changeOwner(
    @Body() body: { recordIds: string[]; newOwnerId: string },
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.companiesService.changeOwner(body.recordIds, body.newOwnerId, tenantId, userId);
    return DataResponseDto.success(null, 'Owner changed successfully');
  }

  @Post('bulk/merge')
  @Permissions('companies:update', 'companies:delete')
  @ApiOperation({ summary: 'Merge duplicate company into master' })
  async mergeRecords(
    @Body() body: { masterRecordId: string; duplicateRecordId: string },
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.companiesService.mergeRecords(body.masterRecordId, body.duplicateRecordId, tenantId, userId);
    return DataResponseDto.success(null, 'Companies merged successfully');
  }
}
