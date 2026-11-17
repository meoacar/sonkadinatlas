import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSegmentationController } from './user-segmentation.controller';
import { UserSegmentationService } from './user-segmentation.service';
import { SupportController } from './support.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RemindersModule } from '../reminders/reminders.module';
import { MailModule } from '../mail/mail.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
  imports: [PrismaModule, RemindersModule, MailModule],
  controllers: [UsersController, UserSegmentationController, SupportController],
  providers: [UsersService, UserSegmentationService, AdminGuard],
  exports: [UsersService],
})
export class UsersModule { }
