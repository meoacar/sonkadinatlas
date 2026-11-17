import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    Prisma,
    SubscriptionStatus,
    SubscriptionTier,
    UserStatus,
} from '@prisma/client';

export interface UserSegment {
    id: string;
    email: string;
    username: string | null;
    displayName: string;
    status: UserStatus;
    subscriptionStatus: SubscriptionStatus;
    subscriptionTier: SubscriptionTier | null;
    isPregnant: boolean;
    hasActiveCycle: boolean;
    cycleCount: number;
    conversationCount: number;
    dailyLogCount: number;
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
}

export interface SegmentFilters {
    search?: string;
    accountStatus?: UserStatus | 'ALL';
    subscriptionStatus?: SubscriptionStatus[];
    subscriptionTier?: SubscriptionTier[];
    isPregnant?: boolean;
    hasActiveCycle?: boolean;
    hasLoggedCycle?: boolean;
    hasUsedNova?: boolean;
    isActive?: boolean; // Active in last 7 days
    activeDays?: number;
    inactiveDays?: number;
    createdAfter?: Date | string;
    createdBefore?: Date | string;
}

export type SegmentSortBy = 'createdAt' | 'updatedAt' | 'email';
export type SegmentSortOrder = 'asc' | 'desc';

@Injectable()
export class UserSegmentationService {
    constructor(private readonly prisma: PrismaService) { }

    private parseDate(value?: Date | string): Date | undefined {
        if (!value) return undefined;
        const d = value instanceof Date ? value : new Date(value);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }

    private buildRecentActivityCondition(cutoff: Date): Prisma.UserWhereInput {
        return {
            OR: [
                { updatedAt: { gte: cutoff } },
                { dailyLogs: { some: { createdAt: { gte: cutoff } } } },
                { periodCycles: { some: { updatedAt: { gte: cutoff } } } },
                { waterLogs: { some: { createdAt: { gte: cutoff } } } },
                { sleepLogs: { some: { createdAt: { gte: cutoff } } } },
                {
                    conversations: {
                        some: {
                            messages: {
                                some: { createdAt: { gte: cutoff } },
                            },
                        },
                    },
                },
            ],
        };
    }

    private buildFreeSubscriptionCondition(): Prisma.UserWhereInput {
        return {
            OR: [
                { subscription: null },
                { subscription: { status: SubscriptionStatus.FREE } },
            ],
        };
    }

