import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { WebformSubmissionsService, SubmitWebformDto, ProcessSubmissionDto } from './webform-submissions.service';

@ApiTags('Webform Submissions')
@Controller('webform-submissions')
export class WebformSubmissionsController {
  constructor(private readonly webformSubmissionsService: WebformSubmissionsService) {}

  @Post('public/:webformId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a public webform' })
  @ApiResponse({ status: 200, description: 'Webform submitted successfully' })
  async submitPublicWebform(
    @Param('webformId') webformId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    // For public submissions, we need to get tenant_id from webform
    // This would normally be handled differently in production
    const submitDto: SubmitWebformDto = {
      webform_id: webformId,
      form_data: body,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      referrer_url: req.headers['referer'],
    };

    // For now, we'll use a default tenant_id
    // In production, you'd look up the webform to get its tenant_id
    const submission = await this.webformSubmissionsService.submitWebform('default-tenant', submitDto);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Webform submitted successfully',
      data: submission,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a webform (authenticated)' })
  @Permissions('webforms:create')
  async submitWebform(
    @TenantId() tenantId: string,
    @Body() dto: SubmitWebformDto,
    @Request() req: any,
  ) {
    dto.ip_address = req.ip;
    dto.user_agent = req.headers['user-agent'];
    dto.referrer_url = req.headers['referer'];

    const submission = await this.webformSubmissionsService.submitWebform(tenantId, dto);

    return new DataResponseDto({
      statusCode: HttpStatus.CREATED,
      status: true,
      message: 'Webform submitted successfully',
      data: submission,
    });
  }

  @Put(':id/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a webform submission' })
  @Permissions('webforms:update')
  async processSubmission(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<ProcessSubmissionDto>,
  ) {
    const processDto: ProcessSubmissionDto = {
      submission_id: id,
      create_service_request: dto.create_service_request ?? true,
      auto_assign: dto.auto_assign ?? false,
    };

    const submission = await this.webformSubmissionsService.processSubmission(tenantId, processDto);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Submission processed successfully',
      data: submission,
    });
  }

  @Put(':id/spam')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark submission as spam' })
  @Permissions('webforms:update')
  async markAsSpam(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const submission = await this.webformSubmissionsService.markAsSpam(tenantId, id);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Submission marked as spam',
      data: submission,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all webform submissions' })
  @Permissions('webforms:read')
  async getSubmissions(
    @TenantId() tenantId: string,
    @Query('webformId') webformId?: string,
  ) {
    const submissions = await this.webformSubmissionsService.getSubmissions(tenantId, webformId);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Submissions retrieved successfully',
      data: submissions,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a webform submission by ID' })
  @Permissions('webforms:read')
  async getSubmissionById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const submission = await this.webformSubmissionsService.getSubmissionById(tenantId, id);

    return new DataResponseDto({
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Submission retrieved successfully',
      data: submission,
    });
  }
}