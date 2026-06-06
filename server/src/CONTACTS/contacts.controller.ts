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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/contacts_create.dto';
import { UpdateContactDto } from './dto/contacts_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

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
  async findAllNonPaginated(@TenantId() tenantId: string) {
    const contacts = await this.contactsService.findAll(tenantId);
    return DataResponseDto.success(contacts, 'Contacts fetched successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const contact = await this.contactsService.findById(id, tenantId);
    return DataResponseDto.success(contact);
  }

  @Post()
  @Permissions('contacts:create')
  @ApiOperation({ summary: 'Create a new contact' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateContactDto) {
    const contact = await this.contactsService.create(tenantId, dto);
    return DataResponseDto.created(contact, 'Contact created successfully');
  }

  @Put(':id')
  @Permissions('contacts:update')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateContactDto,
  ) {
    const contact = await this.contactsService.update(id, tenantId, dto);
    return DataResponseDto.success(contact, 'Contact updated successfully');
  }

  @Delete(':id')
  @Permissions('contacts:delete')
  @ApiOperation({ summary: 'Delete a contact (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.contactsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Contact deleted successfully');
  }
}
