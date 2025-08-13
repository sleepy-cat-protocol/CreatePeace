import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { SearchService } from './search.service';



@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    @UseGuards(JwtAuthGuard)
    async search(@Query('q') query: string) {
        if (!query || query.trim().length === 0) {
            return {
              tags: [],
              posts: [],
              users: []
            };
          }
      
          const results = await this.searchService.searchAll(query.trim());
          return results;
    }

    @Get('tags')
    @UseGuards(JwtAuthGuard)
    searchTags(@Query('q') query: string) {
      return this.searchService.searchTags(query);
    }
  
    @Get('posts')
    @UseGuards(JwtAuthGuard)
    searchPosts(@Query('q') query: string) {
      return this.searchService.searchPosts(query);
    }
  
    @Get('users')
    @UseGuards(JwtAuthGuard)
    searchUsers(@Query('q') query: string) {
      return this.searchService.searchUsers(query);
    }
}
