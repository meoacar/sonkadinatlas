import { Module } from '@nestjs/common';
import { PregnancyController } from './pregnancy.controller';
import { PregnancyService } from './pregnancy.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
  imports: [PrismaModule],
  controllers: [PregnancyController],
  providers: [PregnancyService, AdminGuard],
  exports: [PregnancyService],
})
export class PregnancyModule {}
