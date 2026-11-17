import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RetentionService } from './retention.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RemindersModule } from '../reminders/reminders.module';
import { AdminGateway } from './admin.gateway';

@Module({
    imports: [PrismaModule, MailModule, RemindersModule],
    controllers: [AdminController],
    providers: [AdminService, RetentionService, AdminGateway],
    exports: [AdminService, RetentionService],
})
export class AdminModule { }
