import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditLogService } from './audit-log.service';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.auditLogService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userId,
      action,
      entity,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}
