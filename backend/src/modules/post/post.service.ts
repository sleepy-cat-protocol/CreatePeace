import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    return this.prisma.posts.create({
      data: {
        ...createPostDto,
        author_id: authorId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.posts.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.posts.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.findOne(id);

    if (post.author_id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.prisma.posts.update({
      where: { id },
      data: updatePostDto,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.findOne(id);

    if (post.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    return this.prisma.posts.delete({
      where: { id },
    });
  }

  async findByAuthor(authorId: string) {
    return this.prisma.posts.findMany({
      where: { author_id: authorId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
