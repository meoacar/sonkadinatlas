import {
  Controller,
  Get,
  Put,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotaService, NovaLimitsConfig } from './quota.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('quota')
@UseGuards(AuthGuard('jwt'))
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) { }

  @Get()
  async getQuota(@CurrentUser() user: any) {
    return this.quotaService.getStatus(user.id);
  }
}

@Controller('quotas')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class QuotasController {
  constructor(private readonly quotaService: QuotaService) { }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.quotaService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
  }

  @Get('config')
  async getConfig() {
    return this.quotaService.getAdminSummary();
  }

  @Put('config')
  async updateConfig(
    @Body() body: Partial<NovaLimitsConfig> & { syncExisting?: boolean },
  ) {
    return this.quotaService.updateLimitsConfig(body);
  }

  @Patch('user/:userId/limit')
  async updateUserLimit(
    @Param('userId') userId: string,
    @Body('limit') limit: number,
  ) {
    if (!limit || typeof limit !== 'number' || limit < 1) {
      throw new BadRequestException('Limit en az 1 olmalıdır');
    }
    return this.quotaService.updateLimit(userId, Math.round(limit));
  }

  @Post('user/:userId/reset')
  async resetUserQuota(@Param('userId') userId: string) {
    return this.quotaService.reset(userId);
  }
}
