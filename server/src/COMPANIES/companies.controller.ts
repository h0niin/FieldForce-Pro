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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/companies_create.dto';
import { UpdateCompanyDto } from './dto/companies_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

class CreateCompanyTypeDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;
}

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

  // ── Company Types — defined before :id to avoid route conflict ───────────

  @Get('types')
  @ApiOperation({ summary: 'List custom company types' })
  async getTypes(@TenantId() tenantId: string) {
    const types = await this.companiesService.findAllTypes(tenantId);
    return DataResponseDto.success(types, 'Company types fetched successfully');
  }

  @Post('types')
  @ApiOperation({ summary: 'Create a custom company type' })
  async createType(@TenantId() tenantId: string, @Body() dto: CreateCompanyTypeDto) {
    const type = await this.companiesService.createType(tenantId, dto.name);
    return DataResponseDto.created(type, 'Company type created');
  }

  @Delete('types/:typeId')
  @ApiOperation({ summary: 'Delete a custom company type (soft)' })
  async deleteType(@Param('typeId') typeId: string, @TenantId() tenantId: string) {
    await this.companiesService.deleteType(typeId, tenantId);
    return DataResponseDto.success(null, 'Company type deleted');
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
  async create(@TenantId() tenantId: string, @Body() dto: CreateCompanyDto) {
    const company = await this.companiesService.create(tenantId, dto);
    return DataResponseDto.created(company, 'Company created successfully');
  }

  @Put(':id')
  @Permissions('companies:update')
  @ApiOperation({ summary: 'Update a company' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    const company = await this.companiesService.update(id, tenantId, dto);
    return DataResponseDto.success(company, 'Company updated successfully');
  }

  @Delete(':id')
  @Permissions('companies:delete')
  @ApiOperation({ summary: 'Delete a company (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.companiesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Company deleted successfully');
  }
}
