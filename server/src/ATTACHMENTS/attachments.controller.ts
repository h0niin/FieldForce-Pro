import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
  SetMetadata,
} from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../shared/decorator/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { UserId } from '../shared/decorator/user.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(TenantGuard) // JwtAuthGuard is globally applied
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload attachments for a service request' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
      cb(null, true);
    }
  }))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('requestId') requestId: string,
    @UserId() userId: string,
    @TenantId() tenantId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    if (!requestId) {
      throw new BadRequestException('requestId is required');
    }

    const tenantDir = path.join(UPLOADS_DIR, tenantId, requestId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }

    const savedFiles = [];
    for (const file of files) {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(tenantDir, uniqueFileName);
      fs.writeFileSync(filePath, file.buffer);
      
      const fileUrl = `/uploads/${tenantId}/${requestId}/${uniqueFileName}`;
      savedFiles.push({
        fileName: file.originalname,
        fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
      });
    }

    return this.attachmentsService.saveAttachments(requestId, tenantId, userId, savedFiles);
  }

  @Get(':requestId')
  @ApiOperation({ summary: 'Get attachments for a service request' })
  async getAttachments(
    @Param('requestId') requestId: string,
    @TenantId() tenantId: string,
  ) {
    return this.attachmentsService.getAttachments(requestId, tenantId);
  }

  @Post('estimate-upload')
  @ApiOperation({ summary: 'Upload attachments for an estimate (on-site photos)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
      cb(null, true);
    }
  }))
  async uploadEstimateFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('estimateId') estimateId: string,
    @UserId() userId: string,
    @TenantId() tenantId: string,
  ) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    if (!estimateId) throw new BadRequestException('estimateId is required');

    const tenantDir = path.join(UPLOADS_DIR, tenantId, 'estimates', estimateId);
    if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });

    const savedFiles = [];
    for (const file of files) {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(tenantDir, uniqueFileName);
      fs.writeFileSync(filePath, file.buffer);
      savedFiles.push({
        fileName: file.originalname,
        fileUrl: `/uploads/${tenantId}/estimates/${estimateId}/${uniqueFileName}`,
        fileType: file.mimetype,
        fileSize: file.size,
      });
    }

    return this.attachmentsService.saveEstimateAttachments(estimateId, tenantId, userId, savedFiles);
  }

  @Get('estimate/:estimateId')
  @ApiOperation({ summary: 'Get attachments for an estimate' })
  async getEstimateAttachments(
    @Param('estimateId') estimateId: string,
    @TenantId() tenantId: string,
  ) {
    return this.attachmentsService.getEstimateAttachments(estimateId, tenantId);
  }

  @SetMetadata(IS_PUBLIC_KEY, true)
  @Get('estimate-public/:estimateId')
  @ApiOperation({ summary: 'Get estimate attachments for public customer view (no auth)' })
  async getEstimateAttachmentsPublic(
    @Param('estimateId') estimateId: string,
  ) {
    return this.attachmentsService.getEstimateAttachmentsPublic(estimateId);
  }
}
