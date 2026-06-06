import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/reviews_create.dto';
import { UpdateReviewDto } from './dto/reviews_update.dto';
import { PageOptionsDto } from '../shared/dto/page-options.dto';
import { DataResponseDto } from '../shared/dto/data-response.dto';
import { TenantId } from '../shared/decorator/tenant.decorator';
import { Permissions } from '../shared/decorator/permission.decorator';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get()
  @Permissions('reviews:read')
  @ApiOperation({ summary: 'Get all reviews (paginated)' })
  async findAll(@TenantId() tenantId: string, @Query() pageOptionsDto: PageOptionsDto) {
    const result = await this.reviewsService.findAllPaginated(tenantId, pageOptionsDto);
    return DataResponseDto.success(result.data, 'Reviews fetched successfully', {
      ...result.meta,
    } as unknown as Record<string, unknown>);
  }

  @Get('work-order/:workOrderId')
  @Permissions('reviews:read')
  @ApiOperation({ summary: 'Get reviews by work order ID' })
  async findByWorkOrderId(
    @Param('workOrderId') workOrderId: string,
    @TenantId() tenantId: string,
  ) {
    const reviews = await this.reviewsService.findByWorkOrderId(workOrderId, tenantId);
    return DataResponseDto.success(reviews, 'Work order reviews fetched successfully');
  }

  @Get(':id')
  @Permissions('reviews:read')
  @ApiOperation({ summary: 'Get review by ID' })
  async findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    const review = await this.reviewsService.findById(id, tenantId);
    return DataResponseDto.success(review);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  async create(@TenantId() tenantId: string, @Body() dto: CreateReviewDto) {
    const review = await this.reviewsService.create(tenantId, dto);
    return DataResponseDto.created(review, 'Review created successfully');
  }

  @Put(':id')
  @Permissions('reviews:update')
  @ApiOperation({ summary: 'Update a review' })
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.reviewsService.update(id, tenantId, dto);
    return DataResponseDto.success(review, 'Review updated successfully');
  }

  @Delete(':id')
  @Permissions('reviews:delete')
  @ApiOperation({ summary: 'Delete a review (soft delete)' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    await this.reviewsService.delete(id, tenantId);
    return DataResponseDto.success(null, 'Review deleted successfully');
  }
}
