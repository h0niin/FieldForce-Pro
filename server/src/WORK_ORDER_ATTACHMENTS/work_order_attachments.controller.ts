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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WorkOrderAttachmentsService } from './work_order_attachments.service';
import { CreateWorkOrderAttachmentDto } from './dto/work_order_attachments_create.dto';
import { UpdateWorkOrderAttachmentDto } from './dto/work_order_attachments_update.dto';
import { WorkOrderAttachmentQueryDto } from './dto/work_order_attachments_query.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Work Order Attachments')
@ApiBearerAuth()
@Controller('work-order-attachments')
export class WorkOrderAttachmentsController {
  constructor(private readonly workOrderAttachmentsService: WorkOrderAttachmentsService) { }

  @Get()
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order attachments (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() query: WorkOrderAttachmentQueryDto) {
    const result = await this.workOrderAttachmentsService.findAllPaginated(tenantId, query);
    return DataResponseDto.success(result.data, 'Work order attachments fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all work order attachments (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const attachments = await this.workOrderAttachmentsService.findAll(tenantId);
    return DataResponseDto.success(attachments, 'Work order attachments fetched successfully');
  }

  @Get('work-order/:workOrderId')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get all attachments for a work order' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const attachments = await this.workOrderAttachmentsService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(attachments, 'Work order attachments fetched successfully');
  }

  @Get(':id')
  @Permissions('work_orders:read')
  @ApiOperation({ summary: 'Get work order attachment by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const attachment = await this.workOrderAttachmentsService.findById(id, tenantId);
    return DataResponseDto.success(attachment);
  }

  @Post('upload')
  @Permissions('work_orders:create')
  @ApiOperation({ summary: 'Upload a file and create work order attachment' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'work-order-attachments');
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @TenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!body.work_order_id) {
      throw new BadRequestException('work_order_id is required');
    }

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
    const fileUrl = `${appUrl}/uploads/work-order-attachments/${file.filename}`;

    const attachment = await this.workOrderAttachmentsService.create(tenantId, {
      work_order_id: body.work_order_id,
      file_url: fileUrl,
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
    });

    return DataResponseDto.created(attachment, 'File uploaded successfully');
  }

  @Post()
  @Permissions('work_orders:create')
  @ApiOperation({ summary: 'Create a new work order attachment' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateWorkOrderAttachmentDto) {
    const attachment = await this.workOrderAttachmentsService.create(tenantId, dto);
    return DataResponseDto.created(attachment, 'Work order attachment created successfully');
  }

  @Put(':id')
  @Permissions('work_orders:update')
  @ApiOperation({ summary: 'Update a work order attachment' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateWorkOrderAttachmentDto,
  ) {
    const attachment = await this.workOrderAttachmentsService.update(id, tenantId, dto);
    return DataResponseDto.success(attachment, 'Work order attachment updated successfully');
  }

  @Delete(':id')
  @Permissions('work_orders:delete')
  @ApiOperation({ summary: 'Delete a work order attachment (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.workOrderAttachmentsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Work order attachment deleted successfully');
  }
}
