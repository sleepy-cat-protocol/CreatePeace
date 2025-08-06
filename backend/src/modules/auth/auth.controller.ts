import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService
  ) {}

  @Get('test')
  async test() {
    console.log('Test endpoint reached');
    return { message: 'Auth controller is working' };
  }

  @Get('users')
  async getUsers() {
    console.log('Getting users...');
    try {
      const users = await this.prisma.users.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      });
      console.log('Users found:', users.length);
      return { users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { error: error.message };
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Response() res) {
    console.log('Register endpoint reached');
    console.log(dto);
    return await this.authService.register(dto, res);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Response() res) {
    try {
      const result = await this.authService.login(req.user, res);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in login controller:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    console.log('User from JWT:', req.user);
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Response() res) {
    try {
      const result = await this.authService.logout(res);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in logout controller:', error);
      res.status(500).json({ message: 'Logout failed', error: error.message });
    }
  }
}