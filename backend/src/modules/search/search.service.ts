import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdvancedSearchDto, SearchType, SortBy, SortOrder } from './dto/advanced-search.dto';

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

    async advancedSearch(params: AdvancedSearchDto) {
        const { q, type, dateFrom, dateTo, sortBy, sortOrder, page, limit } = params;
        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '20', 10);
        const skip = (pageNum - 1) * limitNum;

        console.log('start advanced search', params);

        // Build date range filter
        const dateFilter = this.buildDateFilter(dateFrom, dateTo);

        let results: any = {
            tags: [],
            posts: [],
            users: [],
            totalCount: 0,
            currentPage: pageNum,
            totalPages: 0,
        };

        console.log('dateFilter', dateFilter);

        switch (type) {
            case SearchType.TAGS:
                const tagsResult = await this.advancedSearchTags(q, dateFilter, sortBy, sortOrder, skip, limitNum);
                results = {
                    tags: tagsResult.items,
                    posts: [],
                    users: [],
                    totalCount: tagsResult.totalCount,
                    currentPage: tagsResult.currentPage,
                    totalPages: tagsResult.totalPages,
                };
                break;
            case SearchType.POSTS:
                const postsResult = await this.advancedSearchPosts(q, dateFilter, sortBy, sortOrder, skip, limitNum);
                results = {
                    tags: [],
                    posts: postsResult.items,
                    users: [],
                    totalCount: postsResult.totalCount,
                    currentPage: postsResult.currentPage,
                    totalPages: postsResult.totalPages,
                };
                break;
            case SearchType.USERS:
                const usersResult = await this.advancedSearchUsers(q, dateFilter, sortBy, sortOrder, skip, limitNum);
                results = {
                    tags: [],
                    posts: [],
                    users: usersResult.items,
                    totalCount: usersResult.totalCount,
                    currentPage: usersResult.currentPage,
                    totalPages: usersResult.totalPages,
                };
                break;
            default: // SearchType.ALL
                const [tags, posts, users] = await Promise.all([
                    this.advancedSearchTags(q, dateFilter, sortBy, sortOrder, 0, 10),
                    this.advancedSearchPosts(q, dateFilter, sortBy, sortOrder, 0, 10),
                    this.advancedSearchUsers(q, dateFilter, sortBy, sortOrder, 0, 10),
                ]);

                results = {
                    tags: tags.items,
                    posts: posts.items,
                    users: users.items,
                    totalCount: tags.totalCount + posts.totalCount + users.totalCount,
                    currentPage: 1,
                    totalPages: 1,
                };
                break;
        }

        console.log('results', results);

        return results;
    }

    private buildDateFilter(dateFrom?: string, dateTo?: string) {
        if (!dateFrom && !dateTo) return {};

        const filter: any = {};
        if (dateFrom) filter.gte = new Date(dateFrom);
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999); // End of day
            filter.lte = endDate;
        }

        return Object.keys(filter).length > 0 ? filter : {};
    }

    private async advancedSearchTags(
        query: string,
        dateFilter: any,
        sortBy: SortBy = SortBy.RELEVANCE,
        sortOrder: SortOrder = SortOrder.DESC,
        skip: number,
        limit: number,
    ) {
        const orderBy = this.buildTagOrderBy(sortBy, sortOrder);

        const where = {
            name: {
                contains: query,
                mode: 'insensitive' as const,
            },
        };

        const [items, totalCount] = await Promise.all([
            this.prisma.tags.findMany({
                where,
                include: {
                    posts: {
                        include: {
                            post: {
                                select: {
                                    id: true,
                                    title: true,
                                    published_at: true,
                                    created_at: true,
                                },
                            },
                        },
                        take: 5,
                        orderBy: {
                            post: { created_at: 'desc' },
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.tags.count({ where }),
        ]);

        return {
            items,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Math.floor(skip / limit) + 1,
        };
    }

    private async advancedSearchPosts(
        query: string,
        dateFilter: any,
        sortBy: SortBy = SortBy.RELEVANCE,
        sortOrder: SortOrder = SortOrder.DESC,
        skip: number,
        limit: number,
    ) {
        const orderBy = this.buildPostOrderBy(sortBy, sortOrder);

        const where = {
            AND: [
                {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            content: {
                                contains: query,
                                mode: 'insensitive' as const,
                            },
                        },
                        {
                            summary: {
                                contains: query,
                                mode: 'insensitive' as const,
                            },
                        },
                    ],
                },
                {
                    status: 'PUBLISHED' as any,
                },
                Object.keys(dateFilter).length > 0 ? {
                    published_at: dateFilter,
                } : {},
            ].filter(condition => Object.keys(condition).length > 0),
        };

        const [items, totalCount] = await Promise.all([
            this.prisma.posts.findMany({
                where,
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
            }),
            this.prisma.posts.count({ where }),
        ]);

        return {
            items,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Math.floor(skip / limit) + 1,
        };
    }

    private async advancedSearchUsers(
        query: string,
        dateFilter: any,
        sortBy: SortBy = SortBy.RELEVANCE,
        sortOrder: SortOrder = SortOrder.DESC,
        skip: number,
        limit: number,
    ) {
        const orderBy = this.buildUserOrderBy(sortBy, sortOrder);

        const where = {
            OR: [
                {
                    name: {
                        contains: query,
                        mode: 'insensitive' as const,
                    },
                },
                {
                    username: {
                        contains: query,
                        mode: 'insensitive' as const,
                    },
                },
                {
                    email: {
                        contains: query,
                        mode: 'insensitive' as const,
                    },
                },
            ],
        };

        const [items, totalCount] = await Promise.all([
            this.prisma.users.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    avatar_url: true,
                    created_at: true,
                    _count: {
                        select: {
                            posts: true,
                            followers: true,
                            following: true,
                        },
                    },
                    posts: {
                        select: {
                            id: true,
                            title: true,
                            created_at: true,
                        },
                        where: Object.keys(dateFilter).length > 0 ? {
                            published_at: dateFilter,
                        } : undefined,
                        take: 3,
                        orderBy: {
                            created_at: 'desc',
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.users.count({ where }),
        ]);

        return {
            items,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: Math.floor(skip / limit) + 1,
        };
    }

    private buildTagOrderBy(sortBy: SortBy, sortOrder: SortOrder) {
        switch (sortBy) {
            case SortBy.NAME:
                return { name: sortOrder as any };
            case SortBy.DATE:
                return { created_at: sortOrder as any };
            default:
                return { name: 'asc' }; // Default relevance for tags
        }
    }

    private buildPostOrderBy(sortBy: SortBy, sortOrder: SortOrder) {
        switch (sortBy) {
            case SortBy.DATE:
                return { published_at: sortOrder as any };
            case SortBy.LIKES:
                return { likes: { _count: sortOrder as any } };
            case SortBy.TITLE:
                return { title: sortOrder as any };
            default:
                return { published_at: 'desc' }; // Default relevance for posts
        }
    }

    private buildUserOrderBy(sortBy: SortBy, sortOrder: SortOrder) {
        switch (sortBy) {
            case SortBy.DATE:
                return { created_at: sortOrder as any };
            case SortBy.NAME:
                return { name: sortOrder as any };
            default:
                return { created_at: 'desc' }; // Default relevance for users
        }
    }
}
