import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    AstrologyService,
    BirthChartInput,
    HoroscopeUpsertInput,
    CosmicOverviewInput,
} from './astrology.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('astrology')
@UseGuards(JwtAuthGuard)
export class AstrologyController {
    constructor(private readonly astrologyService: AstrologyService) { }

    // ── User-facing Endpoints ──

    @Get('cosmic')
    async getCosmicOverview() {
        return this.astrologyService.getCosmicOverview();
    }

    @Get('horoscopes')
    async getHoroscopes(
        @Query('period') period?: string,
        @Query('sign') sign?: string,
    ) {
        return this.astrologyService.getHoroscopes(period || 'daily', sign);
    }

    @Get('horoscopes/:sign')
    async getSignHoroscopes(@Param('sign') sign: string) {
        return this.astrologyService.getSignHoroscopes(sign);
    }

    @Get('my-birth-chart')
    async getMyBirthChart(@Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.astrologyService.getMyBirthChart(userId);
    }

    @Post('birth-chart')
    async calculateBirthChart(@Request() req: any, @Body() input: BirthChartInput) {
        const userId = req.user?.id || req.user?.sub;
        return this.astrologyService.calculateBirthChart(userId, input);
    }

    @Post('sun-sign')
    async getSunSign(@Body() body: { birthDate: string }) {
        const sunSign = this.astrologyService.getSimpleSunSign(body.birthDate);
        return { sunSign };
    }

    @Post('compatibility')
    async calculateCompatibility(@Body() body: { sign1: string; sign2: string }) {
        return this.astrologyService.calculateCompatibility(body.sign1, body.sign2);
    }

    // ── Admin Panel Endpoints ──

    @Get('admin/stats')
    @UseGuards(AdminGuard)
    async adminGetStats() {
        return this.astrologyService.adminGetStats();
    }

    @Get('admin/cosmic')
    @UseGuards(AdminGuard)
    async adminGetCosmicOverview() {
        return this.astrologyService.adminGetCosmicOverview();
    }

    @Put('admin/cosmic')
    @UseGuards(AdminGuard)
    async adminUpdateCosmicOverview(@Body() body: CosmicOverviewInput) {
        return this.astrologyService.adminUpdateCosmicOverview(body);
    }

    @Get('admin/horoscopes')
    @UseGuards(AdminGuard)
    async adminListHoroscopes(
        @Query('sign') sign?: string,
        @Query('period') period?: string,
        @Query('search') search?: string,
        @Query('isActive') isActive?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.astrologyService.adminListHoroscopes({
            sign,
            period,
            search,
            isActive,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Get('admin/horoscopes/:id')
    @UseGuards(AdminGuard)
    async adminGetHoroscope(@Param('id') id: string) {
        return this.astrologyService.adminGetHoroscope(id);
    }

    @Post('admin/horoscopes')
    @UseGuards(AdminGuard)
    async adminCreateHoroscope(@Body() body: HoroscopeUpsertInput) {
        return this.astrologyService.adminUpsertHoroscope(body);
    }

    @Patch('admin/horoscopes/:id')
    @UseGuards(AdminGuard)
    async adminUpdateHoroscope(
        @Param('id') id: string,
        @Body() body: Partial<HoroscopeUpsertInput>,
    ) {
        return this.astrologyService.adminUpdateHoroscope(id, body);
    }

    @Delete('admin/horoscopes/:id')
    @UseGuards(AdminGuard)
    async adminDeleteHoroscope(@Param('id') id: string) {
        return this.astrologyService.adminDeleteHoroscope(id);
    }
}
