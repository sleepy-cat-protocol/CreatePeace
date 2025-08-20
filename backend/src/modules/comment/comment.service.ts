import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(postId: string, createCommentDto: CreateCommentDto, userId: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If parent_id is provided, check if parent comment exists
    if (createCommentDto.parent_id) {
      const parentComment = await this.prisma.comments.findUnique({
        where: { id: createCommentDto.parent_id },
        select: { id: true, post_id: true },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.post_id !== postId) {
        throw new ForbiddenException('Parent comment does not belong to this post');
      }
    }

    return this.prisma.comments.create({
      data: {
        content: createCommentDto.content,
        post_id: postId,
        user_id: userId,
        parent_id: createCommentDto.parent_id || null,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });
  }

  async findByPost(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const comments = await this.prisma.comments.findMany({
      where: {
        post_id: postId,
        parent_id: null,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
          },
        },
        replies: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar_url: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            created_at: 'asc',
          },
          take: 5, // Limit replies shown initially
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalComments = await this.prisma.comments.count({
      where: {
        post_id: postId,
        parent_id: null,
      },
    });

    return {
      comments,
      totalComments,
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page,
    };
  }

  async findReplies(commentId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const replies = await this.prisma.comments.findMany({
      where: {
        parent_id: commentId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
      skip,
      take: limit,
    });

    const totalReplies = await this.prisma.comments.count({
      where: {
        parent_id: commentId,
      },
    });

    return {
      replies,
      totalReplies,
      totalPages: Math.ceil(totalReplies / limit),
      currentPage: page,
    };
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comments.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    return this.prisma.comments.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comments.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    return this.prisma.comments.delete({
      where: { id },
    });
  }

  async likeComment(commentId: string, userId: string) {
    // Check if comment exists
    const comment = await this.prisma.comments.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.comment_likes.findUnique({
      where: {
        user_id_comment_id: {
          user_id: userId,
          comment_id: commentId,
        },
      },
    });

    if (existingLike) {
      return { message: 'Comment already liked', isLiked: true };
    }

    // Create like
    await this.prisma.comment_likes.create({
      data: {
        user_id: userId,
        comment_id: commentId,
      },
    });

    return { message: 'Comment liked successfully', isLiked: true };
  }

  async unlikeComment(commentId: string, userId: string) {
    // Check if like exists
    const existingLike = await this.prisma.comment_likes.findUnique({
      where: {
        user_id_comment_id: {
          user_id: userId,
          comment_id: commentId,
        },
      },
    });

    if (!existingLike) {
      return { message: 'Comment not liked', isLiked: false };
    }

    // Remove like
    await this.prisma.comment_likes.delete({
      where: {
        user_id_comment_id: {
          user_id: userId,
          comment_id: commentId,
        },
      },
    });

    return { message: 'Comment unliked successfully', isLiked: false };
  }
}