    /**
     * Unified Prisma where builder used across query, stats, and bulk ID lookup
     */
    buildWhere(filters: SegmentFilters = {}): Prisma.UserWhereInput {
        const andConditions: Prisma.UserWhereInput[] = [];

        // Account status filter (defaults to ACTIVE)
        if (filters.accountStatus === 'ALL') {
            andConditions.push({ status: { not: UserStatus.DELETED } });
        } else if (filters.accountStatus && filters.accountStatus in UserStatus) {
            andConditions.push({ status: filters.accountStatus });
        } else {
            andConditions.push({ status: UserStatus.ACTIVE });
        }

        // Search by email, username, or displayName
        const search = filters.search?.trim();
        if (search) {
            andConditions.push({
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { profile: { displayName: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }

        // Subscription status filter (handles missing subscription row as FREE)
        if (filters.subscriptionStatus && filters.subscriptionStatus.length > 0) {
            const includesFree = filters.subscriptionStatus.includes(SubscriptionStatus.FREE);
            const subscriptionOr: Prisma.UserWhereInput[] = [
                {
                    subscription: {
                        status: { in: filters.subscriptionStatus },
                    },
                },
            ];
            if (includesFree) {
                subscriptionOr.push({ subscription: null });
            }
            andConditions.push({ OR: subscriptionOr });
        }

        // Subscription tier filter (MONTHLY / YEARLY)
        if (filters.subscriptionTier && filters.subscriptionTier.length > 0) {
            andConditions.push({
                subscription: {
                    tier: { in: filters.subscriptionTier },
                },
            });
        }

        // Pregnancy filter
        if (filters.isPregnant !== undefined) {
            if (filters.isPregnant) {
                andConditions.push({ pregnancy: { isActive: true } });
            } else {
                andConditions.push({
                    OR: [{ pregnancy: null }, { pregnancy: { isActive: false } }],
                });
            }
        }

        // Active cycle filter (supports both true and false)
        if (filters.hasActiveCycle !== undefined) {
            if (filters.hasActiveCycle) {
                andConditions.push({
                    periodCycles: { some: { endDate: null } },
                });
            } else {
                andConditions.push({
                    periodCycles: { none: { endDate: null } },
                });
            }
        }

        // Historical cycle logging filter
        if (filters.hasLoggedCycle !== undefined) {
            if (filters.hasLoggedCycle) {
                andConditions.push({ periodCycles: { some: {} } });
            } else {
                andConditions.push({ periodCycles: { none: {} } });
            }
        }

        // NOVA AI usage filter
        if (filters.hasUsedNova !== undefined) {
            if (filters.hasUsedNova) {
                andConditions.push({
                    conversations: { some: { messages: { some: {} } } },
                });
            } else {
                andConditions.push({
                    conversations: { none: { messages: { some: {} } } },
                });
            }
        }

        // Registration date filter
        const createdAfter = this.parseDate(filters.createdAfter);
        const createdBefore = this.parseDate(filters.createdBefore);
        if (createdAfter || createdBefore) {
            const createdAtFilter: Prisma.DateTimeFilter = {};
            if (createdAfter) createdAtFilter.gte = createdAfter;
            if (createdBefore) createdAtFilter.lte = createdBefore;
            andConditions.push({ createdAt: createdAtFilter });
        }

        // Multi-signal activity / inactivity filter
        const now = Date.now();
        if (typeof filters.inactiveDays === 'number' && filters.inactiveDays > 0) {
            const cutoff = new Date(now - filters.inactiveDays * 24 * 60 * 60 * 1000);
            andConditions.push({
                NOT: this.buildRecentActivityCondition(cutoff),
            });
        } else if (typeof filters.activeDays === 'number' && filters.activeDays > 0) {
            const cutoff = new Date(now - filters.activeDays * 24 * 60 * 60 * 1000);
            andConditions.push(this.buildRecentActivityCondition(cutoff));
        } else if (filters.isActive !== undefined) {
            const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (filters.isActive) {
                andConditions.push(this.buildRecentActivityCondition(sevenDaysAgo));
            } else {
                andConditions.push({
                    NOT: this.buildRecentActivityCondition(sevenDaysAgo),
                });
            }
        }

        return andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
    }

    /**
     * Get users by segment filters
     */
    async getUsersBySegment(
        filters: SegmentFilters = {},
        limit = 100,
        offset = 0,
        sortBy: SegmentSortBy = 'createdAt',
        sortOrder: SegmentSortOrder = 'desc',
    ): Promise<UserSegment[]> {
        const where = this.buildWhere(filters);
        const safeLimit = Math.min(Math.max(limit || 100, 1), 500);
        const safeOffset = Math.max(offset || 0, 0);

        const orderByField: SegmentSortBy = ['createdAt', 'updatedAt', 'email'].includes(sortBy)
            ? sortBy
            : 'createdAt';
        const orderDir: SegmentSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

        const users = await this.prisma.user.findMany({
            where,
            include: {
                profile: {
                    select: {
                        displayName: true,
                    },
                },
                subscription: {
                    select: {
                        status: true,
                        tier: true,
                    },
                },
                pregnancy: {
                    select: {
                        isActive: true,
                    },
                },
                periodCycles: {
                    select: {
                        endDate: true,
                        updatedAt: true,
                    },
                    take: 5,
                    orderBy: { updatedAt: 'desc' },
                },
                dailyLogs: {
                    select: { createdAt: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
                waterLogs: {
                    select: { createdAt: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
                conversations: {
                    select: {
                        updatedAt: true,
                        messages: {
                            select: { createdAt: true },
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                        },
                    },
                    take: 1,
                    orderBy: { updatedAt: 'desc' },
                },
                _count: {
                    select: {
                        periodCycles: true,
                        conversations: true,
                        dailyLogs: true,
                    },
                },
            },
            take: safeLimit,
            skip: safeOffset,
            orderBy: { [orderByField]: orderDir },
        });

        return users.map((user) => {
            const candidateDates = [
                user.updatedAt,
                user.conversations[0]?.messages[0]?.createdAt,
                user.conversations[0]?.updatedAt,
                user.dailyLogs[0]?.createdAt,
                user.waterLogs[0]?.createdAt,
                user.periodCycles[0]?.updatedAt,
            ].filter((d): d is Date => d instanceof Date);

            const lastActive = candidateDates.reduce(
                (max, current) => (current.getTime() > max.getTime() ? current : max),
                user.createdAt,
            );

            return {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.profile?.displayName || 'Anonim',
                status: user.status,
                subscriptionStatus: user.subscription?.status || SubscriptionStatus.FREE,
                subscriptionTier: user.subscription?.tier || null,
                isPregnant: Boolean(user.pregnancy?.isActive),
                hasActiveCycle: user.periodCycles.some((c) => c.endDate === null),
                cycleCount: user._count.periodCycles,
                conversationCount: user._count.conversations,
                dailyLogCount: user._count.dailyLogs,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastActive,
            };
        });
    }

    /**
     * Get all user IDs matching a segment (for targeting entire segment with bulk actions)
     */
    async getSegmentUserIds(filters: SegmentFilters = {}, maxIds = 5000): Promise<string[]> {
        const where = this.buildWhere(filters);
        const rows = await this.prisma.user.findMany({
            where,
            select: { id: true },
            take: Math.min(Math.max(maxIds, 1), 10000),
            orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => r.id);
    }

    /**
     * Get detailed statistics for a filtered segment
     */
    async getSegmentStats(filters: SegmentFilters = {}) {
        const baseWhere = this.buildWhere(filters);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            premiumUsers,
            trialUsers,
            freeUsers,
            activeLast7Days,
            pregnantUsers,
            cycleTrackingUsers,
            novaUsers,
        ] = await Promise.all([
            this.prisma.user.count({ where: baseWhere }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, { subscription: { status: SubscriptionStatus.ACTIVE } }],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, { subscription: { status: SubscriptionStatus.TRIAL } }],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, this.buildFreeSubscriptionCondition()],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, this.buildRecentActivityCondition(sevenDaysAgo)],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, { pregnancy: { isActive: true } }],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, { periodCycles: { some: { endDate: null } } }],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [baseWhere, { conversations: { some: { messages: { some: {} } } } }],
                },
            }),
        ]);

        return {
            totalUsers,
            premiumUsers,
            trialUsers,
            freeUsers,
            activeLast7Days,
            pregnantUsers,
            cycleTrackingUsers,
            novaUsers,
            filters,
        };
    }

