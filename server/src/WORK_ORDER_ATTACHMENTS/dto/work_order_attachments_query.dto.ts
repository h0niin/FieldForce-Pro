import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../shared/dto/page-options.dto';

export class WorkOrderAttachmentQueryDto extends PageOptionsDto {
    @ApiPropertyOptional({ description: 'Filter by Work Order UUID' })
    @IsOptional()
    @IsUUID()
    readonly work_order_id?: string;
}
