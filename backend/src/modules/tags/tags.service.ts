import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum TagPostsSortBy {
  DATE = 'date',
  LIKES = 'likes',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTagDetail(
    tagId: string,
    page: number = 1,
    limit: number = 20,
    sortBy: TagPostsSortBy = TagPostsSortBy.DATE,
    sortOrder: SortOrder = SortOrder.DESC,
  ) {
    const skip = (page - 1) * limit;

    // Get tag info with subscriber count
    const tag = await this.prisma.tags.findUnique({
      where: { id: tagId },
      include: {
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    // Build order by clause
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Get posts with this tag
    const posts = await this.prisma.posts.findMany({
      where: {
        AND: [
          {
            status: 'PUBLISHED' as any,
          },
          {
            tags: {
              some: {
                tag_id: tagId,
              },
            },
          },
        ],
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
        tags: {
          include: {
            tag: true,
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
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await this.prisma.posts.count({
      where: {
        AND: [
          {
            status: 'PUBLISHED' as any,
          },
          {
            tags: {
              some: {
                tag_id: tagId,
              },
            },
          },
        ],
      },
    });

    return {
      tag: {
        id: tag.id,
        name: tag.name,
        created_at: tag.created_at,
        postsCount: tag._count.posts,
        subscribersCount: tag._count.subscribers,
      },
      posts,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async getTagByName(name: string) {
    return this.prisma.tags.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: {
            posts: true,
            subscribers: true,
          },
        },
      },
    });
  }

  private buildOrderBy(sortBy: TagPostsSortBy, sortOrder: SortOrder) {
    switch (sortBy) {
      case TagPostsSortBy.DATE:
        return { published_at: sortOrder as any };
      case TagPostsSortBy.LIKES:
        return { likes: { _count: sortOrder as any } };
      case TagPostsSortBy.TITLE:
        return { title: sortOrder as any };
      default:
        return { published_at: 'desc' };
    }
  }
}
