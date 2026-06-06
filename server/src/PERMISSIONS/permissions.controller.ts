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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/permissions_create.dto';
import { UpdatePermissionDto } from './dto/permissions_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { Permissions } from '../shared/decorator/permission.decorator';
import { Public } from '../shared/decorator/public.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@Public() // TEMPORARY: Remove this after initial setup is complete
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  // @Permissions('permissions:read') // TEMPORARY: Commented out for initial setup
  @ApiOperation({ summary: 'Get all permissions (paginated)' })
  async findAll(@Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.permissionsService.findAllPaginated(pageOptionsDto);
    return DataResponseDto.success(result.data, 'Permissions fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('all')
  // @Permissions('permissions:read') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Get all permissions (non-paginated)' })
  async findAllNonPaginated() {
    const permissions = await this.permissionsService.findAll();
    return DataResponseDto.success(permissions, 'Permissions fetched successfully');
  }

  @Get('module/:module')
  // @Permissions('permissions:read') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Get permissions by module' })
  async findByModule(@Param('module') module: string) {
    const permissions = await this.permissionsService.findByModule(module);
    return DataResponseDto.success(permissions, 'Permissions fetched successfully');
  }

  @Get(':id')
  // @Permissions('permissions:read') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Get permission by ID' })
  async findOne(@Param('id') id: string) {
    const permission = await this.permissionsService.findById(id);
    return DataResponseDto.success(permission);
  }

  @Post()
  // @Permissions('permissions:create') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() dto: CreatePermissionDto) {
    const permission = await this.permissionsService.create(dto);
    return DataResponseDto.created(permission, 'Permission created successfully');
  }

  @Post('seed')
  // @Permissions('permissions:manage') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Seed all system permissions' })
  async seedAll() {
    const result = await this.permissionsService.seedAll();
    return DataResponseDto.created(
      result,
      `Seeded permissions: ${result.created} created, ${result.skipped} skipped (already exist)`,
    );
  }

  @Post('bulk')
  // @Permissions('permissions:create') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Bulk create permissions' })
  async bulkCreate(@Body() dtos: CreatePermissionDto[]) {
    const permissions = await this.permissionsService.bulkCreate(dtos);
    return DataResponseDto.created(permissions, 'Permissions created successfully');
  }

  @Put(':id')
  // @Permissions('permissions:update') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Update a permission' })
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    const permission = await this.permissionsService.update(id, dto);
    return DataResponseDto.success(permission, 'Permission updated successfully');
  }

  @Delete(':id')
  // @Permissions('permissions:delete') // TEMPORARY: Commented for initial setup
  @ApiOperation({ summary: 'Delete a permission' })
  async remove(@Param('id') id: string) {
    await this.permissionsService.delete(id);
    return DataResponseDto.success(null, 'Permission deleted successfully');
  }
}
