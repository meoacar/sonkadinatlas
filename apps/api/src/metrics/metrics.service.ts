import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HealthMetricKind } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserMetrics(userId: string, limit = 50) {
    return this.prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });
  }

  async saveMetric(
    userId: string,
    data: {
      kind: HealthMetricKind;
      valueJson: any;
      measuredAt?: Date;
    },
  ) {
    return this.prisma.healthMetric.create({
      data: {
        userId,
        kind: data.kind,
        valueJson: data.valueJson,
        measuredAt: data.measuredAt || new Date(),
      },
    });
  }

  async getHealthReport(userId: string, daysInput = 30) {
    const days = Math.min(180, Math.max(7, Number(daysInput) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const cycleSince = new Date();
    cycleSince.setDate(cycleSince.getDate() - 180);

    const [user, cycles, dailyLogs, waterLogs, sleepLogs, stepsLogs, meditationSessions, latestBmi] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true },
        }),
        this.prisma.periodCycle.findMany({
          where: { userId, startDate: { gte: cycleSince } },
          orderBy: { startDate: 'desc' },
        }),
        this.prisma.dailyLog.findMany({
          where: { userId, date: { gte: since } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.waterLog.findMany({
          where: { userId, loggedAt: { gte: since } },
          orderBy: { loggedAt: 'desc' },
        }),
        this.prisma.sleepLog.findMany({
          where: { userId, sleepDate: { gte: since } },
          orderBy: { sleepDate: 'desc' },
        }),
        this.prisma.dailySteps.findMany({
          where: { userId, date: { gte: since } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.meditationSession.findMany({
          where: { userId, date: { gte: since } },
          orderBy: { date: 'desc' },
        }),
        this.prisma.healthMetric.findFirst({
          where: { userId, kind: 'BMI' },
          orderBy: { measuredAt: 'desc' },
        }),
      ]);

    // Cycle stats
    const cycleLengths: number[] = [];
    for (let i = 0; i < cycles.length - 1; i++) {
      const curr = new Date(cycles[i].startDate).getTime();
      const prev = new Date(cycles[i + 1].startDate).getTime();
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff >= 15 && diff <= 60) {
        cycleLengths.push(diff);
      }
    }

    const periodDurations = cycles
      .filter((c) => c.endDate)
      .map((c) => {
        const start = new Date(c.startDate).getTime();
        const end = new Date(c.endDate!).getTime();
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
      })
      .filter((d) => d <= 15);

    const avgCycleLength =
      cycleLengths.length > 0
        ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
        : null;
    const avgPeriodDuration =
      periodDurations.length > 0
        ? Math.round(periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length)
        : null;

    // Symptoms & mood distribution
    const symptomCounts = new Map<string, number>();
    const moodCounts = new Map<string, number>();
    let crampsTotal = 0;
    let crampsCount = 0;

    for (const log of dailyLogs) {
      for (const s of log.symptoms || []) {
        symptomCounts.set(s, (symptomCounts.get(s) || 0) + 1);
      }
      for (const m of log.mood || []) {
        moodCounts.set(m, (moodCounts.get(m) || 0) + 1);
      }
      if (typeof log.cramps === 'number') {
        crampsTotal += log.cramps;
        crampsCount += 1;
      }
    }

    const topSymptoms = Array.from(symptomCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const topMoods = Array.from(moodCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Water summary grouped by day
    const waterTargetMl = user?.profile?.weightKg
      ? Math.round(user.profile.weightKg * 30)
      : 2000;
    const waterByDay = new Map<string, number>();
    for (const w of waterLogs) {
      const key = new Date(w.loggedAt).toISOString().split('T')[0];
      waterByDay.set(key, (waterByDay.get(key) || 0) + w.amountMl);
    }
    const waterDaysLogged = waterByDay.size;
    const avgDailyWaterMl =
      waterDaysLogged > 0
        ? Math.round(Array.from(waterByDay.values()).reduce((a, b) => a + b, 0) / waterDaysLogged)
        : 0;
    const waterGoalMetDays = Array.from(waterByDay.values()).filter(
      (ml) => ml >= waterTargetMl,
    ).length;

    // Sleep summary
    const avgSleepHours =
      sleepLogs.length > 0
        ? Math.round(
            (sleepLogs.reduce((sum, s) => sum + s.durationMin, 0) / sleepLogs.length / 60) * 10,
          ) / 10
        : 0;

    // Steps summary
    const avgDailySteps =
      stepsLogs.length > 0
        ? Math.round(stepsLogs.reduce((sum, s) => sum + s.count, 0) / stepsLogs.length)
        : 0;

    // Meditation summary
    const totalMeditationMin = meditationSessions.reduce((sum, s) => sum + s.durationMin, 0);

    const displayName =
      user?.profile?.displayName ||
      user?.profile?.firstName ||
      user?.email?.split('@')[0] ||
      'Kullanıcı';

    const report = {
      periodDays: days,
      generatedAt: new Date().toISOString(),
      profile: {
        displayName,
        heightCm: user?.profile?.heightCm ?? null,
        weightKg: user?.profile?.weightKg ?? null,
        latestBmi: (latestBmi?.valueJson as any)?.bmi ?? null,
      },
      cycles: {
        recordedCount: cycles.length,
        avgCycleLengthDays: avgCycleLength,
        avgPeriodDurationDays: avgPeriodDuration,
        lastPeriodStart: cycles[0]?.startDate ?? null,
      },
      symptomsAndMood: {
        checkinDays: dailyLogs.length,
        avgCrampsLevel:
          crampsCount > 0 ? Math.round((crampsTotal / crampsCount) * 10) / 10 : null,
        topSymptoms,
        topMoods,
      },
      wellness: {
        waterTargetMl,
        avgDailyWaterMl,
        waterDaysLogged,
        waterGoalMetDays,
        avgSleepHours,
        sleepDaysLogged: sleepLogs.length,
        avgDailySteps,
        stepsDaysLogged: stepsLogs.length,
        totalMeditationMin,
        meditationSessions: meditationSessions.length,
      },
    };

    const symptomsLine =
      topSymptoms.length > 0
        ? topSymptoms.map((s) => `${s.name} (${s.count} kez)`).join(', ')
        : 'Kayıtlı belirgin semptom yok';

    const shareText = [
      `📋 Sağlık & Döngü Özet Raporu (Son ${days} Gün)`,
      `Kişi: ${displayName}`,
      `Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`,
      '',
      '🌸 Döngü Bilgileri',
      `- Kayıtlı döngü sayısı (son 6 ay): ${report.cycles.recordedCount}`,
      `- Ortalama döngü süresi: ${avgCycleLength ? `${avgCycleLength} gün` : 'Hesaplanmadı'}`,
      `- Ortalama kanama süresi: ${avgPeriodDuration ? `${avgPeriodDuration} gün` : 'Hesaplanmadı'}`,
      `- Son adet başlangıcı: ${cycles[0]?.startDate ? new Date(cycles[0].startDate).toLocaleDateString('tr-TR') : 'Kayıt yok'}`,
      '',
      '🩺 Semptom & Check-in Özeti',
      `- Check-in yapılan gün: ${dailyLogs.length}`,
      `- En sık belirtiler: ${symptomsLine}`,
      '',
      '💧 Wellness Ortalamaları',
      `- Günlük ortalama su: ${avgDailyWaterMl} ml (Hedef: ${waterTargetMl} ml, ${waterGoalMetDays} gün hedefe ulaşıldı)`,
      `- Ortalama uyku: ${avgSleepHours ? `${avgSleepHours} saat` : 'Kayıt yok'}`,
      `- Ortalama adım: ${avgDailySteps ? `${avgDailySteps} adım/gün` : 'Kayıt yok'}`,
      `- Meditasyon & Nefes: ${totalMeditationMin} dk (${meditationSessions.length} seans)`,
      '',
      "Women's Wellness Companion ile oluşturuldu.",
    ].join('\n');

    return {
      ...report,
      shareText,
    };
  }
}
