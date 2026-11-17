import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const INTERNAL_KEY_PREFIXES = [
  'support_ticket_',
  'partner_invite_',
  'period_notifications_',
  'retention_winback_',
];

const INTERNAL_EXACT_KEYS = [
  'premium_paywall_config',
  'nova_quota_config',
  'nova_limits_config',
];

const LEGACY_UNUSED_KEYS = [
  'ai.google.enabled',
  'reminders.server_push',
  'admin.impersonation',
];

const CORE_LIVE_FLAGS: Array<{ key: string; valueJson: boolean }> = [
  { key: 'maintenance_mode', valueJson: false },
  { key: 'partner_mode_enabled', valueJson: true },
  { key: 'community_enabled', valueJson: true },
  { key: 'astrology_enabled', valueJson: true },
];

@Injectable()
export class FeatureFlagService {
  private coreCleaned = false;
  constructor(private prisma: PrismaService) {}

  private async ensureCoreFlagsClean() {
    if (this.coreCleaned) return;
    this.coreCleaned = true;
    try {
      await this.prisma.featureFlag.deleteMany({
        where: { key: { in: LEGACY_UNUSED_KEYS } },
      });
      for (const flag of CORE_LIVE_FLAGS) {
        await this.prisma.featureFlag.upsert({
          where: { key: flag.key },
          update: {},
          create: { key: flag.key, valueJson: flag.valueJson },
        });
      }
    } catch {
      this.coreCleaned = false;
    }
  }

  private buildPublicFilter() {
    return {
      AND: [
        ...INTERNAL_KEY_PREFIXES.map((prefix) => ({
          NOT: { key: { startsWith: prefix } },
        })),
        {
          key: { notIn: [...INTERNAL_EXACT_KEYS, ...LEGACY_UNUSED_KEYS] },
        },
      ],
    };
  }

  async findPublicFlags(): Promise<Record<string, any>> {
    await this.ensureCoreFlagsClean();
    const flags = await this.prisma.featureFlag.findMany({
      where: this.buildPublicFilter(),
      orderBy: { key: 'asc' },
    });

    const map: Record<string, any> = {};
    for (const flag of flags) {
      map[flag.key] = flag.valueJson;
    }
    return map;
  }

  async findAll(params?: { page?: number; limit?: number }) {
    await this.ensureCoreFlagsClean();
    const { page = 1, limit = 100 } = params || {};
    const skip = (page - 1) * limit;
    const where = this.buildPublicFilter();

    const [data, total] = await Promise.all([
      this.prisma.featureFlag.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.featureFlag.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!flag) {
      throw new NotFoundException(`FeatureFlag with key ${key} not found`);
    }

    return flag;
  }

  async findByKey(key: string) {
    return this.prisma.featureFlag.findUnique({
      where: { key },
    });
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.findByKey(key);
    if (!flag) return false;

    // Handle boolean flags
    if (typeof flag.valueJson === 'boolean') {
      return flag.valueJson;
    }

    return false;
  }

  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    const flag = await this.findByKey(key);
    if (!flag) return defaultValue as T;
    return flag.valueJson as T;
  }

  async create(data: { key: string; valueJson: any }) {
    return this.prisma.featureFlag.create({
      data,
    });
  }

  async update(key: string, data: { valueJson: any }) {
    const flag = await this.findOne(key);

    return this.prisma.featureFlag.update({
      where: { key: flag.key },
      data,
    });
  }

  async delete(key: string) {
    const flag = await this.findOne(key);

    return this.prisma.featureFlag.delete({
      where: { key: flag.key },
    });
  }
}
