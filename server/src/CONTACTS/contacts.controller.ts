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
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/contacts_create.dto';
import { UpdateContactDto } from './dto/contacts_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { CurrentUser } from '../shared/decorator/current-user.decorator';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contacts (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.contactsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Contacts fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all contacts (non-paginated)' })
  async findAllNonPaginated(@TenantId() tenantId: string, @Query('company_id') companyId?: string) {
    const contacts = await this.contactsService.findAll(tenantId, companyId);
    return DataResponseDto.success(contacts, 'Contacts fetched successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const contact = await this.contactsService.findById(id, tenantId);
    return DataResponseDto.success(contact);
  }

  @Get(':id/insights')
  @ApiOperation({ summary: 'Get contact insights' })
  async getInsights(@Param('id') id: string, @TenantId() tenantId: string) {
    const insights = await this.contactsService.getInsights(id, tenantId);
    return DataResponseDto.success(insights, 'Insights fetched successfully');
  }

  @Post()
  @Permissions('contacts:create')
  @ApiOperation({ summary: 'Create a new contact' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateContactDto, @CurrentUser('id') userId: string) {
    const contact = await this.contactsService.create(tenantId, dto, userId);
    return DataResponseDto.created(contact, 'Contact created successfully');
  }

  @Put(':id')
  @Permissions('contacts:update')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser('id') userId: string,
  ) {
    const contact = await this.contactsService.update(id, tenantId, dto, userId);
    return DataResponseDto.success(contact, 'Contact updated successfully');
  }

  @Delete(':id')
  @Permissions('contacts:delete')
  @ApiOperation({ summary: 'Delete a contact (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.contactsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Contact deleted successfully');
  }

  @Post('import')
  @Permissions('contacts:create')
  @ApiOperation({ summary: 'Import contacts from CSV' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) // 5MB limit
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const result = await this.contactsService.importCsv(file.buffer, tenantId, userId);
    return DataResponseDto.success(result, 'Contacts imported successfully');
  }

  @Post('export/csv')
  @Permissions('contacts:read')
  @ApiOperation({ summary: 'Export contacts to CSV' })
  async exportCsv(@TenantId() tenantId: string, @Res() res: Response, @Body() body?: { recordIds?: string[] }) {
    const csvData = await this.contactsService.exportCsv(tenantId, body?.recordIds);
    res.header('Content-Type', 'text/csv');
    res.attachment('contacts.csv');
    return res.send(csvData);
  }

  @Put('bulk/change-owner')
  @Permissions('contacts:update')
  @ApiOperation({ summary: 'Bulk change owner of contacts' })
  async changeOwner(
    @Body() body: { recordIds: string[]; newOwnerId: string },
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.contactsService.changeOwner(body.recordIds, body.newOwnerId, tenantId, userId);
    return DataResponseDto.success(null, 'Owner changed successfully');
  }

  @Post('bulk/merge')
  @Permissions('contacts:update', 'contacts:delete')
  @ApiOperation({ summary: 'Merge duplicate contact into master' })
  async mergeRecords(
    @Body() body: { masterRecordId: string; duplicateRecordId: string },
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.contactsService.mergeRecords(body.masterRecordId, body.duplicateRecordId, tenantId, userId);
    return DataResponseDto.success(null, 'Contacts merged successfully');
  }
}
