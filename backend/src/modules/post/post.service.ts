import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    const { tags, ...postData } = createPostDto;
    
    return this.prisma.posts.create({
      data: {
        ...postData,
        author_id: authorId,
        tags: tags ? {
          create: await this.createTagConnections(tags)
        } : undefined,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async findOne(id: string) {
    console.log('start findOne service', id);
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
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post with id ' + id + ' not found');
    }
    console.log(post.id, post.title, post.users.name, post.tags);
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const post = await this.findOne(id);

    if (post.author_id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const { tags, ...postData } = updatePostDto;

    return this.prisma.posts.update({
      where: { id },
      data: {
        ...postData,
        tags: tags !== undefined ? {
          deleteMany: {},
          create: await this.createTagConnections(tags)
        } : undefined,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private async createTagConnections(tagNames: string[]) {
    const connections: { tag_id: string }[] = [];
    
    for (const tagName of tagNames) {
      // Find or create tag
      const tag = await this.prisma.tags.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });
      
      connections.push({
        tag_id: tag.id
      });
    }
    
    return connections;
  }

  async findByTag(tagName: string) {
    return this.prisma.posts.findMany({
      where: {
        tags: {
          some: {
            tag: {
              name: tagName
            }
          }
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getAllTags() {
    return this.prisma.tags.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}
