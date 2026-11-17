import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: { connected: boolean; latency?: number };
    redis?: { connected: boolean; memory?: number };
    storage?: { accessible: boolean; space?: number };
    ai?: { provider: string; available: boolean };
  };
  version: string;
  uptime: number;
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Wellness API v1.0 - Women\'s Wellness Companion';
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const startTime = Date.now();

    // Check database
    let dbConnected = false;
    let dbLatency = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      dbLatency = Date.now() - startTime;
    } catch (error) {
      // Database connection failed
    }

    return {
      status: dbConnected ? 'healthy' : 'unhealthy',
      services: {
        database: {
          connected: dbConnected,
          latency: dbLatency,
        },
      },
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  async getPublicSiteSummary() {
    const [activeArticlesCount, totalBadgesCount, pages] = await Promise.all([
      this.prisma.educationalArticle.count({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      }),
      this.prisma.achievement.count({ where: { isActive: true } }),
      this.prisma.page.findMany({
        where: { isActive: true },
        select: {
          slug: true,
          titleTr: true,
          titleEn: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      brand: 'Kadın Atlası',
      activeArticlesCount,
      totalBadgesCount,
      pages,
      storeLinks: {
        ios: process.env.APP_STORE_URL || 'https://apps.apple.com',
        android: process.env.PLAY_STORE_URL || 'https://play.google.com/store',
      },
    };
  }
}
