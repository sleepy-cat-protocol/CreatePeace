import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('postId') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.commentService.create(postId, createCommentDto, req.user.id);
  }

  @Get()
  async findByPost(
    @Param('postId') postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.commentService.findByPost(postId, pageNum, limitNum);
  }
}

@Controller('comments')
export class CommentManagementController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':id/replies')
  async getReplies(
    @Param('id') commentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.commentService.findReplies(commentId, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: any,
  ) {
    return this.commentService.update(id, updateCommentDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.commentService.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likeComment(@Param('id') commentId: string, @Request() req: any) {
    return this.commentService.likeComment(commentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlikeComment(@Param('id') commentId: string, @Request() req: any) {
    return this.commentService.unlikeComment(commentId, req.user.id);
  }
}
