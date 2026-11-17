import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  async healthCheck() {
    return this.appService.getHealthStatus();
  }

  @Get('public/site-summary')
  async getPublicSiteSummary() {
    return this.appService.getPublicSiteSummary();
  }
}
