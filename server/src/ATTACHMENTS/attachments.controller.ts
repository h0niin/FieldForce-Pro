import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
  SetMetadata,
  Req,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { diskStorage } from 'multer';
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
  private readonly logger = new Logger(AttachmentsController.name);

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
      
      const fileUrl = `/api/uploads/${tenantId}/${requestId}/${uniqueFileName}`;
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
        fileUrl: `/api/uploads/${tenantId}/estimates/${estimateId}/${uniqueFileName}`,
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

  @Post('global-upload')
  @ApiOperation({ summary: 'Upload global attachments for any entity type' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        const tenantId = req.user?.tenant_id || req.user?.tenantId;
        const entityType = req.body.entity_type;
        const entityId = req.body.entity_id;

        if (!userId || !tenantId || !entityType || !entityId) {
          return cb(new BadRequestException('Missing required fields for upload'), '');
        }

        const flatPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(flatPath)) {
          fs.mkdirSync(flatPath, { recursive: true });
        }
        cb(null, flatPath);
      },
      filename: (req, file, cb) => {
        const uniqueFileName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFileName);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      }
      cb(null, true);
    }
  }))
  async uploadGlobalFiles(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('entity_type') entityType: string,
    @Body('entity_id') entityId: string,
  ) {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.sub;
      const tenantId = req.user?.tenant_id || req.user?.tenantId;

      if (!userId || !tenantId) {
        throw new UnauthorizedException('Missing user or tenant context');
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('No files uploaded');
      }
      if (!entityType || !entityId) {
        throw new BadRequestException('entityType and entityId are required');
      }

      const savedFiles = [];
      for (const file of files) {
        // file.filename is generated by diskStorage
        const fileUrl = `/api/attachments/download/${file.filename}`;
        savedFiles.push({
          fileName: file.originalname,
          fileUrl,
          fileType: file.mimetype,
          fileSize: file.size,
        });
      }

      return await this.attachmentsService.saveGlobalAttachments(entityType, entityId, tenantId, userId, savedFiles);
    } catch (error: any) {
      this.logger.error('Save failed:', error);
      throw new InternalServerErrorException('Failed to upload global files');
    }
  }

  @Get('global/:entityType/:entityId')
  @ApiOperation({ summary: 'Get global attachments for an entity' })
  async getGlobalAttachments(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @TenantId() tenantId: string,
  ) {
    return this.attachmentsService.getGlobalAttachments(entityType, entityId, tenantId);
  }

  @Delete('global/:id')
  @ApiOperation({ summary: 'Delete a global attachment' })
  async deleteGlobalAttachment(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ) {
    return this.attachmentsService.deleteGlobalAttachment(id, tenantId);
  }

  @Get('download/:filename')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @ApiOperation({ summary: 'Stream an attachment file' })
  downloadFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    return res.sendFile(filePath);
  }
}
