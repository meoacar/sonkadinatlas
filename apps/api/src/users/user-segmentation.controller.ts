import { Controller, Get, Query, UseGuards, Post, Body } from '@nestjs/common';
import {
    UserSegmentationService,
    SegmentFilters,
    SegmentSortBy,
    SegmentSortOrder,
} from './user-segmentation.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('users/segmentation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserSegmentationController {
    constructor(private readonly segmentationService: UserSegmentationService) { }

    @Get('predefined')
    async getPredefinedSegments() {
        return this.segmentationService.getPredefinedSegments();
    }

    @Post('query')
    async querySegment(
        @Body() body: {
            filters?: SegmentFilters;
            limit?: number;
            offset?: number;
            sortBy?: SegmentSortBy;
            sortOrder?: SegmentSortOrder;
        },
    ) {
        const filters = body?.filters || {};
        const limit = Math.min(Math.max(Number(body?.limit ?? 100), 1), 500);
        const offset = Math.max(Number(body?.offset ?? 0), 0);
        const sortBy = body?.sortBy || 'createdAt';
        const sortOrder = body?.sortOrder || 'desc';

        const [users, stats] = await Promise.all([
            this.segmentationService.getUsersBySegment(filters, limit, offset, sortBy, sortOrder),
            this.segmentationService.getSegmentStats(filters),
        ]);

        return {
            users,
            stats,
            pagination: {
                limit,
                offset,
                total: stats.totalUsers,
            },
        };
    }

    @Post('ids')
    async getSegmentUserIds(
        @Body() body: {
            filters?: SegmentFilters;
            maxIds?: number;
        },
    ) {
        const filters = body?.filters || {};
        const maxIds = body?.maxIds ?? 5000;
        const userIds = await this.segmentationService.getSegmentUserIds(filters, maxIds);
        return {
            userIds,
            total: userIds.length,
        };
    }

    @Get('stats')
    async getSegmentStats(@Query() query: any) {
        const filters: SegmentFilters = {};

        if (query.search) {
            filters.search = String(query.search);
        }

        if (query.accountStatus) {
            filters.accountStatus = query.accountStatus;
        }

        if (query.subscriptionStatus) {
            filters.subscriptionStatus = Array.isArray(query.subscriptionStatus)
                ? query.subscriptionStatus
                : [query.subscriptionStatus];
        }

        if (query.subscriptionTier) {
            filters.subscriptionTier = Array.isArray(query.subscriptionTier)
                ? query.subscriptionTier
                : [query.subscriptionTier];
        }

        if (query.isPregnant !== undefined) {
            filters.isPregnant = query.isPregnant === 'true';
        }

        if (query.hasActiveCycle !== undefined) {
            filters.hasActiveCycle = query.hasActiveCycle === 'true';
        }

        if (query.hasLoggedCycle !== undefined) {
            filters.hasLoggedCycle = query.hasLoggedCycle === 'true';
        }

        if (query.hasUsedNova !== undefined) {
            filters.hasUsedNova = query.hasUsedNova === 'true';
        }

        if (query.isActive !== undefined) {
            filters.isActive = query.isActive === 'true';
        }

        if (query.inactiveDays !== undefined) {
            const parsed = parseInt(String(query.inactiveDays), 10);
            if (!Number.isNaN(parsed) && parsed > 0) {
                filters.inactiveDays = parsed;
            }
        }

        if (query.createdAfter) {
            filters.createdAfter = new Date(query.createdAfter);
        }

        if (query.createdBefore) {
            filters.createdBefore = new Date(query.createdBefore);
        }

        return this.segmentationService.getSegmentStats(filters);
    }
}
