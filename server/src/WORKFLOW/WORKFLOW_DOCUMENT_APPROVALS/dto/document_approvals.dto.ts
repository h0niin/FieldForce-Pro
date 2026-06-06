import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { DocumentTypeEnum, ApprovalActionEnum } from '../../../shared/enums/workflow.enum';
import { PageOptionsDto } from '../../../shared/dto/page-options.dto';

export class CreateDocumentApprovalsDto {
  @ApiProperty({ description: 'Document ID to create approvals for' })
  @IsUUID()
  document_id: string;

  @ApiProperty({ description: 'Document type', enum: DocumentTypeEnum })
  @IsEnum(DocumentTypeEnum)
  document_type: DocumentTypeEnum;

  @ApiProperty({ description: 'Workflow template ID to use' })
  @IsUUID()
  workflow_id: string;

  @ApiPropertyOptional({ description: 'Document amount for threshold filtering', example: 25000 })
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Due date for approval completion' })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({
    description: 'Specific approver user IDs. When provided, these users are used as approvers instead of the workflow template approvers.',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  approver_ids?: string[];
}

export class ProcessApprovalDto {
  @ApiProperty({ description: 'Action to take', enum: ApprovalActionEnum })
  @IsEnum(ApprovalActionEnum)
  action: ApprovalActionEnum;

  @ApiPropertyOptional({ description: 'Comments for this action' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'IP address of the actor' })
  @IsString()
  @IsOptional()
  ip_address?: string;
}

export class BulkProcessApprovalDto {
  @ApiProperty({ description: 'List of approval IDs to process', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  approval_ids: string[];

  @ApiProperty({ description: 'Action to take', enum: ApprovalActionEnum })
  @IsEnum(ApprovalActionEnum)
  action: ApprovalActionEnum;

  @ApiPropertyOptional({ description: 'Comments for this action' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'IP address of the actor' })
  @IsString()
  @IsOptional()
  ip_address?: string;
}

export class DelegateApprovalDto {
  @ApiProperty({ description: 'User ID to delegate to' })
  @IsUUID()
  delegate_to_id: string;

  @ApiPropertyOptional({ description: 'Reason for delegation' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'IP address of the actor' })
  @IsString()
  @IsOptional()
  ip_address?: string;
}

export class QueryApprovalsDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Filter by document type', enum: DocumentTypeEnum })
  @IsEnum(DocumentTypeEnum)
  @IsOptional()
  document_type?: DocumentTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by approver ID' })
  @IsUUID()
  @IsOptional()
  approver_id?: string;

  @ApiPropertyOptional({ description: 'Filter by document ID' })
  @IsUUID()
  @IsOptional()
  document_id?: string;
}
