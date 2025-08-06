import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        try {
            console.log('Connecting to database...');
            await this.$connect();
            console.log('Database connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            throw error;
        }
    }
    async enableShutdownHooks(app: INestApplication) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}
