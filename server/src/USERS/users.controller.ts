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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/users_create.dto';
import { UpdateUserDto } from './dto/users_update.dto';
import { InviteUserDto } from './dto/invite_user.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.usersService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Users fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('agents')
  @Permissions('service_appointments:create', 'scheduling:create')
  @ApiOperation({ summary: 'Get all active users for agent assignment (used in scheduling forms)' })
  async findAgents(@TenantId() tenantId: string) {
    const agents = await this.usersService.findAgents(tenantId);
    return DataResponseDto.success(agents, 'Agents fetched successfully');
  }

  @Get('usage')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get current tenant user usage vs plan limit' })
  async getUsage(@TenantId() tenantId: string) {
    const summary = await this.usersService.getUsageSummary(tenantId);
    return DataResponseDto.success(summary, 'Usage fetched successfully');
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return DataResponseDto.success(user);
  }

  @Post()
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateUserDto) {
    const user = await this.usersService.create(tenantId, dto);
    return DataResponseDto.created(user, 'User created successfully');
  }

  @Post('invite')
  @Permissions('users:create')
  @ApiOperation({ summary: 'Invite a user — creates inactive account and sends a 48-hour magic link' })
  async invite(
    @TenantId() tenantId: string,
    @UserId() invitorId: string,
    @Body() dto: InviteUserDto,
  ) {
    const result = await this.usersService.invite(tenantId, invitorId, dto);
    return DataResponseDto.created(result, 'User invited successfully');
  }

  @Put(':id')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update a user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return DataResponseDto.success(user, 'User updated successfully');
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Soft delete a user' })
  async remove(@Param('id') id: string) {
    await this.usersService.softDelete(id);
    return DataResponseDto.success(null, 'User deleted successfully');
  }

  @Patch(':id/avatar')
  @ApiOperation({ summary: 'Update user avatar' })
  async updateAvatar(@Param('id') id: string, @Body('avatar_url') avatarUrl: string) {
    const user = await this.usersService.updateAvatar(id, avatarUrl);
    return DataResponseDto.success(user, 'Avatar updated successfully');
  }

  @Patch(':id/activate')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Activate a user' })
  async activate(@Param('id') id: string) {
    const user = await this.usersService.activate(id);
    return DataResponseDto.success(user, 'User activated successfully');
  }

  @Patch(':id/deactivate')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivate(@Param('id') id: string) {
    const user = await this.usersService.deactivate(id);
    return DataResponseDto.success(user, 'User deactivated successfully');
  }
}
