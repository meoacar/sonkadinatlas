import { Injectable, Inject, forwardRef, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from './gamification.service';

@Injectable()
export class AchievementService implements OnModuleInit {
    private readonly logger = new Logger(AchievementService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => GamificationService))
        private gamificationService: GamificationService,
    ) { }

    async onModuleInit() {
        try {
            const count = await this.prisma.achievement.count();
            if (count === 0) {
                const seeded = await this.seedAchievements();
                this.logger.log(`Auto-seeded ${seeded.length} default achievements.`);
            }
        } catch (err) {
            this.logger.warn(`Auto-seed achievements skipped: ${(err as Error).message}`);
        }
    }

    async getLiveMetrics(userId: string) {
        const gamification = await this.gamificationService.getUserGamification(userId);
        const [dailyLogsCount, waterLogsCount, cyclesCount, answersCount, questionsCount] =
            await Promise.all([
                this.prisma.dailyLog.count({ where: { userId } }),
                this.prisma.waterLog.count({ where: { userId } }),
                this.prisma.periodCycle.count({ where: { userId } }),
                this.prisma.answer.count({ where: { userId } }),
                this.prisma.question.count({ where: { userId } }),
            ]);

        const totalDataEntries = Math.max(
            gamification.totalDataEntries,
            dailyLogsCount + waterLogsCount + cyclesCount,
        );
        const totalWellnessLogs = Math.max(gamification.totalWellnessLogs, waterLogsCount);

        return {
            gamification,
            currentStreak: gamification.currentStreak,
            longestStreak: gamification.longestStreak,
            level: gamification.level,
            totalDataEntries,
            totalWellnessLogs,
            totalSymptoms: gamification.totalSymptoms,
            waterLogsCount,
            cyclesCount,
            answersCount,
            questionsCount,
        };
    }

    evaluateProgress(requirement: any, metrics: Awaited<ReturnType<AchievementService['getLiveMetrics']>>) {
        const req = requirement || {};
        let progress = 0;
        let target = 1;

        switch (req.type) {
            case 'streak':
                progress = Math.max(metrics.currentStreak, metrics.longestStreak);
                target = Number(req.days || req.count || 1);
                break;
            case 'data_entry':
                progress = metrics.totalDataEntries;
                target = Number(req.count || 1);
                break;
            case 'level':
                progress = metrics.level;
                target = Number(req.level || req.count || 1);
                break;
            case 'wellness':
                progress = metrics.totalWellnessLogs;
                target = Number(req.count || 1);
                break;
            case 'symptoms':
                progress = metrics.totalSymptoms;
                target = Number(req.count || 1);
                break;
            case 'water_logs':
                progress = metrics.waterLogsCount;
                target = Number(req.count || 1);
                break;
            case 'cycles':
                progress = metrics.cyclesCount;
                target = Number(req.count || 1);
                break;
            case 'community_answers':
                progress = metrics.answersCount;
                target = Number(req.count || 1);
                break;
            case 'community_questions':
                progress = metrics.questionsCount;
                target = Number(req.count || 1);
                break;
            case 'manual':
                progress = 0;
                target = Number(req.count || 1);
                break;
            default:
                progress = metrics.totalDataEntries;
                target = Number(req.count || req.days || req.level || 1);
                break;
        }

        const safeTarget = Math.max(target, 1);
        const isEligible = req.type !== 'manual' && progress >= safeTarget;
        return { progress, target: safeTarget, isEligible };
    }

    // Check and award achievements
    async checkAchievements(userId: string) {
        const metrics = await this.getLiveMetrics(userId);
        const newAchievements: any[] = [];

        const achievements = await this.prisma.achievement.findMany({
            where: { isActive: true },
        });

        for (const achievement of achievements) {
            const { progress, isEligible } = this.evaluateProgress(achievement.requirementJson, metrics);

            const existing = await this.prisma.userAchievement.findUnique({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId: achievement.id,
                    },
                },
            });

            if (!existing) {
                await this.prisma.userAchievement.create({
                    data: {
                        userId,
                        achievementId: achievement.id,
                        progress,
                        isCompleted: isEligible,
                        completedAt: isEligible ? new Date() : null,
                    },
                });

                if (isEligible) {
                    newAchievements.push(achievement);
                    await this.gamificationService.addXp(userId, achievement.points);
                }
            } else {
                const effectiveCompleted = existing.isCompleted || isEligible;
                const shouldUpdate = existing.progress !== progress || (!existing.isCompleted && isEligible);

                if (shouldUpdate) {
                    await this.prisma.userAchievement.update({
                        where: { id: existing.id },
                        data: {
                            progress: existing.isCompleted ? Math.max(existing.progress, progress) : progress,
                            isCompleted: effectiveCompleted,
                            completedAt: isEligible && !existing.isCompleted ? new Date() : existing.completedAt,
                        },
                    });

                    if (isEligible && !existing.isCompleted) {
                        newAchievements.push(achievement);
                        await this.gamificationService.addXp(userId, achievement.points);
                    }
                }
            }
        }

        return newAchievements;
    }

    // Get user achievements - returns ALL active achievements with live progress
    async getUserAchievements(userId: string) {
        await this.checkAchievements(userId);

        const [allAchievements, userAchievements, metrics] = await Promise.all([
            this.prisma.achievement.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            }),
            this.prisma.userAchievement.findMany({
                where: { userId },
            }),
            this.getLiveMetrics(userId),
        ]);

        const userAchievementMap = new Map(
            userAchievements.map((ua) => [ua.achievementId, ua]),
        );

        const result = allAchievements.map((achievement) => {
            const userAchievement = userAchievementMap.get(achievement.id);
            const { progress, target } = this.evaluateProgress(achievement.requirementJson, metrics);

            if (userAchievement) {
                return {
                    ...userAchievement,
                    achievement,
                    progress: userAchievement.isCompleted ? Math.max(userAchievement.progress, target) : progress,
                    target,
                };
            }

            return {
                id: `temp-${achievement.id}`,
                userId,
                achievementId: achievement.id,
                progress,
                target,
                isCompleted: false,
                completedAt: null,
                notificationSent: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                achievement,
            };
        });

        // Sort: completed first, then highest progress %, then sortOrder
        return result.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) {
                return a.isCompleted ? -1 : 1;
            }
            const pctA = Math.min((a.progress / Math.max(a.target, 1)) * 100, 100);
            const pctB = Math.min((b.progress / Math.max(b.target, 1)) * 100, 100);
            if (pctB !== pctA) return pctB - pctA;
            return (a.achievement.sortOrder || 0) - (b.achievement.sortOrder || 0);
        });
    }

    // Get achievement progress
    async getAchievementProgress(userId: string, achievementId: string) {
        const userAchievement = await this.prisma.userAchievement.findUnique({
            where: {
                userId_achievementId: {
                    userId,
                    achievementId,
                },
            },
            include: { achievement: true },
        });

        if (!userAchievement) {
            return null;
        }

        const metrics = await this.getLiveMetrics(userId);
        const { progress, target } = this.evaluateProgress(
            userAchievement.achievement.requirementJson,
            metrics,
        );

        return {
            ...userAchievement,
            progress,
            progressPercentage: target > 0 ? Math.min((progress / target) * 100, 100) : 0,
            target,
        };
    }

    // Seed initial achievements
    async seedAchievements() {
        const achievements: any[] = [
            {
                key: 'first_step',
                nameTr: 'İlk Adım',
                nameEn: 'First Step',
                descriptionTr: 'İlk sağlık veya su takibi kaydını oluştur',
                descriptionEn: 'Log your very first health or water entry',
                iconEmoji: '🌱',
                color: '#10B981',
                category: 'DATA_ENTRY',
                rarity: 'COMMON',
                requirementJson: { type: 'data_entry', count: 1 },
                points: 25,
                sortOrder: 1,
            },
            {
                key: 'first_week',
                nameTr: 'İlk Hafta',
                nameEn: 'First Week',
                descriptionTr: '7 gün üst üste veri girişi yap',
                descriptionEn: 'Log data for 7 consecutive days',
                iconEmoji: '🔥',
                color: '#F59E0B',
                category: 'STREAK',
                rarity: 'COMMON',
                requirementJson: { type: 'streak', days: 7 },
                points: 50,
                sortOrder: 2,
            },
            {
                key: 'loyal_tracker',
                nameTr: 'Sadık Takipçi',
                nameEn: 'Loyal Tracker',
                descriptionTr: '30 gün üst üste veri girişi yap',
                descriptionEn: 'Log data for 30 consecutive days',
                iconEmoji: '⭐',
                color: '#3B82F6',
                category: 'STREAK',
                rarity: 'RARE',
                requirementJson: { type: 'streak', days: 30 },
                points: 200,
                sortOrder: 3,
            },
            {
                key: 'legend_100',
                nameTr: '100 Gün Efsanesi',
                nameEn: '100-Day Legend',
                descriptionTr: '100 gün üst üste veri girişi yap',
                descriptionEn: 'Log data for 100 consecutive days',
                iconEmoji: '💎',
                color: '#8B5CF6',
                category: 'STREAK',
                rarity: 'LEGENDARY',
                requirementJson: { type: 'streak', days: 100 },
                points: 1000,
                sortOrder: 4,
            },
            {
                key: 'hydration_hero',
                nameTr: 'Su Kahramanı',
                nameEn: 'Hydration Hero',
                descriptionTr: '15 kez su tüketimi kaydı ekle',
                descriptionEn: 'Log water intake 15 times',
                iconEmoji: '💧',
                color: '#0EA5E9',
                category: 'WELLNESS',
                rarity: 'COMMON',
                requirementJson: { type: 'water_logs', count: 15 },
                points: 60,
                sortOrder: 5,
            },
            {
                key: 'wellness_warrior',
                nameTr: 'Sağlık Savaşçısı',
                nameEn: 'Wellness Warrior',
                descriptionTr: '30 wellness kaydı oluştur',
                descriptionEn: 'Create 30 wellness logs',
                iconEmoji: '💪',
                color: '#EC4899',
                category: 'WELLNESS',
                rarity: 'RARE',
                requirementJson: { type: 'wellness', count: 30 },
                points: 150,
                sortOrder: 6,
            },
            {
                key: 'data_hunter',
                nameTr: 'Veri Avcısı',
                nameEn: 'Data Hunter',
                descriptionTr: '50 kez veri girişi yap',
                descriptionEn: 'Log data 50 times',
                iconEmoji: '📊',
                color: '#6366F1',
                category: 'DATA_ENTRY',
                rarity: 'COMMON',
                requirementJson: { type: 'data_entry', count: 50 },
                points: 100,
                sortOrder: 7,
            },
            {
                key: 'consistent_tracker',
                nameTr: 'Düzenli Takipçi',
                nameEn: 'Consistent Tracker',
                descriptionTr: '100 kez veri girişi yap',
                descriptionEn: 'Log data 100 times',
                iconEmoji: '🎯',
                color: '#8B5CF6',
                category: 'DATA_ENTRY',
                rarity: 'RARE',
                requirementJson: { type: 'data_entry', count: 100 },
                points: 250,
                sortOrder: 8,
            },
            {
                key: 'year_champion',
                nameTr: 'Yıl Şampiyonu',
                nameEn: 'Year Champion',
                descriptionTr: '365 kez veri girişi yap',
                descriptionEn: 'Log data 365 times',
                iconEmoji: '🏆',
                color: '#F59E0B',
                category: 'DATA_ENTRY',
                rarity: 'LEGENDARY',
                requirementJson: { type: 'data_entry', count: 365 },
                points: 2000,
                sortOrder: 9,
            },
            {
                key: 'symptom_detective',
                nameTr: 'Semptom Dedektifi',
                nameEn: 'Symptom Detective',
                descriptionTr: '50 semptom kaydı tut',
                descriptionEn: 'Log 50 symptoms',
                iconEmoji: '🔍',
                color: '#14B8A6',
                category: 'DATA_ENTRY',
                rarity: 'RARE',
                requirementJson: { type: 'symptoms', count: 50 },
                points: 200,
                sortOrder: 10,
            },
            {
                key: 'community_helper',
                nameTr: 'Topluluk Destekçisi',
                nameEn: 'Community Helper',
                descriptionTr: 'Toplulukta en az 3 cevaba katkı sağla',
                descriptionEn: 'Post at least 3 answers in the community',
                iconEmoji: '🤝',
                color: '#EC4899',
                category: 'COMMUNITY',
                rarity: 'RARE',
                requirementJson: { type: 'community_answers', count: 3 },
                points: 150,
                sortOrder: 11,
            },
            {
                key: 'level_5',
                nameTr: 'Parlayan Yıldız (Sv. 5)',
                nameEn: 'Rising Star (Lv. 5)',
                descriptionTr: '5. seviyeye ulaş',
                descriptionEn: 'Reach level 5',
                iconEmoji: '🌟',
                color: '#F59E0B',
                category: 'MILESTONE',
                rarity: 'COMMON',
                requirementJson: { type: 'level', level: 5 },
                points: 100,
                sortOrder: 12,
            },
            {
                key: 'level_10',
                nameTr: 'Kozmik Usta (Sv. 10)',
                nameEn: 'Cosmic Master (Lv. 10)',
                descriptionTr: '10. seviyeye ulaş',
                descriptionEn: 'Reach level 10',
                iconEmoji: '✨',
                color: '#A855F7',
                category: 'MILESTONE',
                rarity: 'EPIC',
                requirementJson: { type: 'level', level: 10 },
                points: 300,
                sortOrder: 13,
            },
        ];

        for (const achievement of achievements) {
            await this.prisma.achievement.upsert({
                where: { key: achievement.key },
                update: achievement,
                create: achievement,
            });
        }

        return achievements;
    }
}
