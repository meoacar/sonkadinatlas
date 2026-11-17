import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QuotaService } from './quota.service';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private readonly quotaService: QuotaService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Kimlik doğrulama gerekli');
    }

    const quota = await this.quotaService.getStatus(user.id);

    if (!quota.isNovaEnabled) {
      throw new ServiceUnavailableException(quota.maintenanceMessage);
    }

    // Check if quota is exceeded
    if (quota.used >= quota.limit) {
      const resetDate = new Date(quota.resetsAt);
      const formattedDate = resetDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: `Aylık NOVA mesaj kotanız doldu (${quota.used}/${quota.limit}). Premium'a geçerek daha yüksek limit elde edebilirsiniz. Yenilenme: ${formattedDate}`,
        messageEn: `Monthly message quota exceeded (${quota.used}/${quota.limit}).`,
        quota: {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          resetsAt: quota.resetsAt,
          percentage: quota.percentage,
        },
        upgradeRequired: true,
      });
    }

    return true;
  }
}
