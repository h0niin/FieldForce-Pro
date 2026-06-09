import { Controller, Get, Post, Put, Body, Param, Delete, UseGuards, Query, Req, Logger, InternalServerErrorException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { QueryNotesDto } from './dto/query-notes.dto';
import { TenantGuard } from '../shared/guards/tenant.guard';
import { TenantId } from '../shared/decorator/tenant.decorator';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller('notes')
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  async create(
    @Req() req: any,
    @Body() createNoteDto: CreateNoteDto
  ) {
    try {
      const userId = req.user?.id || req.user?.userId || req.user?.sub;
      const tenantId = req.user?.tenant_id || req.user?.tenantId;

      if (!userId || !tenantId) {
        throw new UnauthorizedException('Missing user or tenant context');
      }

      return await this.notesService.create(tenantId, userId, createNoteDto);
    } catch (error: any) {
      this.logger.error('Save failed:', error);
      throw new InternalServerErrorException('Failed to create note');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get notes' })
  findAllPaginated(
    @TenantId() tenantId: string,
    @Query() query: QueryNotesDto
  ) {
    return this.notesService.findAllPaginated(tenantId, query);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a note' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('content') content: string
  ) {
    if (!content) {
      throw new BadRequestException('Content is required');
    }
    return this.notesService.update(id, tenantId, content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a note' })
  delete(
    @TenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.notesService.delete(id, tenantId);
  }
}
