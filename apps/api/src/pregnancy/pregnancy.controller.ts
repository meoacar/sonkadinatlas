import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PregnancyService } from './pregnancy.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('pregnancy')
@UseGuards(AuthGuard('jwt'))
export class PregnancyController {
  constructor(private readonly pregnancyService: PregnancyService) { }

  // ─────────────────────────────────────────────────────────────
  // Pregnancy Profile
  // ─────────────────────────────────────────────────────────────

  @Post()
  async createOrUpdatePregnancy(
    @CurrentUser() user: any,
    @Body()
    data: {
      lmpDate?: string;
      dueDate?: string;
      doctorNotes?: string;
      isActive?: boolean;
      anonymousMode?: boolean;
    },
  ) {
    return this.pregnancyService.createOrUpdatePregnancy(user.id, data);
  }

  @Get()
  async getPregnancy(@CurrentUser() user: any) {
    return this.pregnancyService.getPregnancy(user.id);
  }

  @Get('summary')
  async getPregnancySummary(@CurrentUser() user: any) {
    return this.pregnancyService.getPregnancySummary(user.id);
  }

  @Delete()
  async deletePregnancy(@CurrentUser() user: any) {
    return this.pregnancyService.deletePregnancy(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // Kick Counter
  // ─────────────────────────────────────────────────────────────

  @Post('kicks')
  async logKickCount(
    @CurrentUser() user: any,
    @Body()
    data: {
      sessionDate: string;
      kickCount: number;
      durationMin: number;
      notes?: string;
    },
  ) {
    return this.pregnancyService.logKickCount(user.id, data);
  }

  @Get('kicks')
  async getKickCounts(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.pregnancyService.getKickCounts(
      user.id,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Delete('kicks/:id')
  async deleteKickCount(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.deleteKickCount(user.id, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Contraction Timer
  // ─────────────────────────────────────────────────────────────

  @Post('contractions')
  async logContraction(
    @CurrentUser() user: any,
    @Body()
    data: {
      startTime: string;
      endTime: string;
      durationSec: number;
      intensity?: number;
      notes?: string;
    },
  ) {
    return this.pregnancyService.logContraction(user.id, data);
  }

  @Get('contractions')
  async getContractions(
    @CurrentUser() user: any,
    @Query('hours') hours?: string,
  ) {
    return this.pregnancyService.getContractions(
      user.id,
      hours ? parseInt(hours) : undefined,
    );
  }

  @Get('contractions/summary')
  async getContractionsSummary(@CurrentUser() user: any) {
    return this.pregnancyService.getContractionsSummary(user.id);
  }

  @Delete('contractions/:id')
  async deleteContraction(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.deleteContraction(user.id, id);
  }

  @Delete('contractions')
  async deleteAllContractions(@CurrentUser() user: any) {
    return this.pregnancyService.deleteAllContractions(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // Appointments
  // ─────────────────────────────────────────────────────────────

  @Post('appointments')
  async createAppointment(
    @CurrentUser() user: any,
    @Body()
    data: {
      appointmentAt: string;
      clinic?: string;
      doctorName?: string;
      notes?: string;
      vitals?: {
        bloodPressure?: string;
        weight?: number;
        glucose?: number;
        [key: string]: any;
      };
    },
  ) {
    return this.pregnancyService.createAppointment(user.id, data);
  }

  @Get('appointments')
  async getAppointments(@CurrentUser() user: any) {
    return this.pregnancyService.getAppointments(user.id);
  }

  @Get('appointments/:id')
  async getAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.getAppointment(user.id, id);
  }

  @Patch('appointments/:id')
  async updateAppointment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    data: {
      appointmentAt?: string;
      clinic?: string;
      doctorName?: string;
      notes?: string;
      vitals?: any;
    },
  ) {
    return this.pregnancyService.updateAppointment(user.id, id, data);
  }

  @Delete('appointments/:id')
  async deleteAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.deleteAppointment(user.id, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Medications
  // ─────────────────────────────────────────────────────────────

  @Post('medications')
  async addMedication(
    @CurrentUser() user: any,
    @Body()
    data: {
      name: string;
      dosage?: string;
      frequency?: string;
      safetyRating?: string;
      notes?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.pregnancyService.addMedication(user.id, data);
  }

  @Get('medications')
  async getMedications(@CurrentUser() user: any) {
    return this.pregnancyService.getMedications(user.id);
  }

  @Patch('medications/:id')
  async updateMedication(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.pregnancyService.updateMedication(user.id, id, data);
  }

  @Delete('medications/:id')
  async deleteMedication(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.deleteMedication(user.id, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Birth Plan
  // ─────────────────────────────────────────────────────────────

  @Post('birth-plan')
  async createOrUpdateBirthPlan(
    @CurrentUser() user: any,
    @Body() data: { content: any },
  ) {
    return this.pregnancyService.createOrUpdateBirthPlan(user.id, data.content);
  }

  @Get('birth-plan')
  async getBirthPlan(@CurrentUser() user: any) {
    return this.pregnancyService.getBirthPlan(user.id);
  }

  @Delete('birth-plan')
  async deleteBirthPlan(@CurrentUser() user: any) {
    return this.pregnancyService.deleteBirthPlan(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // Hospital Bag Checklist
  // ─────────────────────────────────────────────────────────────

  @Post('hospital-bag')
  async addHospitalBagItem(
    @CurrentUser() user: any,
    @Body()
    data: {
      category: string;
      itemName: string;
      sortOrder?: number;
    },
  ) {
    return this.pregnancyService.addHospitalBagItem(user.id, data);
  }

  @Get('hospital-bag')
  async getHospitalBagItems(@CurrentUser() user: any) {
    return this.pregnancyService.getHospitalBagItems(user.id);
  }

  @Patch('hospital-bag/:id')
  async updateHospitalBagItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { isPacked?: boolean; itemName?: string; sortOrder?: number },
  ) {
    return this.pregnancyService.updateHospitalBagItem(user.id, id, data);
  }

  @Delete('hospital-bag/:id')
  async deleteHospitalBagItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.pregnancyService.deleteHospitalBagItem(user.id, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────────────────────

  @Post('notes')
  async createNote(
    @CurrentUser() user: any,
    @Body()
    data: {
      title?: string;
      content: string;
      tags?: string[];
    },
  ) {
    return this.pregnancyService.createNote(user.id, data);
  }

  @Get('notes')
  async getNotes(@CurrentUser() user: any) {
    return this.pregnancyService.getNotes(user.id);
  }

  @Get('notes/:id')
  async getNote(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.getNote(user.id, id);
  }

  @Patch('notes/:id')
  async updateNote(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { title?: string; content?: string; tags?: string[] },
  ) {
    return this.pregnancyService.updateNote(user.id, id, data);
  }

  @Delete('notes/:id')
  async deleteNote(@CurrentUser() user: any, @Param('id') id: string) {
    return this.pregnancyService.deleteNote(user.id, id);
  }

  // ─────────────────────────────────────────────────────────────
  // Weekly Content
  // ─────────────────────────────────────────────────────────────

  @Get('weekly-content')
  async getWeeklyContent(@CurrentUser() user: any) {
    return this.pregnancyService.getWeeklyContent(user.id);
  }

  // ─────────────────────────────────────────────────────────────
  // Admin Endpoints
  // ─────────────────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllPregnancies(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {};
    if (isActive === 'true') where.isActive = true;
    else if (isActive === 'false') where.isActive = false;

    if (search?.trim()) {
      const q = search.trim();
      where.user = {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [rawData, total, allForStats] = await Promise.all([
      this.pregnancyService['prisma'].pregnancy.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          _count: {
            select: {
              kickCounts: true,
              contractions: true,
              appointments: true,
              medications: true,
              pregnancyNotes: true,
            },
          },
        },
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.pregnancyService['prisma'].pregnancy.count({ where }),
      this.pregnancyService['prisma'].pregnancy.findMany({
        select: { isActive: true, lmpDate: true, dueDate: true, weekCache: true, trimester: true },
      }),
    ]);

    const computeWeekAndTrimester = (p: any) => {
      const lmp =
        p.lmpDate ||
        (p.dueDate ? new Date(new Date(p.dueDate).getTime() - 280 * 24 * 60 * 60 * 1000) : null);
      if (!lmp) return { week: p.weekCache ?? null, trimester: p.trimester ?? null };
      const diffDays = Math.max(0, Math.floor((Date.now() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24)));
      const week = Math.floor(diffDays / 7);
      const trimester = week <= 13 ? 1 : week <= 26 ? 2 : 3;
      return { week, trimester };
    };

    const data = rawData.map((p) => {
      const computed = computeWeekAndTrimester(p);
      return {
        ...p,
        weekCache: computed.week ?? p.weekCache,
        trimester: computed.trimester ?? p.trimester,
      };
    });

    const stats = allForStats.reduce(
      (acc, p) => {
        const computed = computeWeekAndTrimester(p);
        acc.total += 1;
        if (p.isActive) acc.activeCount += 1;
        if (computed.trimester === 1) acc.trimester1 += 1;
        else if (computed.trimester === 2) acc.trimester2 += 1;
        else if (computed.trimester === 3) acc.trimester3 += 1;
        return acc;
      },
      { total: 0, activeCount: 0, trimester1: 0, trimester2: 0, trimester3: 0 },
    );

    return { data, total, page: parsedPage, limit: parsedLimit, stats };
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  async getPregnancyById(@Param('id') id: string) {
    const record = await this.pregnancyService['prisma'].pregnancy.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        kickCounts: { orderBy: { sessionDate: 'desc' }, take: 20 },
        contractions: { orderBy: { startTime: 'desc' }, take: 20 },
        appointments: { orderBy: { appointmentAt: 'desc' } },
        medications: { orderBy: { createdAt: 'desc' } },
        pregnancyNotes: { orderBy: { createdAt: 'desc' }, take: 20 },
        birthPlan: true,
        hospitalBagItems: { orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] },
      },
    });

    if (!record) return null;

    const lmp =
      record.lmpDate ||
      (record.dueDate ? new Date(new Date(record.dueDate).getTime() - 280 * 24 * 60 * 60 * 1000) : null);
    if (lmp) {
      const diffDays = Math.max(0, Math.floor((Date.now() - new Date(lmp).getTime()) / (1000 * 60 * 60 * 24)));
      const week = Math.floor(diffDays / 7);
      return {
        ...record,
        weekCache: week,
        trimester: week <= 13 ? 1 : week <= 26 ? 2 : 3,
      };
    }

    return record;
  }
}
