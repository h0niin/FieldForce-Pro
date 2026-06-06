import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @ApiProperty({
    description: 'New invoice status',
    enum: ['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void'],
    example: 'sent',
  })
  @IsEnum(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'void'])
  status: string;
}
