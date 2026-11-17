import { Module, forwardRef } from '@nestjs/common';
import { WaterController } from './water.controller';
import { WaterService } from './water.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, forwardRef(() => GamificationModule)],
  controllers: [WaterController],
  providers: [WaterService],
  exports: [WaterService],
})
export class WaterModule {}
