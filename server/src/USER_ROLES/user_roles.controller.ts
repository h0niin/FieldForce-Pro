import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRolesService } from './user_roles.service';
import { AssignRolesDto } from './dto/assign_roles.dto';
import { AssignSingleRoleDto } from './dto/assign_single_role.dto';
import { BulkAssignRolesDto } from './dto/bulk_assign_roles.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('User Roles')
@ApiBearerAuth()
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get('user/:userId')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all roles assigned to a user' })
  async getUserRoles(@Param('userId') userId: string) {
    const roles = await this.userRolesService.getUserRoles(userId);
    return DataResponseDto.success(roles, 'User roles fetched successfully');
  }

  @Post('user/:userId/role')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Assign a single role to a user' })
  async assignSingleRole(
    @Param('userId') userId: string,
    @Body() dto: AssignSingleRoleDto,
  ) {
    const userRole = await this.userRolesService.assignRole(userId, dto.role_id);
    return DataResponseDto.created(userRole, 'Role assigned successfully');
  }

  @Post('user/:userId/roles')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Assign multiple roles to a user' })
  async assignRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignRolesDto,
  ) {
    const userRoles = await this.userRolesService.assignRoles(userId, dto.role_ids);
    return DataResponseDto.created(userRoles, 'Roles assigned successfully');
  }

  @Post('bulk-assign')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Bulk assign roles to multiple users' })
  async bulkAssignRoles(@Body() dto: BulkAssignRolesDto) {
    const results = [];
    for (const assignment of dto.assignments) {
      const userRoles = await this.userRolesService.assignRoles(
        assignment.user_id,
        assignment.role_ids,
      );
      results.push({
        user_id: assignment.user_id,
        assigned_roles: userRoles,
      });
    }
    return DataResponseDto.created(results, 'Bulk role assignment completed successfully');
  }

  @Delete('user/:userId/role/:roleId')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Remove a role from a user' })
  async unassignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    await this.userRolesService.unassignRole(userId, roleId);
    return DataResponseDto.success(null, 'Role unassigned successfully');
  }

  @Delete('user/:userId/roles')
  @Permissions('users:update')
  @ApiOperation({ summary: 'Remove all roles from a user' })
  async unassignAllRoles(@Param('userId') userId: string) {
    await this.userRolesService.unassignAllRoles(userId);
    return DataResponseDto.success(null, 'All roles unassigned successfully');
  }
}
