import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { TagsService, TagPostsSortBy, SortOrder } from './tags.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get(':id')
  async getTagDetail(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('sortBy') sortBy: TagPostsSortBy = TagPostsSortBy.DATE,
    @Query('sortOrder') sortOrder: SortOrder = SortOrder.DESC,
  ) {
    return this.tagsService.getTagDetail(
      id,
      parseInt(page),
      parseInt(limit),
      sortBy,
      sortOrder,
    );
  }

  @Get('name/:name')
  async getTagByName(@Param('name') name: string) {
    return this.tagsService.getTagByName(name);
  }
}
