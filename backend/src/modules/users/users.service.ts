import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; name: string; password: string }) {
    const hash = await bcrypt.hash(data.password, 10);
    return this.prisma.users.create({
      data: { ...data, password: hash },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.users.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async getUserProfile(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar_url: true,
        website: true,
        is_verified: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            likes: true,
            collections: true,
            followers: true,
            following: true,
          }
        }
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    // Check if username is already taken (if provided)
    if (updateProfileDto.username) {
      console.log('test');
      console.log('updateProfileDto', updateProfileDto);
      const existingUser = await this.prisma.users.findFirst({
        where: {
          username: updateProfileDto.username,
          NOT: { id }
        }
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    const updatedUser = await this.prisma.users.update({
      where: { id },
      data: updateProfileDto,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar_url: true,
        website: true,
        is_verified: true,
        created_at: true,
      },
    });

    return updatedUser;
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.posts.findMany({
      where: { 
        author_id: userId,
        status: 'PUBLISHED'
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
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPosts = await this.prisma.posts.count({
      where: { 
        author_id: userId,
        status: 'PUBLISHED'
      },
    });

    return {
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
    };
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.users.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar_url: true,
        website: true,
        is_verified: true,
        created_at: true,
        _count: {
          select: {
            posts: true,
            likes: true,
            collections: true,
            followers: true,
            following: true,
          }
        }
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async followUser(followerId: string, followingId: string) {
    // Check if trying to follow self
    if (followerId === followingId) {
      throw new ConflictException('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.users.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        }
      }
    });

    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    // Create follow relationship
    await this.prisma.user_follows.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      }
    });

    return { message: 'Successfully followed user' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    // Check if follow relationship exists
    const existingFollow = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        }
      }
    });

    if (!existingFollow) {
      throw new NotFoundException('Not following this user');
    }

    // Remove follow relationship
    await this.prisma.user_follows.delete({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        }
      }
    });

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowStatus(followerId: string, followingId: string) {
    const isFollowing = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        }
      }
    });

    return { isFollowing: !!isFollowing };
  }

  async getUserFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const following = await this.prisma.user_follows.findMany({
      where: { follower_id: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar_url: true,
            bio: true,
            is_verified: true,
            created_at: true,
            _count: {
              select: {
                posts: true,
                followers: true,
                following: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalFollowing = await this.prisma.user_follows.count({
      where: { follower_id: userId },
    });

    return {
      following: following.map(f => f.following),
      totalFollowing,
      totalPages: Math.ceil(totalFollowing / limit),
      currentPage: page,
    };
  }

  async getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const followers = await this.prisma.user_follows.findMany({
      where: { following_id: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar_url: true,
            bio: true,
            is_verified: true,
            created_at: true,
            _count: {
              select: {
                posts: true,
                followers: true,
                following: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalFollowers = await this.prisma.user_follows.count({
      where: { following_id: userId },
    });

    return {
      followers: followers.map(f => f.follower),
      totalFollowers,
      totalPages: Math.ceil(totalFollowers / limit),
      currentPage: page,
    };
  }

  async removeFollower(userId: string, followerId: string) {
    // Check if the follow relationship exists
    const existingFollow = await this.prisma.user_follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: userId,
        }
      }
    });

    if (!existingFollow) {
      throw new NotFoundException('Follower relationship not found');
    }

    // Remove the follow relationship
    await this.prisma.user_follows.delete({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: userId,
        }
      }
    });

    return { message: 'Follower removed successfully' };
  }

  async getUserLikedPosts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const likedPosts = await this.prisma.post_likes.findMany({
      where: { user_id: userId },
      include: {
        posts: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar_url: true,
              }
            },
            tags: {
              include: {
                tag: true,
              }
            },
            _count: {
              select: {
                likes: true,
                collections: true,
                comments: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalLikedPosts = await this.prisma.post_likes.count({
      where: { user_id: userId },
    });

    return {
      posts: likedPosts.map(like => like.posts),
      totalPosts: totalLikedPosts,
      totalPages: Math.ceil(totalLikedPosts / limit),
      currentPage: page,
    };
  }

  async getUserCollectedPosts(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const collectedPosts = await this.prisma.post_collections.findMany({
      where: { user_id: userId },
      include: {
        posts: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar_url: true,
              }
            },
            tags: {
              include: {
                tag: true,
              }
            },
            _count: {
              select: {
                likes: true,
                collections: true,
                comments: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    const totalCollectedPosts = await this.prisma.post_collections.count({
      where: { user_id: userId },
    });

    return {
      posts: collectedPosts.map(collection => collection.posts),
      totalPosts: totalCollectedPosts,
      totalPages: Math.ceil(totalCollectedPosts / limit),
      currentPage: page,
    };
  }
}
