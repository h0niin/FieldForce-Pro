import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ServiceRequestNotesService } from './service_request_notes.service';
import { CreateServiceRequestNoteDto } from './dto/service_request_notes_create.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';

@ApiTags('Service Request Notes')
@ApiBearerAuth()
@Controller('service-request-notes')
export class ServiceRequestNotesController {
  constructor(private readonly service: ServiceRequestNotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get notes for a service request' })
  async findAll(
    @TenantId() tenantId: string,
    @Query('service_request_id') serviceRequestId: string,
  ) {
    const notes = await this.service.findByServiceRequestId(serviceRequestId, tenantId);
    return DataResponseDto.success(notes, 'Notes fetched successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Add a dispatcher note to a service request' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateServiceRequestNoteDto) {
    const note = await this.service.create(tenantId, dto);
    return DataResponseDto.created(note, 'Note added successfully');
  }
}
