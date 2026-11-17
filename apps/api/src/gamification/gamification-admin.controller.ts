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
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { AchievementCategory, AchievementRarity } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from './gamification.service';
import { AchievementService } from './achievement.service';
import { InsightService } from './insight.service';

@Controller('gamification/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class GamificationAdminController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly gamificationService: GamificationService,
        private readonly achievementService: AchievementService,
        private readonly insightService: InsightService,
    ) { }

    @Get('overview')
    async getOverview() {
        const [
            totalAchievements,
            activeAchievements,
            totalUnlocks,
            totalInsights,
            unreadInsights,
            gamificationAgg,
            topUsers,
        ] = await Promise.all([
            this.prisma.achievement.count(),
            this.prisma.achievement.count({ where: { isActive: true } }),
            this.prisma.userAchievement.count({ where: { isCompleted: true } }),
            this.prisma.userInsight.count(),
            this.prisma.userInsight.count({ where: { isRead: false } }),
            this.prisma.userGamification.aggregate({
                _count: true,
                _avg: { level: true, totalXp: true, currentStreak: true },
                _max: { longestStreak: true, level: true, totalXp: true },
            }),
            this.prisma.userGamification.findMany({
                take: 5,
                orderBy: [{ totalXp: 'desc' }, { level: 'desc' }],
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            profile: { select: { firstName: true, lastName: true, displayName: true } },
                        },
                    },
                },
            }),
        ]);

        return {
            totalAchievements,
            activeAchievements,
            totalUnlocks,
            totalInsights,
            unreadInsights,
            readRate:
                totalInsights > 0
                    ? Math.round(((totalInsights - unreadInsights) / totalInsights) * 100)
                    : 0,
            totalGamifiedUsers: gamificationAgg._count,
            avgLevel: Number((gamificationAgg._avg.level || 1).toFixed(1)),
            avgXp: Math.round(gamificationAgg._avg.totalXp || 0),
            maxStreak: gamificationAgg._max.longestStreak || 0,
            maxLevel: gamificationAgg._max.level || 1,
            topUsers,
        };
    }

    // ==================== ACHIEVEMENTS / BADGES ====================

    @Get('achievements')
    async listAchievements(
        @Query('category') category?: string,
        @Query('rarity') rarity?: string,
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
    ) {
        const where: any = {};
        if (category && category !== 'ALL') where.category = category as AchievementCategory;
        if (rarity && rarity !== 'ALL') where.rarity = rarity as AchievementRarity;
        if (isActive === 'true') where.isActive = true;
        if (isActive === 'false') where.isActive = false;
        if (search?.trim()) {
            where.OR = [
                { key: { contains: search.trim(), mode: 'insensitive' } },
                { nameTr: { contains: search.trim(), mode: 'insensitive' } },
                { descriptionTr: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

        const items = await this.prisma.achievement.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
            include: {
                _count: {
                    select: {
                        userAchievements: {
                            where: { isCompleted: true },
                        },
                    },
                },
            },
        });

        return {
            data: items.map((item) => ({
                ...item,
                earnedCount: item._count?.userAchievements || 0,
            })),
            total: items.length,
        };
    }

    @Post('achievements')
    async createAchievement(@Body() body: any) {
        const key = (body.key || '').trim().toLowerCase().replace(/\s+/g, '_');
        if (!key || !body.nameTr || !body.descriptionTr) {
            throw new BadRequestException('key, nameTr ve descriptionTr alanları zorunludur');
        }

        const existing = await this.prisma.achievement.findUnique({ where: { key } });
        if (existing) {
            throw new BadRequestException(`"${key}" anahtarına sahip rozet zaten mevcut`);
        }

        const reqType = body.requirementType || body.requirementJson?.type || 'data_entry';
        const reqValue = Number(
            body.requirementValue ??
            body.requirementJson?.count ??
            body.requirementJson?.days ??
            body.requirementJson?.level ??
            1,
        );

        const requirementJson =
            body.requirementJson && typeof body.requirementJson === 'object'
                ? body.requirementJson
                : reqType === 'streak'
                    ? { type: 'streak', days: reqValue }
                    : reqType === 'level'
                        ? { type: 'level', level: reqValue }
                        : { type: reqType, count: reqValue };

        return this.prisma.achievement.create({
            data: {
                key,
                nameTr: body.nameTr.trim(),
                nameEn: (body.nameEn || body.nameTr).trim(),
                descriptionTr: body.descriptionTr.trim(),
                descriptionEn: (body.descriptionEn || body.descriptionTr).trim(),
                iconEmoji: body.iconEmoji || '🏆',
                iconUrl: body.iconUrl || null,
                color: body.color || '#8B5CF6',
                category: (body.category || 'SPECIAL') as AchievementCategory,
                rarity: (body.rarity || 'COMMON') as AchievementRarity,
                requirementJson,
                points: Number(body.points ?? 50),
                isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
                sortOrder: Number(body.sortOrder ?? 0),
            },
        });
    }

    @Patch('achievements/:id')
    async updateAchievement(@Param('id') id: string, @Body() body: any) {
        const existing = await this.prisma.achievement.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Rozet bulunamadı');
        }

        const data: any = {};
        if (body.key !== undefined) data.key = String(body.key).trim().toLowerCase();
        if (body.nameTr !== undefined) data.nameTr = String(body.nameTr).trim();
        if (body.nameEn !== undefined) data.nameEn = String(body.nameEn).trim();
        if (body.descriptionTr !== undefined) data.descriptionTr = String(body.descriptionTr).trim();
        if (body.descriptionEn !== undefined) data.descriptionEn = String(body.descriptionEn).trim();
        if (body.iconEmoji !== undefined) data.iconEmoji = body.iconEmoji;
        if (body.iconUrl !== undefined) data.iconUrl = body.iconUrl;
        if (body.color !== undefined) data.color = body.color;
        if (body.category !== undefined) data.category = body.category as AchievementCategory;
        if (body.rarity !== undefined) data.rarity = body.rarity as AchievementRarity;
        if (body.points !== undefined) data.points = Number(body.points);
        if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
        if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

        if (body.requirementType !== undefined || body.requirementJson !== undefined) {
            const reqType = body.requirementType || body.requirementJson?.type;
            const reqValue = Number(
                body.requirementValue ??
                body.requirementJson?.count ??
                body.requirementJson?.days ??
                body.requirementJson?.level ??
                1,
            );
            data.requirementJson =
                body.requirementJson && typeof body.requirementJson === 'object'
                    ? body.requirementJson
                    : reqType === 'streak'
                        ? { type: 'streak', days: reqValue }
                        : reqType === 'level'
                            ? { type: 'level', level: reqValue }
                            : { type: reqType, count: reqValue };
        }

        return this.prisma.achievement.update({ where: { id }, data });
    }

    @Delete('achievements/:id')
    async deleteAchievement(@Param('id') id: string) {
        const existing = await this.prisma.achievement.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('Rozet bulunamadı');
        }
        await this.prisma.achievement.delete({ where: { id } });
        return { success: true };
    }

    @Post('achievements/seed')
    async seedDefaultAchievements() {
        const items = await this.achievementService.seedAchievements();
        return { success: true, count: items.length };
    }

    @Post('achievements/:id/award')
    async awardAchievementToUser(
        @Param('id') achievementId: string,
        @Body() body: { userId: string },
    ) {
        if (!body?.userId) {
            throw new BadRequestException('userId zorunludur');
        }

        const [achievement, user] = await Promise.all([
            this.prisma.achievement.findUnique({ where: { id: achievementId } }),
            this.prisma.user.findUnique({ where: { id: body.userId } }),
        ]);

        if (!achievement) throw new NotFoundException('Rozet bulunamadı');
        if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

        const existing = await this.prisma.userAchievement.findUnique({
            where: { userId_achievementId: { userId: body.userId, achievementId } },
        });

        if (existing?.isCompleted) {
            return { success: true, alreadyAwarded: true, userAchievement: existing };
        }

        const req: any = achievement.requirementJson || {};
        const target = Number(req.count || req.days || req.level || 1);

        const userAchievement = await this.prisma.userAchievement.upsert({
            where: { userId_achievementId: { userId: body.userId, achievementId } },
            update: {
                progress: target,
                isCompleted: true,
                completedAt: new Date(),
            },
            create: {
                userId: body.userId,
                achievementId,
                progress: target,
                isCompleted: true,
                completedAt: new Date(),
            },
        });

        await this.gamificationService.addXp(body.userId, achievement.points);

        return { success: true, alreadyAwarded: false, userAchievement };
    }

    // ==================== INSIGHTS ====================

    @Get('insights')
    async listInsights(
        @Query('category') category?: string,
        @Query('type') type?: string,
        @Query('isRead') isRead?: string,
        @Query('userId') userId?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        const where: any = {};
        if (category && category !== 'ALL') where.category = category;
        if (type && type !== 'ALL') where.type = type;
        if (isRead === 'true') where.isRead = true;
        if (isRead === 'false') where.isRead = false;
        if (userId) where.userId = userId;
        if (search?.trim()) {
            where.OR = [
                { titleTr: { contains: search.trim(), mode: 'insensitive' } },
                { messageTr: { contains: search.trim(), mode: 'insensitive' } },
                { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
            ];
        }

        const take = Math.min(Number(limit || 100), 200);
        const items = await this.prisma.userInsight.findMany({
            where,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        profile: { select: { firstName: true, lastName: true, displayName: true } },
                    },
                },
            },
        });

        return { data: items, total: items.length };
    }

    @Post('insights')
    async createInsight(@Body() body: any) {
        if (!body?.titleTr || !body?.messageTr) {
            throw new BadRequestException('titleTr ve messageTr zorunludur');
        }

        const target: 'user' | 'all' | 'premium' | 'free' = body.target || (body.userId ? 'user' : 'all');
        const expiresInDays = Number(body.expiresInDays ?? 14);
        const expiresAt =
            expiresInDays > 0
                ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                : null;

        let targetUserIds: string[] = [];

        if (target === 'user') {
            if (!body.userId) {
                throw new BadRequestException('Hedef kullanıcı seçilmelidir');
            }
            targetUserIds = [body.userId];
        } else {
            const whereUser: any = { status: 'ACTIVE' };
            if (target === 'premium') {
                whereUser.subscription = { status: 'ACTIVE' };
            } else if (target === 'free') {
                whereUser.OR = [
                    { subscription: { is: null } },
                    { subscription: { status: { not: 'ACTIVE' } } },
                ];
            }
            const users = await this.prisma.user.findMany({
                where: whereUser,
                select: { id: true },
            });
            targetUserIds = users.map((u) => u.id);
        }

        if (targetUserIds.length === 0) {
            throw new BadRequestException('Hedef kitlede aktif kullanıcı bulunamadı');
        }

        const created = await this.prisma.userInsight.createMany({
            data: targetUserIds.map((uid) => ({
                userId: uid,
                titleTr: body.titleTr.trim(),
                titleEn: (body.titleEn || body.titleTr).trim(),
                messageTr: body.messageTr.trim(),
                messageEn: (body.messageEn || body.messageTr).trim(),
                type: body.type || 'tip',
                category: body.category || 'wellness',
                dataJson: { adminCreated: true, target },
                expiresAt,
            })),
        });

        return { success: true, count: created.count };
    }

    @Patch('insights/:id')
    async updateInsight(@Param('id') id: string, @Body() body: any) {
        const existing = await this.prisma.userInsight.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('İçgörü bulunamadı');

        const data: any = {};
        if (body.titleTr !== undefined) data.titleTr = String(body.titleTr).trim();
        if (body.titleEn !== undefined) data.titleEn = body.titleEn ? String(body.titleEn).trim() : null;
        if (body.messageTr !== undefined) data.messageTr = String(body.messageTr).trim();
        if (body.messageEn !== undefined) data.messageEn = body.messageEn ? String(body.messageEn).trim() : null;
        if (body.type !== undefined) data.type = body.type;
        if (body.category !== undefined) data.category = body.category;
        if (body.isRead !== undefined) {
            data.isRead = Boolean(body.isRead);
            data.readAt = body.isRead ? new Date() : null;
        }
        if (body.expiresAt !== undefined) {
            data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
        }

        return this.prisma.userInsight.update({ where: { id }, data });
    }

    @Delete('insights/:id')
    async deleteInsight(@Param('id') id: string) {
        const existing = await this.prisma.userInsight.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('İçgörü bulunamadı');
        await this.prisma.userInsight.delete({ where: { id } });
        return { success: true };
    }

    // ==================== USER PROGRESS MANAGEMENT ====================

    @Get('users')
    async listUserProgress(@Query('search') search?: string) {
        const where: any = {};
        if (search?.trim()) {
            where.OR = [
                { email: { contains: search.trim(), mode: 'insensitive' } },
                { username: { contains: search.trim(), mode: 'insensitive' } },
                { profile: { displayName: { contains: search.trim(), mode: 'insensitive' } } },
            ];
        }

        const users = await this.prisma.user.findMany({
            where,
            take: 100,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                username: true,
                profile: { select: { firstName: true, lastName: true, displayName: true } },
                subscription: { select: { status: true } },
                gamification: true,
                _count: {
                    select: {
                        userAchievements: { where: { isCompleted: true } },
                        insights: true,
                    },
                },
            },
        });

        return {
            data: users.map((u) => ({
                userId: u.id,
                email: u.email,
                username: u.username,
                displayName:
                    u.profile?.firstName && u.profile?.lastName
                        ? `${u.profile.firstName} ${u.profile.lastName}`
                        : u.profile?.displayName || u.username || u.email.split('@')[0],
                isPremium: u.subscription?.status === 'ACTIVE',
                level: u.gamification?.level ?? 1,
                totalXp: u.gamification?.totalXp ?? 0,
                currentStreak: u.gamification?.currentStreak ?? 0,
                longestStreak: u.gamification?.longestStreak ?? 0,
                streakFreezeLimit: u.gamification?.streakFreezeLimit ?? 1,
                totalDataEntries: u.gamification?.totalDataEntries ?? 0,
                completedBadges: u._count.userAchievements,
                insightsCount: u._count.insights,
            })),
            total: users.length,
        };
    }

    @Patch('users/:userId')
    async updateUserProgress(@Param('userId') userId: string, @Body() body: any) {
        await this.gamificationService.getUserGamification(userId);

        if (body.addXp) {
            await this.gamificationService.addXp(userId, Number(body.addXp));
        }

        const updateData: any = {};
        if (body.currentStreak !== undefined) updateData.currentStreak = Number(body.currentStreak);
        if (body.longestStreak !== undefined) updateData.longestStreak = Number(body.longestStreak);
        if (body.streakFreezeLimit !== undefined) updateData.streakFreezeLimit = Number(body.streakFreezeLimit);

        if (Object.keys(updateData).length > 0) {
            await this.prisma.userGamification.update({
                where: { userId },
                data: updateData,
            });
        }

        if (body.recheckAchievements) {
            await this.achievementService.checkAchievements(userId);
        }
        if (body.generateInsights) {
            await this.insightService.generateInsights(userId);
        }

        return this.gamificationService.getUserStats(userId);
    }
}
