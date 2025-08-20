import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController, CommentManagementController } from './comment.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController, CommentManagementController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
