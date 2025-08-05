import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
    return this.prisma.users.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.users.findUnique({ where: { id } });
  }
}
