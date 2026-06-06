import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatbotSessionsService } from './chatbot_sessions.service';
import { SendMessageDto, QuerySessionsDto } from './dto/chatbot_sessions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../shared/guards/permission.guard';
import { Permissions } from '../shared/decorator/permission.decorator';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { UserId } from '../shared/decorator/user.decorator';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';

@ApiTags('Chatbot')
@Controller('chatbot')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class ChatbotSessionsController {
  constructor(private readonly chatbotService: ChatbotSessionsService) {}

  @Post('message')
  @Permissions('chatbot.use')
  @ApiOperation({ summary: 'Send a message to the AI chatbot' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully' })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.chatbotService.sendMessage(dto, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Chat message processed',
      data: result,
    };
  }

  @Get('sessions')
  @Permissions('chatbot.use')
  @ApiOperation({ summary: 'Get user chat sessions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Sessions retrieved' })
  async getSessions(
    @Query() dto: QuerySessionsDto,
    @Query() pageOptions: PageOptionsDto,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.chatbotService.getSessions(dto, pageOptions, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Chat sessions retrieved',
      data: result.data,
      meta: result.meta as unknown as Record<string, unknown>,
    };
  }

  @Get('sessions/:id')
  @Permissions('chatbot.use')
  @ApiOperation({ summary: 'Get chat session with full history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session retrieved' })
  async getSession(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.chatbotService.getSessionById(id, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Chat session retrieved',
      data: result,
    };
  }

  @Post('sessions/:id/close')
  @Permissions('chatbot.use')
  @ApiOperation({ summary: 'Close a chat session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session closed' })
  async closeSession(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    const result = await this.chatbotService.closeSession(id, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Chat session closed',
      data: result,
    };
  }

  @Delete('sessions/:id')
  @Permissions('chatbot.use')
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Session deleted' })
  async deleteSession(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string,
  ): Promise<DataResponseDto<any>> {
    await this.chatbotService.deleteSession(id, tenantId, userId);
    return {
      statusCode: HttpStatus.OK,
      status: true,
      message: 'Chat session deleted',
      data: null,
    };
  }
}
