import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, Request, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { FileUploadService } from '../../common/services/file-upload.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // More specific routes first to avoid conflicts
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  async getMyProfile(@Request() req: any) {
    return this.usersService.getUserProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    console.log('getUserProfile', id);
    return this.usersService.getUserProfile(id);
  }

  @Get(':id/posts')
  async getUserPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.getUserPosts(id, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar', FileUploadService.multerConfig))
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const avatarUrl = this.fileUploadService.getFileUrl(file.filename);
    
    // Update user's avatar_url in database
    const updatedUser = await this.usersService.updateProfile(req.user.id, {
      avatar_url: avatarUrl,
    });

    return {
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl,
      user: updatedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async followUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.followUser(req.user.id, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollowUser(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.unfollowUser(req.user.id, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/follow-status')
  async getFollowStatus(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.getFollowStatus(req.user.id, targetUserId);
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @Get(':id/following')
  async getUserFollowing(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getUserFollowing(id, pageNum, limitNum);
  }

  @Get(':id/followers')
  async getUserFollowers(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getUserFollowers(id, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/remove-follower')
  async removeFollower(
    @Request() req: any,
    @Param('id') followerId: string,
  ) {
    return this.usersService.removeFollower(req.user.id, followerId);
  }

  @Get(':id/liked-posts')
  async getUserLikedPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getUserLikedPosts(id, pageNum, limitNum);
  }

  @Get(':id/collected-posts')
  async getUserCollectedPosts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.usersService.getUserCollectedPosts(id, pageNum, limitNum);
  }
}
