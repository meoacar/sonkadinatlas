import { Module, forwardRef } from '@nestjs/common';
import { CyclesController } from './cycles.controller';
import { CyclesService } from './cycles.service';
import { PredictionService } from './prediction.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
  imports: [PrismaModule, forwardRef(() => GamificationModule)],
  controllers: [CyclesController],
  providers: [CyclesService, PredictionService, AdminGuard],
  exports: [CyclesService, PredictionService],
})
export class CyclesModule { }
