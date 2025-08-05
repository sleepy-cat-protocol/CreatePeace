import { Injectable, UnauthorizedException, ConflictException  } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

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
    
      async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
          access_token: this.jwt.sign(payload),
        };
      }
    
      async register(data: {
        email: string;
        name: string;
        password: string;
      }) {
        const user = await this.usersService.create(data);
        return this.login(user);
      }


}
