import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const INVITE_PREFIX = 'partner_invite_';

export interface PartnerLinkMeta {
  partnerUserId: string;
  partnerDisplayName: string;
  role: 'owner' | 'partner';
  connectedAt: string;
}

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertPartnerModeEnabled() {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key: 'partner_mode_enabled' },
    });
    if (flag && flag.valueJson === false) {
      throw new ForbiddenException(
        'Partner Modu şu anda yönetici tarafından geçici olarak devre dışı bırakılmıştır.',
      );
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async createInvite(userId: string) {
    await this.assertPartnerModeEnabled();
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profil bulunamadı');
    }

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await this.prisma.featureFlag.upsert({
      where: { key: `${INVITE_PREFIX}${code}` },
      update: {
        valueJson: {
          ownerUserId: userId,
          ownerDisplayName: profile.displayName || 'Kullanıcı',
          expiresAt,
          createdAt: new Date().toISOString(),
        } as any,
      },
      create: {
        key: `${INVITE_PREFIX}${code}`,
        valueJson: {
          ownerUserId: userId,
          ownerDisplayName: profile.displayName || 'Kullanıcı',
          expiresAt,
          createdAt: new Date().toISOString(),
        } as any,
      },
    });

    return {
      code,
      expiresAt,
      message: 'Bu 6 haneli davet kodunu eşiniz veya partnerinizle paylaşabilirsiniz.',
    };
  }

  async acceptInvite(partnerUserId: string, rawCode: string) {
    await this.assertPartnerModeEnabled();
    const code = (rawCode || '').trim().toUpperCase();
    if (!code || code.length < 4) {
      throw new BadRequestException('Geçerli bir davet kodu girin.');
    }

    const inviteFlag = await this.prisma.featureFlag.findUnique({
      where: { key: `${INVITE_PREFIX}${code}` },
    });

    if (!inviteFlag) {
      throw new NotFoundException('Davet kodu bulunamadı veya süresi doldu.');
    }

    const invite = inviteFlag.valueJson as any;
    if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
      await this.prisma.featureFlag.delete({ where: { key: `${INVITE_PREFIX}${code}` } });
      throw new BadRequestException('Bu davet kodunun süresi dolmuş.');
    }

    if (invite.ownerUserId === partnerUserId) {
      throw new BadRequestException('Kendi davet kodunuzu kullanamazsınız.');
    }

    const [ownerProfile, partnerProfile] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: invite.ownerUserId } }),
      this.prisma.profile.findUnique({ where: { userId: partnerUserId } }),
    ]);

    if (!ownerProfile || !partnerProfile) {
      throw new NotFoundException('Kullanıcı profili bulunamadı.');
    }

    const connectedAt = new Date().toISOString();

    const ownerPrefs = ((ownerProfile.preferencesJson as Record<string, any>) || {});
    const partnerPrefs = ((partnerProfile.preferencesJson as Record<string, any>) || {});

    const ownerLink: PartnerLinkMeta = {
      partnerUserId,
      partnerDisplayName: partnerProfile.displayName || 'Partner',
      role: 'owner',
      connectedAt,
    };
    const partnerLink: PartnerLinkMeta = {
      partnerUserId: invite.ownerUserId,
      partnerDisplayName: ownerProfile.displayName || 'Kullanıcı',
      role: 'partner',
      connectedAt,
    };

    await Promise.all([
      this.prisma.profile.update({
        where: { userId: invite.ownerUserId },
        data: { preferencesJson: { ...ownerPrefs, partnerLink: ownerLink } as any },
      }),
      this.prisma.profile.update({
        where: { userId: partnerUserId },
        data: { preferencesJson: { ...partnerPrefs, partnerLink } as any },
      }),
      this.prisma.featureFlag.delete({ where: { key: `${INVITE_PREFIX}${code}` } }),
    ]);

    return { connected: true, link: partnerLink };
  }

  async unlink(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { connected: false };

    const prefs = ((profile.preferencesJson as Record<string, any>) || {});
    const existingLink = prefs.partnerLink as PartnerLinkMeta | undefined;

    const { partnerLink: _removed, ...restPrefs } = prefs;
    await this.prisma.profile.update({
      where: { userId },
      data: { preferencesJson: restPrefs as any },
    });

    if (existingLink?.partnerUserId) {
      const other = await this.prisma.profile.findUnique({
        where: { userId: existingLink.partnerUserId },
      });
      if (other) {
        const otherPrefs = ((other.preferencesJson as Record<string, any>) || {});
        const { partnerLink: _otherRemoved, ...otherRest } = otherPrefs;
        await this.prisma.profile.update({
          where: { userId: existingLink.partnerUserId },
          data: { preferencesJson: otherRest as any },
        });
      }
    }

    return { connected: false };
  }

  async getStatus(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    const prefs = ((profile?.preferencesJson as Record<string, any>) || {});
    const link = prefs.partnerLink as PartnerLinkMeta | undefined;

    if (!link) {
      return { connected: false, link: null, partnerSummary: null };
    }

    // Strict privacy boundary: ONLY when viewer has role === 'partner', expose high-level phase & support tip.
    // Never expose daily notes, flow intensity, symptoms, or sexual logs.
    if (link.role !== 'partner') {
      return { connected: true, link, partnerSummary: null };
    }

    const latestCycles = await this.prisma.periodCycle.findMany({
      where: { userId: link.partnerUserId },
      orderBy: { startDate: 'desc' },
      take: 3,
      select: { startDate: true },
    });

    let cycleDay: number | null = null;
    let phaseTitle = 'Döngü Verisi Bekleniyor';
    let supportTip = 'Bugün ona küçük bir sürpriz yapıp nasıl hissettiğini sorabilirsin. 🤍';
    let daysUntilNextPeriod: number | null = null;

    if (latestCycles.length > 0) {
      const latestStart = new Date(latestCycles[0].startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      latestStart.setHours(0, 0, 0, 0);
      cycleDay = Math.max(
        1,
        Math.floor((today.getTime() - latestStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      );

      let avgLength = 28;
      if (latestCycles.length >= 2) {
        const lengths: number[] = [];
        for (let i = 0; i < latestCycles.length - 1; i++) {
          const diff = Math.round(
            (new Date(latestCycles[i].startDate).getTime() -
              new Date(latestCycles[i + 1].startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (diff >= 20 && diff <= 45) lengths.push(diff);
        }
        if (lengths.length > 0) {
          avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
        }
      }

      daysUntilNextPeriod = Math.max(0, avgLength - cycleDay);

      if (cycleDay <= 5) {
        phaseTitle = 'Menstrual Faz (Hassas & Dinlenme Dönemi)';
        supportTip =
          'Regl döneminde olabilir; sıcak bir çay, bitki çayı veya sorumluluk paylaşımı bugün ona çok iyi gelir. 🫖';
      } else if (cycleDay <= 13) {
        phaseTitle = 'Foliküler Faz (Enerjik Dönem)';
        supportTip =
          'Enerjisi yükseliyor! Birlikte açık hava yürüyüşü veya yeni bir aktivite planlamak için harika zaman. ✨';
      } else if (cycleDay <= 16) {
        phaseTitle = 'Ovulasyon Fazı (Sosyal & Canlı Dönem)';
        supportTip =
          'Sosyal enerjisinin en yüksek olduğu günler; keyifli bir akşam planı harika olabilir. 🌷';
      } else {
        phaseTitle = 'Luteal / PMS Fazı (Ekstra Anlayış Dönemi)';
        supportTip =
          'Regl öncesi hassasiyet ve yorgunluk artabilir. Ekstra sabır, sevdiği bir atıştırmalık ve sarılmak iyi gelir. 💕';
      }
    }

    return {
      connected: true,
      link,
      partnerSummary: {
        ownerDisplayName: link.partnerDisplayName,
        cycleDay,
        phaseTitle,
        daysUntilNextPeriod,
        supportTip,
        privacyNote: 'Gizlilik gereği yalnızca genel faz ve destek önerileri paylaşılır.',
      },
    };
  }
}
