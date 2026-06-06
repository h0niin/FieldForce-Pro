import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, UpdateDocumentDto, QueryDocumentsDto } from './dto/documents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { Permissions } from '../shared/decorator/permission.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @Permissions('documents.create')
  @ApiOperation({ summary: 'Upload and parse a document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document uploaded and parsing started' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.documentsService.uploadAndParse(file, dto, tenantId, userId);
    return {
      statusCode: HttpStatus.CREATED,
      status: true,
      message: 'Document uploaded and parsed',
      data: result,
    };
  }

  @Get()
  @Permissions('documents.view')
  @ApiOperation({ summary: 'Get parsed documents' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Documents retrieved' })
  async getDocuments(
    @Query() dto: QueryDocumentsDto,
    @Query() pageOptions: PageOptionsDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.documentsService.getDocuments(dto, pageOptions, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Documents retrieved',
      data: result.data,
      meta: result.meta as unknown as Record<string, unknown>,
    };
  }

  @Get(':id')
  @Permissions('documents.view')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document retrieved' })
  async getDocument(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.documentsService.getDocumentById(id, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Document retrieved',
      data: result,
    };
  }

  @Put(':id')
  @Permissions('documents.update')
  @ApiOperation({ summary: 'Update document corrections/status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document updated' })
  async updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.documentsService.updateDocument(id, dto, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Document updated',
      data: result,
    };
  }

  @Delete(':id')
  @Permissions('documents.delete')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document deleted' })
  async deleteDocument(
    @Param('id') id: string,
    @TenantId() tenantId: string,
  ): Promise<DataResponseDto<any>> {
    await this.documentsService.deleteDocument(id, tenantId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Document deleted',
      data: null,
    };
  }
}
