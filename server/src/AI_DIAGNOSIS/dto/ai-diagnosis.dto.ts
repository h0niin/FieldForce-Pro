import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AiDiagnoseDto {
  @ApiProperty({
    description: 'Plain text description of the customer issue',
    example: 'My air conditioner is making a loud buzzing noise and not blowing cold air.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
