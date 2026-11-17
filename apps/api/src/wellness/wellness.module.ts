import { Module, forwardRef } from '@nestjs/common';
import { WellnessController } from './wellness.controller';
import { WellnessService } from './wellness.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => GamificationModule)],
  controllers: [WellnessController],
  providers: [WellnessService, AdminGuard],
  exports: [WellnessService],
})
export class WellnessModule { }
