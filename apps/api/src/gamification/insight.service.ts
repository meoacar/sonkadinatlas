import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from './gamification.service';

@Injectable()
export class InsightService {
    constructor(
        private prisma: PrismaService,
        private gamificationService: GamificationService,
    ) { }

    // Generate personalized insights based on live user metrics
    async generateInsights(userId: string) {
        const insights: any[] = [];
        const gamification = await this.gamificationService.getUserGamification(userId);
        const profile = await this.prisma.profile.findUnique({ where: { userId } });

        // 1. Streak insight
        if (gamification.currentStreak >= 7 && gamification.currentStreak === gamification.longestStreak) {
            insights.push({
                userId,
                titleTr: 'Rekor Seri Devam Ediyor!',
                titleEn: 'Record Streak Active!',
                messageTr: `${gamification.currentStreak} günlük serin tüm zamanların en uzun serisi! Günlük takibin harika gidiyor.`,
                messageEn: `Your ${gamification.currentStreak}-day streak is your longest ever! Keep up the consistency.`,
                type: 'achievement',
                category: 'streak',
                dataJson: { streak: gamification.currentStreak },
            });
        } else if (gamification.currentStreak >= 3) {
            insights.push({
                userId,
                titleTr: `${gamification.currentStreak} Günlük Seri Yakalandı`,
                titleEn: `${gamification.currentStreak}-Day Streak Going`,
                messageTr: `Son ${gamification.currentStreak} gündür düzenli kayıt tutuyorsun. 7 günlük İlk Hafta rozetine çok yakınsın!`,
                messageEn: `You logged consistently for ${gamification.currentStreak} days. Keep going toward the 7-day badge!`,
                type: 'positive',
                category: 'streak',
                dataJson: { streak: gamification.currentStreak },
            });
        }

        // 2. Cycle & Prediction insight from recent PeriodCycle records
        const recentCycles = await this.prisma.periodCycle.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
            take: 4,
        });
        if (recentCycles.length > 0) {
            let avgCycleDays = 28;
            if (recentCycles.length >= 2) {
                const diffs: number[] = [];
                for (let i = 0; i < recentCycles.length - 1; i++) {
                    const diffDays = Math.round(
                        (new Date(recentCycles[i].startDate).getTime() -
                            new Date(recentCycles[i + 1].startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                    );
                    if (diffDays >= 18 && diffDays <= 45) diffs.push(diffDays);
                }
                if (diffs.length > 0) {
                    avgCycleDays = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
                }
            }
            const nextPeriodStart = new Date(recentCycles[0].startDate);
            nextPeriodStart.setDate(nextPeriodStart.getDate() + avgCycleDays);
            const daysToNext = Math.ceil(
                (nextPeriodStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            if (daysToNext >= 0 && daysToNext <= 7) {
                insights.push({
                    userId,
                    titleTr: 'Döngü Yaklaşıyor',
                    titleEn: 'Cycle Approaching',
                    messageTr: `Tahminlere göre sonraki adet dönemin yaklaşık ${daysToNext === 0 ? 'bugün' : `${daysToNext} gün içinde`} başlayabilir. Su tüketimini ve dinlenmeyi artırmak PMS semptomlarını hafifletebilir.`,
                    messageEn: `Your next period is estimated in ${daysToNext} days. Staying hydrated and resting can help ease PMS symptoms.`,
                    type: 'tip',
                    category: 'cycle',
                    dataJson: { daysToNext, avgCycleDays, nextPeriodStart },
                });
            }
        }

        // 3. Recent Daily Logs & Symptom comparison
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [recentLogs, previousMonthLogs] = await Promise.all([
            this.prisma.dailyLog.findMany({
                where: { userId, date: { gte: thirtyDaysAgo } },
                orderBy: { date: 'desc' },
                take: 30,
            }),
            this.prisma.dailyLog.findMany({
                where: {
                    userId,
                    date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
                },
            }),
        ]);

        const symptomsCount = recentLogs.reduce((acc, log) => acc + log.symptoms.length, 0);
        const previousSymptomsCount = previousMonthLogs.reduce((acc, log) => acc + log.symptoms.length, 0);

        if (symptomsCount < previousSymptomsCount && previousSymptomsCount > 0) {
            const reduction = Math.round(((previousSymptomsCount - symptomsCount) / previousSymptomsCount) * 100);
            insights.push({
                userId,
                titleTr: `Semptomlarda %${reduction} Azalma`,
                titleEn: `${reduction}% Fewer Symptoms`,
                messageTr: `Geçen aya göre %${reduction} daha az semptom kaydettin. Düzenli uyku ve su rutininin olumlu etkisini sürdür!`,
                messageEn: `You experienced ${reduction}% fewer symptoms compared to last month!`,
                type: 'positive',
                category: 'symptoms',
                dataJson: { reduction, current: symptomsCount, previous: previousSymptomsCount },
            });
        } else if (symptomsCount > 0) {
            const freq: Record<string, number> = {};
            recentLogs.forEach((l) => l.symptoms.forEach((s) => { freq[s] = (freq[s] || 0) + 1; }));
            const topSymptom = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
            if (topSymptom) {
                insights.push({
                    userId,
                    titleTr: 'En Sık Görülen Semptom Analizi',
                    titleEn: 'Top Symptom Pattern',
                    messageTr: `Son 30 günde en sık kaydettiğin semptom "${topSymptom[0]}" (${topSymptom[1]} kez). Takvimdeki belirti örüntülerini NOVA ile yorumlayabilirsin.`,
                    messageEn: `Your most logged symptom in the last 30 days is "${topSymptom[0]}" (${topSymptom[1]} times).`,
                    type: 'neutral',
                    category: 'symptoms',
                    dataJson: { symptom: topSymptom[0], count: topSymptom[1] },
                });
            }
        }

        // 4. Mood insights
        const moodLogs = recentLogs.filter((log) => log.mood.length > 0);
        if (moodLogs.length >= 3) {
            const positiveMoods = ['happy', 'energetic', 'calm', 'confident', 'mutlu', 'enerjik', 'sakin', 'iyi'];
            const positiveCount = moodLogs.filter((log) =>
                log.mood.some((m) => positiveMoods.includes(m.toLowerCase())),
            ).length;
            const positivePercentage = Math.round((positiveCount / moodLogs.length) * 100);

            if (positivePercentage >= 60) {
                insights.push({
                    userId,
                    titleTr: 'Pozitif Ruh Hali Trendi',
                    titleEn: 'Positive Mood Trend',
                    messageTr: `Son ${moodLogs.length} ruh hali kaydının %${positivePercentage}'inde kendini dengeli ve pozitif hissettin.`,
                    messageEn: `You felt positive in ${positivePercentage}% of your last ${moodLogs.length} mood logs.`,
                    type: 'positive',
                    category: 'mood',
                    dataJson: { percentage: positivePercentage, days: moodLogs.length },
                });
            }
        }

        // 5. Hydration / Water intake insights
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const waterLogs = await this.prisma.waterLog.findMany({
            where: { userId, loggedAt: { gte: sevenDaysAgo } },
        });

        if (waterLogs.length > 0) {
            const totalWater = waterLogs.reduce((acc, log) => acc + log.amountMl, 0);
            const targetMl = profile?.weightKg ? Math.round(profile.weightKg * 30) : 2000;
            const byDay = new Map<string, number>();
            waterLogs.forEach((w) => {
                const day = w.loggedAt.toISOString().slice(0, 10);
                byDay.set(day, (byDay.get(day) || 0) + w.amountMl);
            });
            const dailyAvg = Math.round(totalWater / Math.max(byDay.size, 1));
            const pct = Math.min(Math.round((dailyAvg / targetMl) * 100), 150);

            insights.push({
                userId,
                titleTr: dailyAvg >= targetMl ? 'Su Hedefinde Şampiyonluk!' : 'Haftalık Hidrasyon Özeti',
                titleEn: dailyAvg >= targetMl ? 'Hydration Goal Reached!' : 'Weekly Hydration Summary',
                messageTr:
                    dailyAvg >= targetMl
                        ? `Bu hafta günlük ortalama ${(dailyAvg / 1000).toFixed(1)} L su içerek ${targetMl} ml hedefini aştın!`
                        : `Bu hafta günlük ortalama ${dailyAvg} ml su içtin (kişisel hedefin ${targetMl} ml — %${pct}). Küçük hatırlatıcılarla hedefini tamamlayabilirsin.`,
                messageEn: `Weekly average water intake is ${dailyAvg} ml vs ${targetMl} ml daily goal.`,
                type: dailyAvg >= targetMl ? 'positive' : 'tip',
                category: 'wellness',
                dataJson: { avgWater: dailyAvg, targetMl, percentage: pct },
            });
        }

        // 6. Fallback welcome/habit tip if no data insights triggered yet
        if (insights.length === 0) {
            insights.push({
                userId,
                titleTr: 'Kişisel Sağlık İçgörülerin Hazır',
                titleEn: 'Your Wellness Insights Are Ready',
                messageTr:
                    'Takvimde semptom, ruh hali veya günlük su tüketimi girdikçe sana özel trend analizleri ve döngü ipuçları burada otomatik olarak oluşacak.',
                messageEn:
                    'As you log symptoms, moods, and daily hydration, personalized trends and cycle tips will appear here.',
                type: 'tip',
                category: 'wellness',
                dataJson: { onboarding: true },
            });
        }

        // Save insights avoiding duplicates in last 7 days
        for (const insight of insights) {
            const existing = await this.prisma.userInsight.findFirst({
                where: {
                    userId,
                    category: insight.category,
                    titleTr: insight.titleTr,
                    createdAt: { gte: sevenDaysAgo },
                },
            });

            if (!existing) {
                await this.prisma.userInsight.create({
                    data: {
                        ...insight,
                        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        }

        return this.getUserInsights(userId, true);
    }

    // Get user insights (optionally auto-seed if empty)
    async getUserInsights(userId: string, includeRead = true) {
        const where: any = {
            userId,
            OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        };

        if (!includeRead) {
            where.isRead = false;
        }

        const existing = await this.prisma.userInsight.findMany({
            where,
            orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        });

        if (existing.length === 0 && includeRead) {
            // Check if user truly has zero non-expired insights before generating
            const totalActive = await this.prisma.userInsight.count({
                where: {
                    userId,
                    OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
                },
            });
            if (totalActive === 0) {
                return this.generateInsights(userId);
            }
        }

        return existing;
    }

    // Mark insight as read
    async markAsRead(insightId: string, userId: string) {
        return this.prisma.userInsight.updateMany({
            where: {
                id: insightId,
                userId,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    // Mark all user insights as read
    async markAllAsRead(userId: string) {
        return this.prisma.userInsight.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
}