    /**
     * Get predefined segments with consistent activity and subscription definitions
     */
    async getPredefinedSegments() {
        const now = Date.now();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            premiumUsers,
            freeUsers,
            trialUsers,
            churnedUsers,
            activeUsers,
            inactiveUsers,
            pregnantUsers,
            cycleTrackingUsers,
            novaEngagedUsers,
            noCycleUsers,
            newUsers,
        ] = await Promise.all([
            this.prisma.user.count({
                where: { status: UserStatus.ACTIVE },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    subscription: { status: SubscriptionStatus.ACTIVE },
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [
                        { status: UserStatus.ACTIVE },
                        this.buildFreeSubscriptionCondition(),
                    ],
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    subscription: { status: SubscriptionStatus.TRIAL },
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    subscription: {
                        status: { in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED] },
                    },
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [
                        { status: UserStatus.ACTIVE },
                        this.buildRecentActivityCondition(sevenDaysAgo),
                    ],
                },
            }),
            this.prisma.user.count({
                where: {
                    AND: [
                        { status: UserStatus.ACTIVE },
                        { NOT: this.buildRecentActivityCondition(thirtyDaysAgo) },
                    ],
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    pregnancy: { isActive: true },
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    periodCycles: { some: { endDate: null } },
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    conversations: { some: { messages: { some: {} } } },
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    periodCycles: { none: {} },
                },
            }),
            this.prisma.user.count({
                where: {
                    status: UserStatus.ACTIVE,
                    createdAt: { gte: sevenDaysAgo },
                },
            }),
        ]);

        return {
            totalUsers,
            premiumUsers,
            freeUsers,
            trialUsers,
            churnedUsers,
            activeUsers,
            inactiveUsers,
            pregnantUsers,
            cycleTrackingUsers,
            novaEngagedUsers,
            noCycleUsers,
            newUsers,
        };
    }
}
