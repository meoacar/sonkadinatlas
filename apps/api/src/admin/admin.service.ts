import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PushService } from '../reminders/push.service';
import { Prisma, UserStatus, SubscriptionStatus } from '@prisma/client';

export interface DashboardStats {
    users: {
        total: number;
        active: number;
        new: number;
        growth: number;
    };
    subscriptions: {
        total: number;
        active: number;
        revenue: number;
        growth: number;
    };
    engagement: {
        dailyActive: number;
        weeklyActive: number;
        monthlyActive: number;
        avgSessionTime: number;
    };
    content: {
        questions: number;
        answers: number;
        articles: number;
        conversations: number;
    };
}

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }>;
}

export interface BulkOperationResult {
    success: number;
    failed: number;
    errors: string[];
}

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private pushService: PushService,
    ) { }

    /**
     * Dashboard Statistics with Charts
     */
    async getDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const start = startDate || thirtyDaysAgo;
        const end = endDate || now;

        // User stats - using updatedAt as proxy for activity since lastLoginAt doesn't exist
        const [totalUsers, activeUsers, newUsers, previousPeriodUsers] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({
                where: {
                    updatedAt: { gte: start },
                },
            }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            this.prisma.user.count({
                where: {
                    createdAt: { gte: sixtyDaysAgo, lt: start },
                },
            }),
        ]);

        const userGrowth = previousPeriodUsers > 0
            ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100
            : 0;

        // Subscription stats
        const [totalSubs, activeSubs, previousPeriodSubs] = await Promise.all([
            this.prisma.subscription.count(),
            this.prisma.subscription.count({
                where: {
                    status: SubscriptionStatus.ACTIVE,
                },
            }),
            this.prisma.subscription.count({
                where: {
                    createdAt: { gte: sixtyDaysAgo, lt: start },
                    status: SubscriptionStatus.ACTIVE,
                },
            }),
        ]);

        // Calculate revenue from active subscriptions based on tier
        const activeSubscriptions = await this.prisma.subscription.findMany({
            where: { status: SubscriptionStatus.ACTIVE },
            select: { tier: true },
        });

        const tierPrices: Record<string, number> = {
            FREE: 0,
            MONTHLY: 99,
            YEARLY: 83,
            PREMIUM: 99,
            PREMIUM_PLUS: 199,
        };
        const revenue = activeSubscriptions.reduce((sum, sub) => {
            return sum + (tierPrices[sub.tier || 'FREE'] || 0);
        }, 0);

        // Calculate subscription growth
        const currentPeriodNewSubs = await this.prisma.subscription.count({
            where: {
                createdAt: { gte: start, lte: end },
                status: SubscriptionStatus.ACTIVE,
            },
        });
        const subscriptionGrowth = previousPeriodSubs > 0
            ? ((currentPeriodNewSubs - previousPeriodSubs) / previousPeriodSubs) * 100
            : 0;

        // Engagement stats - using message activity as proxy for session time
        const [dailyActive, weeklyActive, monthlyActive] = await Promise.all([
            this.prisma.user.count({
                where: {
                    updatedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.user.count({
                where: {
                    updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.user.count({
                where: {
                    updatedAt: { gte: thirtyDaysAgo },
                },
            }),
        ]);

        // Calculate average session time from conversation activity
        const recentConversations = await this.prisma.conversation.findMany({
            where: {
                createdAt: { gte: start },
            },
            include: {
                messages: {
                    select: {
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        let totalSessionTime = 0;
        let sessionCount = 0;

        for (const conv of recentConversations) {
            if (conv.messages.length >= 2) {
                const firstMsg = conv.messages[0];
                const lastMsg = conv.messages[conv.messages.length - 1];
                const sessionDuration = lastMsg.createdAt.getTime() - firstMsg.createdAt.getTime();
                // Only count sessions between 1 minute and 2 hours
                if (sessionDuration >= 60000 && sessionDuration <= 7200000) {
                    totalSessionTime += sessionDuration;
                    sessionCount++;
                }
            }
        }

        const avgSessionTime = sessionCount > 0
            ? Math.round(totalSessionTime / sessionCount / 1000) // Convert to seconds
            : 0;

        // Content stats
        const [questions, answers, articles, conversations] = await Promise.all([
            this.prisma.question.count(),
            this.prisma.answer.count(),
            this.prisma.educationalArticle.count(),
            this.prisma.conversation.count(),
        ]);

        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                new: newUsers,
                growth: userGrowth,
            },
            subscriptions: {
                total: totalSubs,
                active: activeSubs,
                revenue,
                growth: subscriptionGrowth,
            },
            engagement: {
                dailyActive,
                weeklyActive,
                monthlyActive,
                avgSessionTime,
            },
            content: {
                questions,
                answers,
                articles,
                conversations,
            },
        };
    }

    /**
     * User Growth Chart Data
     */
    async getUserGrowthChart(days: number = 30): Promise<ChartData> {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const users = await this.prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: startDate },
            },
            _count: true,
        });

        // Group by day
        const dailyCounts = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dailyCounts.set(dateStr, 0);
        }

        users.forEach((user) => {
            const dateStr = user.createdAt.toISOString().split('T')[0];
            dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + user._count);
        });

        return {
            labels: Array.from(dailyCounts.keys()),
            datasets: [
                {
                    label: 'New Users',
                    data: Array.from(dailyCounts.values()),
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: 'rgb(99, 102, 241)',
                },
            ],
        };
    }

    /**
     * Revenue Chart Data
     */
    async getRevenueChart(days: number = 30): Promise<ChartData> {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const subscriptions = await this.prisma.subscription.findMany({
            where: {
                createdAt: { gte: startDate },
                status: SubscriptionStatus.ACTIVE,
            },
            select: {
                createdAt: true,
                tier: true,
            },
        });

        // Group by day
        const dailyRevenue = new Map<string, number>();
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            dailyRevenue.set(dateStr, 0);
        }

        const tierPrices: Record<string, number> = {
            FREE: 0,
            MONTHLY: 99,
            YEARLY: 999,
            PREMIUM: 99,
            PREMIUM_PLUS: 199,
        };
        subscriptions.forEach((sub) => {
            const dateStr = sub.createdAt.toISOString().split('T')[0];
            const price = tierPrices[sub.tier || 'FREE'] || 0;
            dailyRevenue.set(dateStr, (dailyRevenue.get(dateStr) || 0) + price);
        });

        return {
            labels: Array.from(dailyRevenue.keys()),
            datasets: [
                {
                    label: 'Revenue',
                    data: Array.from(dailyRevenue.values()),
                    backgroundColor: 'rgba(34, 197, 94, 0.5)',
                    borderColor: 'rgb(34, 197, 94)',
                },
            ],
        };
    }

    /**
     * Bulk Operations
     */
    async bulkUpdateUsers(
        userIds: string[],
        data: { status?: UserStatus; pinEnabled?: boolean },
    ): Promise<BulkOperationResult> {
        const result: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        for (const userId of userIds) {
            try {
                await this.prisma.user.update({
                    where: { id: userId },
                    data,
                });
                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`User ${userId}: ${error.message}`);
            }
        }

        return result;
    }

    async bulkDeleteUsers(userIds: string[]): Promise<BulkOperationResult> {
        const result: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        for (const userId of userIds) {
            try {
                await this.prisma.user.delete({
                    where: { id: userId },
                });
                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`User ${userId}: ${error.message}`);
            }
        }

        return result;
    }

    async bulkSendNotifications(
        userIds: string[],
        notification: { title: string; body: string },
    ): Promise<BulkOperationResult> {
        const result: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        for (const userId of userIds) {
            try {
                await this.prisma.reminder.create({
                    data: {
                        userId,
                        type: 'CUSTOM',
                        payloadJson: {
                            title: notification.title,
                            body: notification.body,
                            sentAt: new Date().toISOString(),
                            source: 'ADMIN_BULK',
                        },
                        nextRunAt: new Date(),
                        active: true,
                    },
                });
                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`User ${userId}: ${error.message}`);
            }
        }

        return result;
    }

    async bulkSendEmails(
        userIds: string[],
        email: { subject: string; body: string },
    ): Promise<BulkOperationResult> {
        const result: BulkOperationResult = {
            success: 0,
            failed: 0,
            errors: [],
        };

        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u.email]));

        for (const userId of userIds) {
            const recipient = userMap.get(userId);
            if (!recipient) {
                result.failed++;
                result.errors.push(`User ${userId}: E-posta adresi bulunamadı`);
                continue;
            }
            try {
                await this.mailService.sendAdminBroadcastEmail(
                    recipient,
                    email.subject,
                    email.body,
                );
                result.success++;
            } catch (error: any) {
                result.failed++;
                result.errors.push(`${recipient}: ${error.message}`);
            }
        }

        return result;
    }

    /**
     * Advanced Filtering
     */
    async searchUsers(filters: {
        search?: string;
        status?: UserStatus;
        subscriptionStatus?: SubscriptionStatus;
        createdAfter?: Date;
        createdBefore?: Date;
        hasSubscription?: boolean;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        const {
            search,
            status,
            subscriptionStatus,
            createdAfter,
            createdBefore,
            hasSubscription,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filters;

        const andConditions: Prisma.UserWhereInput[] = [];

        // Search in email, username, or profile name
        if (search) {
            andConditions.push({
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    {
                        profile: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                                { displayName: { contains: search, mode: 'insensitive' } },
                            ],
                        },
                    },
                ],
            });
        }

        if (status) {
            andConditions.push({ status });
        }

        if (createdAfter || createdBefore) {
            const createdAtFilter: Prisma.DateTimeFilter = {};
            if (createdAfter) createdAtFilter.gte = createdAfter;
            if (createdBefore) createdAtFilter.lte = createdBefore;
            andConditions.push({ createdAt: createdAtFilter });
        }

        if (hasSubscription !== undefined) {
            if (hasSubscription) {
                andConditions.push({ subscription: { isNot: null } });
            } else {
                andConditions.push({ subscription: null });
            }
        }

        if (subscriptionStatus) {
            if (subscriptionStatus === SubscriptionStatus.FREE) {
                andConditions.push({
                    OR: [{ subscription: { status: SubscriptionStatus.FREE } }, { subscription: null }],
                });
            } else {
                andConditions.push({ subscription: { status: subscriptionStatus } });
            }
        }

        const where: Prisma.UserWhereInput =
            andConditions.length === 1 ? andConditions[0] : andConditions.length > 1 ? { AND: andConditions } : {};

        const skip = (page - 1) * limit;
        const safeSortBy = ['createdAt', 'updatedAt', 'email', 'status'].includes(sortBy)
            ? sortBy
            : 'createdAt';
        const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

        const [users, total, activeCount, suspendedCount, premiumCount, adminCount] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                include: {
                    profile: true,
                    subscription: true,
                    pregnancy: {
                        select: { isActive: true, weekCache: true },
                    },
                    _count: {
                        select: {
                            conversations: true,
                            periodCycles: true,
                            dailyLogs: true,
                            questions: true,
                            answers: true,
                        },
                    },
                },
                orderBy: { [safeSortBy]: safeSortOrder },
            }),
            this.prisma.user.count({ where }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
            this.prisma.user.count({
                where: { status: 'ACTIVE', subscription: { status: 'ACTIVE' } },
            }),
            this.prisma.user.count({ where: { isAdmin: true } }),
        ]);

        // Remove sensitive data
        const usersWithoutSensitive = users.map(({ password, pinHash, ...user }) => user);

        return {
            data: usersWithoutSensitive,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats: {
                active: activeCount,
                suspended: suspendedCount,
                premium: premiumCount,
                admin: adminCount,
            },
        };
    }

    /**
     * User Impersonation
     */
    async impersonateUser(adminId: string, targetUserId: string) {
        // Verify admin - check if user has admin email domain
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { email: true },
        });

        if (!admin) {
            throw new BadRequestException('Admin bulunamadı');
        }

        // Check admin status
        const adminRecord = await this.prisma.user.findUnique({
            where: { id: adminId },
            select: { isAdmin: true, email: true },
        });
        const isAdmin =
            Boolean(adminRecord?.isAdmin) ||
            admin.email.endsWith('@admin.wellnesscompanion.com') ||
            (process.env.ADMIN_EMAILS || '').split(',').includes(admin.email);

        if (!isAdmin) {
            throw new BadRequestException('Admin yetkisi gerekli');
        }

        // Get target user
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                profile: true,
                subscription: true,
            },
        });

        if (!targetUser) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }

        // Log impersonation for audit
        await this.prisma.auditLog.create({
            data: {
                userId: adminId,
                action: 'USER_IMPERSONATION',
                entity: 'User',
                entityId: targetUserId,
                metadataJson: {
                    adminEmail: admin.email,
                    targetEmail: targetUser.email,
                    timestamp: new Date().toISOString(),
                },
            },
        });

        // Remove sensitive data
        const { password, pinHash, ...userWithoutSensitive } = targetUser;

        return {
            user: userWithoutSensitive,
            impersonationToken: this.generateImpersonationToken(adminId, targetUserId, targetUser.email),
        };
    }

    private generateImpersonationToken(adminId: string, targetUserId: string, targetEmail?: string): string {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'dev-secret-key';
        return jwt.sign(
            {
                sub: targetUserId,
                email: targetEmail,
                impersonatedBy: adminId,
            },
            secret,
            { expiresIn: '1h' },
        );
    }

    /**
     * System Health Metrics
     */
    async getSystemHealth() {
        const [
            dbProbe,
            userCount,
            active5Min,
            active15Min,
            errorSummary,
            aiProviders,
            maintenanceFlag,
            openTickets,
            pendingReports,
        ] = await Promise.all([
            this.checkDatabaseHealth(),
            this.prisma.user.count(),
            this.getActiveConnections(5),
            this.getActiveConnections(15),
            this.getErrorSummary(),
            this.prisma.aIProviderConfig.findMany({
                select: { provider: true, isActive: true, displayName: true },
            }),
            this.prisma.featureFlag.findUnique({
                where: { key: 'maintenance_mode' },
                select: { valueJson: true },
            }),
            this.countOpenSupportTickets(),
            this.prisma.contentReport.count({
                where: { status: 'PENDING' },
            }),
        ]);

        const enabledProviders = aiProviders
            .filter((p) => p.isActive)
            .map((p) => String(p.provider));
        const envFallback = Boolean(
            process.env.GOOGLE_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.ANTHROPIC_API_KEY,
        );
        const maintenanceEnabled = Boolean(
            (maintenanceFlag?.valueJson as any)?.enabled,
        );

        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance' = 'healthy';
        if (!dbProbe.connected) {
            overallStatus = 'unhealthy';
        } else if (maintenanceEnabled) {
            overallStatus = 'maintenance';
        } else if (
            errorSummary.rate > 0.05 ||
            (aiProviders.length > 0 && enabledProviders.length === 0 && !envFallback)
        ) {
            overallStatus = 'degraded';
        }

        const mem = process.memoryUsage();

        return {
            status: overallStatus,
            database: {
                connected: dbProbe.connected,
                responseTime: dbProbe.responseTimeMs,
            },
            server: {
                uptimeSeconds: Math.round(process.uptime()),
                memoryUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
                memoryRssMb: Math.round(mem.rss / 1024 / 1024),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development',
            },
            users: {
                total: userCount,
                active: active5Min,
                active15Min,
            },
            ai: {
                totalProviders: aiProviders.length,
                enabledCount: enabledProviders.length,
                enabledProviders,
                envFallback,
            },
            maintenance: {
                enabled: maintenanceEnabled,
            },
            support: {
                openTickets,
                pendingReports,
            },
            errors: {
                rate: errorSummary.rate,
                errorCountLastHour: errorSummary.errorActions,
                requestsLastHour: errorSummary.totalActions,
                threshold: 0.05,
            },
            timestamp: new Date().toISOString(),
        };
    }

    private async checkDatabaseHealth(): Promise<{ connected: boolean; responseTimeMs: number }> {
        const start = Date.now();
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { connected: true, responseTimeMs: Date.now() - start };
        } catch {
            return { connected: false, responseTimeMs: Date.now() - start };
        }
    }

    private async getActiveConnections(minutes = 5): Promise<number> {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        return this.prisma.user.count({
            where: {
                status: 'ACTIVE',
                OR: [
                    { updatedAt: { gte: cutoff } },
                    { dailyLogs: { some: { createdAt: { gte: cutoff } } } },
                    { waterLogs: { some: { createdAt: { gte: cutoff } } } },
                    { periodCycles: { some: { updatedAt: { gte: cutoff } } } },
                    { auditLogs: { some: { createdAt: { gte: cutoff } } } },
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
            },
        });
    }

    private async countOpenSupportTickets(): Promise<number> {
        const rows = await this.prisma.featureFlag.findMany({
            where: { key: { startsWith: 'support_ticket_' } },
            select: { valueJson: true },
        });
        return rows.filter((r) => {
            const st = (r.valueJson as any)?.status;
            return st === 'OPEN' || st === 'IN_PROGRESS';
        }).length;
    }

    private async getErrorSummary(): Promise<{
        totalActions: number;
        errorActions: number;
        rate: number;
    }> {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const [totalActions, errorActions] = await Promise.all([
            this.prisma.auditLog.count({
                where: { createdAt: { gte: oneHourAgo } },
            }),
            this.prisma.auditLog.count({
                where: {
                    createdAt: { gte: oneHourAgo },
                    OR: [
                        { action: { contains: 'ERROR' } },
                        { action: { contains: 'FAIL' } },
                    ],
                },
            }),
        ]);

        return {
            totalActions,
            errorActions,
            rate: totalActions > 0 ? errorActions / totalActions : 0,
        };
    }

    async getUserOverview360(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                subscription: true,
                _count: {
                    select: {
                        periodCycles: true,
                        dailyLogs: true,
                        waterLogs: true,
                        sleepLogs: true,
                        stepsLogs: true,
                        conversations: true,
                        questions: true,
                        answers: true,
                        reminders: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const [recentCycles, ticketFlags] = await Promise.all([
            this.prisma.periodCycle.findMany({
                where: { userId },
                orderBy: { startDate: 'desc' },
                take: 3,
            }),
            this.prisma.featureFlag.findMany({
                where: { key: { startsWith: 'support_ticket_' } },
            }),
        ]);

        const userTickets = ticketFlags
            .map((f) => f.valueJson as any)
            .filter((t) => t && t.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const prefs = ((user.profile?.preferencesJson as Record<string, any>) || {});
        const { password: _p, pinHash: _ph, ...safeUser } = user;

        return {
            user: safeUser,
            hasPushToken: Boolean(prefs.pushToken),
            partnerConnected: Boolean(prefs.partnerLink),
            recentCycles,
            supportTickets: userTickets,
        };
    }

    async sendDirectPushToUser(userId: string, title: string, body: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });
        if (!user) {
            throw new NotFoundException('Kullanıcı bulunamadı.');
        }

        const receipt = await this.pushService.sendPush(userId, {
            to: '',
            sound: 'default',
            title: title.trim(),
            body: body.trim(),
            data: { type: 'ADMIN_DIRECT', screen: 'home' },
        });

        return {
            userId,
            email: user.email,
            receipt,
        };
    }
}
