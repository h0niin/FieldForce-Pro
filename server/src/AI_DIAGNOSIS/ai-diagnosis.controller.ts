import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../shared/decorator/public.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { AiDiagnosisService, DiagnosisResponse } from './ai-diagnosis.service';
import { AiDiagnoseDto } from './dto/ai-diagnosis.dto';

@ApiTags('AI Diagnosis')
@Controller('ai')
export class AiDiagnosisController {
  constructor(private readonly aiDiagnosisService: AiDiagnosisService) {}

  @Public()
  @Post('diagnose')
  @ApiOperation({
    summary: 'Diagnose a plain-text customer issue description into structured technical fields',
  })
  async diagnose(@Body() dto: AiDiagnoseDto): Promise<DataResponseDto<DiagnosisResponse>> {
    const diagnosis = await this.aiDiagnosisService.diagnoseIssue(dto.description);
    return DataResponseDto.success(diagnosis, 'Issue diagnosed successfully');
  }
}
