import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class WorkOrderNotesQueryDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter notes by work order ID',
    type: String,
  })
  @IsUUID()
  @IsOptional()
  readonly work_order_id?: string;
}
