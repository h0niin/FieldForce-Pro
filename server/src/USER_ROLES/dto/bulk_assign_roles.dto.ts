import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UserRoleAssignment {
  @ApiProperty({ example: 'user-uuid-1' })
  user_id: string;

  @ApiProperty({
    example: ['role-uuid-1', 'role-uuid-2'],
    type: [String],
  })
  role_ids: string[];
}

export class BulkAssignRolesDto {
  @ApiProperty({
    type: [UserRoleAssignment],
    description: 'Array of user-role assignments',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleAssignment)
  assignments: UserRoleAssignment[];
}
