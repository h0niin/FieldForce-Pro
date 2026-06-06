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
import { WorkOrderNotesService } from './work_order_notes.service';
import { CreateWorkOrderNoteDto } from './dto/work_order_notes_create.dto';
import { UpdateWorkOrderNoteDto } from './dto/work_order_notes_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { WorkOrderNotesQueryDto } from './dto/work_order_notes_query.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Work Order Notes')
@ApiBearerAuth()
@Controller('work-order-notes')
export class WorkOrderNotesController {
  constructor(private readonly workOrderNotesService: WorkOrderNotesService) {}

  @Get()
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order notes (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() queryDto: WorkOrderNotesQueryDto) {
    const result = await this.workOrderNotesService.findAllPaginated(tenantId, queryDto);
    return DataResponseDto.success(result.data, 'Work order notes fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order notes (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const notes = await this.workOrderNotesService.findAll(tenantId);
    return DataResponseDto.success(notes, 'Work order notes fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all notes for a work order' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const notes = await this.workOrderNotesService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(notes, 'Work order notes fetched successfully');
  }

  @Get(':id')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work order note by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const note = await this.workOrderNotesService.findById(id, tenantId);
    return DataResponseDto.success(note);
  }

  @Post()
  @Permissions('work_orders:create')
  @ApiOperation({ summary: 'Create a new work order note' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkOrderNoteDto) {
    const note = await this.workOrderNotesService.create(tenantId, dto);
    return DataResponseDto.created(note, 'Work order note created successfully');
  }

  @Put(':id')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Update a work order note' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkOrderNoteDto,
  ) {
    const note = await this.workOrderNotesService.update(id, tenantId, dto);
    return DataResponseDto.success(note, 'Work order note updated successfully');
  }

  @Delete(':id')
  @Permissions('work_orders:delete')
  @ApiOperation({ summary: 'Delete a work order note (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workOrderNotesService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Work order note deleted successfully');
  }
}
