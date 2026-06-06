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
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto } from './dto/communication_create.dto';
import { UpdateCommunicationDto } from './dto/communication_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Communications')
@ApiBearerAuth()
@Controller('communications')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get()
  @Permissions('communications:read')
  @ApiOperation({ summary: 'Get all communications (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.communicationService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Communications fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'Get all communications (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const communications = await this.communicationService.findAll(tenantId);
    return DataResponseDto.success(communications, 'Communications fetched successfully');
  }

  @Get('contact/:contactId')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'Get all communications for a specific contact' })
  async findByContactId(
    @Param('contactId') contactId: string,
    @TenantId() tenantId: string,
  ) {
    const communications = await this.communicationService.findByContactId(contactId, tenantId);
    return DataResponseDto.success(communications, 'Communications fetched successfully');
  }

  @Get(':id')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'Get communication by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const communication = await this.communicationService.findById(id, tenantId);
    return DataResponseDto.success(communication);
  }

  @Post()
  @Permissions('communications:create')
  @ApiOperation({ summary: 'Create a new communication' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateCommunicationDto) {
    const communication = await this.communicationService.create(tenantId, dto);
    return DataResponseDto.created(communication, 'Communication created successfully');
  }

  @Put(':id')
  @Permissions('communications:update')
  @ApiOperation({ summary: 'Update a communication' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateCommunicationDto,
  ) {
    const communication = await this.communicationService.update(id, tenantId, dto);
    return DataResponseDto.success(communication, 'Communication updated successfully');
  }

  @Delete(':id')
  @Permissions('communications:delete')
  @ApiOperation({ summary: 'Delete a communication (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.communicationService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Communication deleted successfully');
  }
}
