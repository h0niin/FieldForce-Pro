import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignSingleRoleDto {
  @ApiProperty({
    example: 'role-uuid-1',
    description: 'Role ID to assign to the user',
  })
  @IsUUID('4')
  @IsNotEmpty()
  role_id: string;
}
