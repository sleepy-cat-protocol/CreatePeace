import { Injectable, UnauthorizedException, ConflictException, Res } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private usersService: UsersService) {}

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(password, user.password))) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }
    
      async login(user: any, res: Response) {
        try {
          const payload = { email: user.email, sub: user.id };
          const token = this.jwt.sign(payload);
          
          // Set secure cookie
          res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
          });
          
          return {
            message: 'Login successful',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          };
        } catch (error) {
          console.error('Error in login method:', error);
          throw error;
        }
      }
    
      async register(data: {
        email: string;
        name: string;
        password: string;
      }, res: Response) {
        const user = await this.usersService.create(data);
        return this.login(user, res);
      }

      async getProfile(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        const { password, ...result } = user;
        return result;
      }

      async logout(res: Response) {
        res.clearCookie('access_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
        return { message: 'Logout successful' };
      }


}
