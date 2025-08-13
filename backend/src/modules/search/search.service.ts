import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
    constructor(private readonly prisma: PrismaService) {}

    async searchAll(query: string) {
        const [tags, posts, users] = await Promise.all([
            this.searchTags(query),
            this.searchPosts(query),
            this.searchUsers(query)
        ]);

        return { tags, posts, users };
    }

    async searchTags(query: string) {
        return this.prisma.tags.findMany({
            where: {
                name:{
                    contains: query,
                    mode: 'insensitive'
                }
            },
            include: {
                posts: {
                  include: {
                    post: {
                      select: {
                        id: true,
                        title: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                name: 'asc'
              }
        });
    }

    async searchPosts(query: string) {
        return this.prisma.posts.findMany({
            where: {
                title: {
                    contains: query,
                }
            },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: {
              created_at: 'desc'
            }
        });
    }

    async searchUsers(query: string) {
        return this.prisma.users.findMany({
            where: {
                name: {
                    contains: query,
                }
            },
            select: {
              id: true,
              name: true,
              email: true,
              created_at: true,
              posts: {
                select: {
                  id: true,
                  title: true,
                  created_at: true
                },
                orderBy: {
                  created_at: 'desc'
                },
                take: 3 // Show latest 3 posts per user
              }
            },
            orderBy: {
              name: 'asc'
            }
        });
    }
}
