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
import { WebformsService } from './webforms.service';
import { CreateWebformDto } from './dto/webforms_create.dto';
import { UpdateWebformDto } from './dto/webforms_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Webforms')
@ApiBearerAuth()
@Controller('webforms')
export class WebformsController {
  constructor(private readonly webformsService: WebformsService) {}

  @Get()
  @Permissions('webforms:read')
  @ApiOperation({ summary: 'Get all webforms (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.webformsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Webforms fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('webforms:read')
  @ApiOperation({ summary: 'Get all webforms (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const webforms = await this.webformsService.findAll(tenantId);
    return DataResponseDto.success(webforms, 'Webforms fetched successfully');
  }

  @Get(':id')
  @Permissions('webforms:read')
  @ApiOperation({ summary: 'Get webform by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const webform = await this.webformsService.findById(id, tenantId);
    return DataResponseDto.success(webform);
  }

  @Post()
  @Permissions('webforms:create')
  @ApiOperation({ summary: 'Create a new webform' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWebformDto) {
    const webform = await this.webformsService.create(tenantId, dto);
    return DataResponseDto.created(webform, 'Webform created successfully');
  }

  @Put(':id')
  @Permissions('webforms:update')
  @ApiOperation({ summary: 'Update a webform' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWebformDto,
  ) {
    const webform = await this.webformsService.update(id, tenantId, dto);
    return DataResponseDto.success(webform, 'Webform updated successfully');
  }

  @Delete(':id')
  @Permissions('webforms:delete')
  @ApiOperation({ summary: 'Delete a webform (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.webformsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Webform deleted successfully');
  }
}
