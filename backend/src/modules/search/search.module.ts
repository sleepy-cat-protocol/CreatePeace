import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  imports: [PrismaModule]
})
export class SearchModule {}
