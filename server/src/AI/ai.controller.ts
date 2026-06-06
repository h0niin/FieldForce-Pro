import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { Public } from '../shared/decorator/public.decorator';
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({ description: 'The user message text' })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Conversation history so Gemini has multi-turn context',
    required: false,
    type: 'array',
  })
  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];

  @ApiProperty({
    description:
      'Pass true for logged-in users to activate the FSM Expert persona. ' +
      'False (default) activates the Sales AI persona for pre-login visitors.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAuthenticated?: boolean;
}

@ApiTags('Public AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Post('chat')
  @ApiOperation({
    summary: 'Chat with FieldForce AI',
    description:
      'Sends a message to the AI chatbot. Pass isAuthenticated=true to activate the ' +
      'in-app FSM Expert persona; omit or set false for the pre-login Sales AI persona.',
  })
  async chat(@Body() body: ChatRequestDto) {
    const history = body.history ?? [];
    const isAuthenticated = body.isAuthenticated ?? false;

    const reply = await this.aiService.generateChatResponse(
      history,
      body.message,
      isAuthenticated,
    );

    return { reply };
  }
}
