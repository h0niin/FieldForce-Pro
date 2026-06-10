import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';
import { CreateTerritoryDto } from './dto/territories_create.dto';
import { UpdateTerritoryDto } from './dto/territories_update.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
@ApiTags('Territories')
@ApiBearerAuth()
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a territory' })
  async create(@Request() req: any, @Body() createDto: CreateTerritoryDto) {
    const data = await this.territoriesService.create(req.user.tenant_id, createDto);
    return DataResponseDto.created(data, 'Territory created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all territories (paginated)' })
  async findAll(@Request() req: any, @Query() pageOptionsDto: PageOptionsDto) {
    const pageNum = pageOptionsDto.page || 1;
    const limitNum = pageOptionsDto.take || 10;
    const search = pageOptionsDto.search || '';
    // Need to pass search to service if we want search filtering
    const result = await this.territoriesService.findAll(req.user.tenant_id, pageNum, limitNum, search);
    return DataResponseDto.success(result.data, 'Territories retrieved successfully', result.meta as any);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all territories (non-paginated)' })
  async findAllNonPaginated(@Request() req: any) {
    const data = await this.territoriesService.findAllNonPaginated(req.user.tenant_id);
    return DataResponseDto.success(data, 'Territories retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get territory by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    const data = await this.territoriesService.findOne(id, req.user.tenant_id);
    return DataResponseDto.success(data, 'Territory retrieved successfully');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update territory' })
  async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateTerritoryDto) {
    const data = await this.territoriesService.update(id, req.user.tenant_id, updateDto);
    return DataResponseDto.success(data, 'Territory updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete territory' })
  async remove(@Request() req: any, @Param('id') id: string) {
    await this.territoriesService.remove(id, req.user.tenant_id);
    return DataResponseDto.success(null, 'Territory deleted successfully');
  }
}
