import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { LikePostDto } from './dto/like-post.dto';
import { CollectPostDto } from './dto/collect-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    console.log('start findOne controller', id);
    const post = await this.postService.findOne(id);
    console.log('end findOne controller', id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postService.create(createPostDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }


  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @Request() req) {
    return this.postService.update(id, updatePostDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.postService.remove(id, req.user.id);
  }

  @Get('author/:authorId')
  findByAuthor(@Param('authorId') authorId: string) {
    return this.postService.findByAuthor(authorId);
  }

  @Get('by-tag/:tagName')
  findByTag(@Param('tagName') tagName: string) {
    return this.postService.findByTag(tagName);
  }

  @Get('tags/all')
  getAllTags() {
    return this.postService.getAllTags();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likePost(@Param('id') postId: string, @Request() req) {
    return this.postService.likePost(postId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlikePost(@Param('id') postId: string, @Request() req) {
    return this.postService.unlikePost(postId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/collect')
  async collectPost(@Param('id') postId: string, @Request() req) {
    return this.postService.collectPost(postId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/collect')
  async uncollectPost(@Param('id') postId: string, @Request() req) {
    return this.postService.uncollectPost(postId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  async getPostStatus(@Param('id') postId: string, @Request() req) {
    return this.postService.getPostStatus(postId, req.user.id);
  }

  @Post(':id/view')
  async incrementViewCount(@Param('id') postId: string, @Request() req) {
    // Get user ID if authenticated, null if not (this endpoint is public)
    const userId = req.user?.id || null;
    
    // Get IP address for tracking anonymous users
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || null;
    
    return this.postService.incrementViewCount(postId, userId, ipAddress);
  }
}
