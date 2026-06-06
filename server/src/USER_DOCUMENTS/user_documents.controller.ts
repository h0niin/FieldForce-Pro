import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
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
import { UserDocumentsService } from './user_documents.service';
import { CreateUserDocumentDto } from './dto/user_documents_create.dto';
import { UpdateUserDocumentDto } from './dto/user_documents_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('User Documents')
@ApiBearerAuth()
@Controller('user-documents')
export class UserDocumentsController {
  constructor(private readonly userDocumentsService: UserDocumentsService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all user documents (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.userDocumentsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Documents fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user\'s own documents (self-service, JWT only)' })
  async findMyDocuments(@CurrentUser('id') userId: string, @TenantId() tenantId: string) {
    const documents = await this.userDocumentsService.findByUserId(userId, tenantId);
    return DataResponseDto.success(documents, 'Documents fetched successfully');
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get one of current user\'s own documents by ID (self-service, JWT only)' })
  async findMyDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
  ) {
    const document = await this.userDocumentsService.findByIdAndUserId(id, userId, tenantId);
    return DataResponseDto.success(document);
  }

  @Delete('my/:id')
  @ApiOperation({ summary: 'Delete own document (self-service, JWT only)' })
  async deleteOwn(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @TenantId() tenantId: string,
  ) {
    await this.userDocumentsService.deleteOwn(id, userId, tenantId);
    return DataResponseDto.success(null, 'Document deleted successfully');
  }

  @Get('user/:userId')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all documents for a specific user' })
  async findByUserId(@Param('userId') userId: string, @TenantId() tenantId: string) {
    const documents = await this.userDocumentsService.findByUserId(userId, tenantId);
    return DataResponseDto.success(documents, 'Documents fetched successfully');
  }

  @Get('expiring')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get documents expiring within specified days' })
  async findExpiring(
    @TenantId() tenantId: string,
    @Query('days') days: string = '30',
  ) {
    const documents = await this.userDocumentsService.findExpiringDocuments(
      tenantId,
      parseInt(days, 10),
    );
    return DataResponseDto.success(documents, 'Expiring documents fetched successfully');
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get document by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const document = await this.userDocumentsService.findById(id, tenantId);
    return DataResponseDto.success(document);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a document file and create user document record (self-service, JWT only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = join(process.cwd(), 'uploads', 'documents');
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
  async uploadDocument(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!body.document_name) {
      throw new BadRequestException('document_name is required');
    }
    if (!body.document_type) {
      throw new BadRequestException('document_type is required');
    }

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.APP_PORT || 3000}`;
    const fileUrl = `${appUrl}/uploads/documents/${file.filename}`;

    const document = await this.userDocumentsService.create(tenantId, {
      user_id: userId,
      document_type: body.document_type as CreateUserDocumentDto['document_type'],
      document_name: body.document_name,
      file_url: fileUrl,
      file_type: file.mimetype,
      file_size: file.size,
      issue_date: body.issue_date,
      expiry_date: body.expiry_date,
      issuing_authority: body.issuing_authority,
      document_number: body.document_number,
      notes: body.notes,
    });

    return DataResponseDto.created(document, 'Document uploaded successfully');
  }

  @Post()
  @Permissions('users:update')
  @ApiOperation({ summary: 'Create a new user document' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateUserDocumentDto) {
    const document = await this.userDocumentsService.create(tenantId, dto);
    return DataResponseDto.created(document, 'Document created successfully');
  }

  @Put(':id')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update a user document' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateUserDocumentDto,
  ) {
    const document = await this.userDocumentsService.update(id, tenantId, dto);
    return DataResponseDto.success(document, 'Document updated successfully');
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Delete a user document (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.userDocumentsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Document deleted successfully');
  }

  @Patch(':id/verify')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Verify a user document' })
  async verify(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    const document = await this.userDocumentsService.verify(id, tenantId, userId);
    return DataResponseDto.success(document, 'Document verified successfully');
  }

  @Patch(':id/unverify')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Unverify a user document' })
  async unverify(@Param('id') id: string, @TenantId() tenantId: string) {
    const document = await this.userDocumentsService.unverify(id, tenantId);
    return DataResponseDto.success(document, 'Document unverified successfully');
  }
}
