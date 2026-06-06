import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentTypeEnum, DocumentCategoryEnum } from '../../../shared/enums/workflow.enum';

export class CreateWorkflowApproverDto {
  @ApiProperty({ description: 'Approver user ID' })
  @IsUUID()
  approver_id: string;

  @ApiProperty({ description: 'Order number in approval sequence', example: 1 })
  @IsInt()
  @Min(1)
  order_no: number;

  @ApiPropertyOptional({ description: 'Approval authority level (1-10)', example: 5 })
  @IsInt()
  @IsOptional()
  approval_authority?: number;

  @ApiPropertyOptional({ description: 'Minimum amount threshold', example: 0 })
  @IsNumber()
  @IsOptional()
  amount_threshold_min?: number;

  @ApiPropertyOptional({ description: 'Maximum amount threshold', example: 50000 })
  @IsNumber()
  @IsOptional()
  amount_threshold_max?: number;

  @ApiPropertyOptional({ description: 'Budget threshold', example: 100000 })
  @IsNumber()
  @IsOptional()
  budget_threshold?: number;

  @ApiPropertyOptional({ description: 'Whether this approver is required', default: true })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Notes about this approver step' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateWorkflowTemplateDto {
  @ApiProperty({ description: 'Workflow template name', example: 'Invoice Approval' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Document type this workflow applies to', enum: DocumentTypeEnum })
  @IsEnum(DocumentTypeEnum)
  @IsOptional()
  document_type?: DocumentTypeEnum;

  @ApiProperty({ description: 'Document category', enum: DocumentCategoryEnum })
  @IsEnum(DocumentCategoryEnum)
  document_category: DocumentCategoryEnum;

  @ApiPropertyOptional({ description: 'List of approvers in sequence', type: [CreateWorkflowApproverDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowApproverDto)
  @IsOptional()
  approvers?: CreateWorkflowApproverDto[];
}

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional({ description: 'Workflow template name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Document type', enum: DocumentTypeEnum })
  @IsEnum(DocumentTypeEnum)
  @IsOptional()
  document_type?: DocumentTypeEnum;

  @ApiPropertyOptional({ description: 'Document category', enum: DocumentCategoryEnum })
  @IsEnum(DocumentCategoryEnum)
  @IsOptional()
  document_category?: DocumentCategoryEnum;

  @ApiPropertyOptional({ description: 'List of approvers in sequence', type: [CreateWorkflowApproverDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowApproverDto)
  @IsOptional()
  approvers?: CreateWorkflowApproverDto[];
}
