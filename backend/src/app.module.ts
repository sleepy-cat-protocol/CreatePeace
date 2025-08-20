import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PostModule } from './modules/post/post.module';
import { UsersModule } from './modules/users/users.module';
import { SearchModule } from './modules/search/search.module';
import { CommentModule } from './modules/comment/comment.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, PostModule, UsersModule, SearchModule, CommentModule, TagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
