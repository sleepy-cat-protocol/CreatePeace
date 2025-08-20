import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED',
}

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    const { tags, scheduled_for, ...postData } = createPostDto;
    
    // Generate slug from title
    const slug = this.generateSlug(createPostDto.title);
    
    // Handle publishing logic (simplified - no scheduling for now)
    let published_at: Date | null = null;
    let status = createPostDto.status || PostStatus.DRAFT;
    
    // If user tries to schedule, just save as draft for now
    if (status === PostStatus.SCHEDULED) {
      status = PostStatus.DRAFT;
    }
    
    if (status === PostStatus.PUBLISHED) {
      published_at = new Date();
    }

    return this.prisma.posts.create({
      data: {
        ...postData,
        status: status as PostStatus,
        slug,
        author_id: authorId,
        published_at,
        // Keep scheduled_for field but don't use it yet
        scheduled_for: null,
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
            username: true,
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
            username: true,
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
        _count: {
          select: {
            likes: true,
            collections: true,
            comments: true,
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

    const { tags, scheduled_for, ...postData } = updatePostDto;

    // Handle publishing logic (simplified - no scheduling for now)
    let published_at = (post as any).published_at;
    let status = (updatePostDto.status as any) || (post as any).status;
    
    // If user tries to schedule, just save as draft for now
    if (status === 'SCHEDULED') {
      status = 'DRAFT';
    }
    
    if (status === 'PUBLISHED' && !(post as any).published_at) {
      published_at = new Date();
    } else if (status === 'DRAFT' && (post as any).published_at) {
      // If changing from published to draft, remove published_at
      published_at = null;
    }

    // Update slug if title changed
    let slug = (post as any).slug;
    if (updatePostDto.title && updatePostDto.title !== post.title) {
      slug = this.generateSlug(updatePostDto.title);
    }

    return this.prisma.posts.update({
      where: { id },
      data: {
        ...postData,
        status,
        slug,
        published_at,
        // Keep scheduled_for field but don't use it yet
        scheduled_for: null,
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
            username: true,
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

  async likePost(postId: string, userId: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.post_likes.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    if (existingLike) {
      return { message: 'Post already liked', isLiked: true };
    }

    // Create like
    await this.prisma.post_likes.create({
      data: {
        user_id: userId,
        post_id: postId,
      },
    });

    return { message: 'Post liked successfully', isLiked: true };
  }

  async unlikePost(postId: string, userId: string) {
    // Check if like exists
    const existingLike = await this.prisma.post_likes.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    if (!existingLike) {
      return { message: 'Post not liked', isLiked: false };
    }

    // Remove like
    await this.prisma.post_likes.delete({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    return { message: 'Post unliked successfully', isLiked: false };
  }

  async collectPost(postId: string, userId: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already collected
    const existingCollection = await this.prisma.post_collections.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    if (existingCollection) {
      return { message: 'Post already collected', isCollected: true };
    }

    // Create collection
    await this.prisma.post_collections.create({
      data: {
        user_id: userId,
        post_id: postId,
      },
    });

    return { message: 'Post collected successfully', isCollected: true };
  }

  async uncollectPost(postId: string, userId: string) {
    // Check if collection exists
    const existingCollection = await this.prisma.post_collections.findUnique({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    if (!existingCollection) {
      return { message: 'Post not collected', isCollected: false };
    }

    // Remove collection
    await this.prisma.post_collections.delete({
      where: {
        user_id_post_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });

    return { message: 'Post uncollected successfully', isCollected: false };
  }

  async getPostStatus(postId: string, userId: string) {
    const [like, collection] = await Promise.all([
      this.prisma.post_likes.findUnique({
        where: {
          user_id_post_id: {
            user_id: userId,
            post_id: postId,
          },
        },
      }),
      this.prisma.post_collections.findUnique({
        where: {
          user_id_post_id: {
            user_id: userId,
            post_id: postId,
          },
        },
      }),
    ]);

    return {
      isLiked: !!like,
      isCollected: !!collection,
    };
  }

  async incrementViewCount(postId: string, userId?: string, ipAddress?: string) {
    // Check if post exists
    const post = await this.prisma.posts.findUnique({
      where: { id: postId },
      select: { id: true, author_id: true, view_count: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Don't count views from the post author
    if (userId && post.author_id === userId) {
      return { message: 'Author view not counted', view_count: post.view_count };
    }

    // Check if this user/IP has already viewed this post recently
    const orConditions: Array<{ user_id?: string; ip_address?: string }> = [];
    if (userId) orConditions.push({ user_id: userId });
    if (ipAddress) orConditions.push({ ip_address: ipAddress });

    const existingView = await this.prisma.post_views.findFirst({
      where: {
        post_id: postId,
        ...(orConditions.length > 0 && { OR: orConditions }),
        // Only count views older than 1 hour as new views
        viewed_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
    });

    if (existingView) {
      return { 
        message: 'View already counted recently', 
        view_count: post.view_count 
      };
    }

    // Record the view and increment counter in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create view record
      await tx.post_views.create({
        data: {
          post_id: postId,
          user_id: userId || null,
          ip_address: ipAddress || null,
        },
      });

      // Increment view count
      const updatedPost = await tx.posts.update({
        where: { id: postId },
        data: {
          view_count: {
            increment: 1,
          },
        },
        select: {
          view_count: true,
        },
      });

      return updatedPost;
    });

    return { 
      message: 'View counted successfully', 
      view_count: result.view_count 
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
      + '-' + Date.now(); // Add timestamp to ensure uniqueness
  }
}
