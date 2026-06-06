import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    example: ['role-uuid-1', 'role-uuid-2'],
    description: 'Array of role IDs to assign to the user',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  role_ids: string[];
}
