import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../common/guards/admin.guard';
import {
  PeriodNotificationsConfig,
  PeriodNotificationsService,
} from './period-notifications.service';

@Controller('period-notifications')
export class PeriodNotificationsController {
  constructor(
    private readonly periodNotificationsService: PeriodNotificationsService,
  ) {}

  @Get('active')
  async getPublicMessages() {
    return this.periodNotificationsService.getPublicMessages();
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async getAdminConfigAndStats() {
    const [config, stats] = await Promise.all([
      this.periodNotificationsService.getConfig(),
      this.periodNotificationsService.getDispatchStats(),
    ]);
    return { config, stats };
  }

  @Put('admin')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async updateAdminConfig(@Body() body: Partial<PeriodNotificationsConfig>) {
    const config = await this.periodNotificationsService.updateConfig(body);
    const stats = await this.periodNotificationsService.getDispatchStats();
    return { config, stats };
  }

  @Post('admin/reset')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async resetDefaults() {
    const config = await this.periodNotificationsService.resetToDefaults();
    const stats = await this.periodNotificationsService.getDispatchStats();
    return { config, stats };
  }

  @Post('admin/send-test')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async sendTest(
    @Body() body: { userIdOrEmail: string; messageId?: string },
  ) {
    return this.periodNotificationsService.sendTestMessage(
      body.userIdOrEmail,
      body.messageId,
    );
  }

  @Post('admin/dispatch-now')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  async dispatchNow() {
    const summary = await this.periodNotificationsService.dispatchPeriodNotifications({
      forceNow: true,
    });
    const stats = await this.periodNotificationsService.getDispatchStats();
    return { summary, stats };
  }
}
