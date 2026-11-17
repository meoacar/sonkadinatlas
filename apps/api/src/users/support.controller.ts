import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsEmail } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../reminders/push.service';
import { MailService } from '../mail/mail.service';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface SupportTicketPayload {
  id: string;
  userId: string;
  userEmail?: string;
  category: string;
  subject: string;
  message: string;
  status: SupportTicketStatus;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  subject!: string;

  @IsString()
  message!: string;
}

class UpdateSupportTicketDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED'])
  status?: SupportTicketStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}

class PublicContactDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  subject!: string;

  @IsString()
  message!: string;
}

const TICKET_KEY_PREFIX = 'support_ticket_';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
    private readonly mailService: MailService,
  ) {}

  @Post('public/contact')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a public website contact/support message' })
  async submitPublicContact(@Body() dto: PublicContactDto) {
    const name = dto?.name?.trim();
    const email = dto?.email?.trim();
    const subject = dto?.subject?.trim();
    const message = dto?.message?.trim();
    const category = dto?.category?.trim() || 'Web İletişim';

    if (!name || name.length < 2) {
      throw new BadRequestException('Lütfen adınızı girin.');
    }
    if (!subject || subject.length < 3) {
      throw new BadRequestException('Konu en az 3 karakter olmalıdır.');
    }
    if (!message || message.length < 10) {
      throw new BadRequestException('Mesajınız en az 10 karakter olmalıdır.');
    }

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const matchedUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    const payload: SupportTicketPayload = {
      id,
      userId: matchedUser?.id || 'guest_visitor',
      userEmail: `${name} <${email}>`,
      category,
      subject,
      message,
      status: 'OPEN',
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.prisma.featureFlag.create({
      data: {
        key: `${TICKET_KEY_PREFIX}${id}`,
        valueJson: payload as any,
      },
    });

    return {
      success: true,
      id: payload.id,
      ticketCode: id.slice(-6).toUpperCase(),
      createdAt: payload.createdAt,
    };
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an in-app support or feedback ticket' })
  async createTicket(@CurrentUser() user: any, @Body() dto: CreateSupportTicketDto) {
    const subject = dto?.subject?.trim();
    const message = dto?.message?.trim();
    const category = dto?.category?.trim() || 'Genel';

    if (!subject || subject.length < 3) {
      throw new BadRequestException('Konu en az 3 karakter olmalıdır.');
    }
    if (!message || message.length < 10) {
      throw new BadRequestException('Mesajınız en az 10 karakter olmalıdır.');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });

    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const payload: SupportTicketPayload = {
      id,
      userId: user.id,
      userEmail: dbUser?.email || user.email || undefined,
      category,
      subject,
      message,
      status: 'OPEN',
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.prisma.featureFlag.create({
      data: {
        key: `${TICKET_KEY_PREFIX}${id}`,
        valueJson: payload as any,
      },
    });

    return payload;
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user support tickets' })
  async getMyTickets(@CurrentUser() user: any) {
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        key: { startsWith: TICKET_KEY_PREFIX },
      },
    });

    return flags
      .map((f) => f.valueJson as unknown as SupportTicketPayload)
      .filter((t) => t && t.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all user support tickets (Admin)' })
  async getAllTickets(@Query('status') status?: string) {
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        key: { startsWith: TICKET_KEY_PREFIX },
      },
    });

    let tickets = flags
      .map((f) => f.valueJson as unknown as SupportTicketPayload)
      .filter((t) => Boolean(t && t.id));

    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      tickets = tickets.filter((t) => t.status === status);
    }

    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { data: tickets, total: tickets.length };
  }

  @Patch('admin/tickets/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update support ticket status or admin note (Admin)' })
  async updateTicket(@Param('id') id: string, @Body() dto: UpdateSupportTicketDto) {
    const key = `${TICKET_KEY_PREFIX}${id}`;
    const existing = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) {
      throw new NotFoundException('Destek talebi bulunamadı.');
    }

    const current = existing.valueJson as unknown as SupportTicketPayload;
    const validStatuses: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

    if (dto.status && !validStatuses.includes(dto.status)) {
      throw new BadRequestException('Geçersiz talep durumu.');
    }

    const updated: SupportTicketPayload = {
      ...current,
      status: dto.status ?? current.status,
      adminNote: dto.adminNote !== undefined ? dto.adminNote : current.adminNote,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.featureFlag.update({
      where: { key },
      data: { valueJson: updated as any },
    });

    // Notify user via Push and Email when status or adminNote changes
    const statusLabels: Record<SupportTicketStatus, string> = {
      OPEN: 'Açık',
      IN_PROGRESS: 'İnceleniyor',
      RESOLVED: 'Çözüldü',
    };
    const shouldNotify =
      (dto.status && dto.status !== current.status) ||
      (dto.adminNote !== undefined && dto.adminNote !== current.adminNote);

    if (shouldNotify) {
      const notifTitle = `Destek Talebin Güncellendi (${statusLabels[updated.status]})`;
      const notifBody = updated.adminNote
        ? `"${updated.subject}" talebin için yanıt: ${updated.adminNote}`
        : `"${updated.subject}" başlıklı talebinin durumu "${statusLabels[updated.status]}" olarak güncellendi.`;

      if (updated.userId && updated.userId !== 'guest') {
        this.pushService
          .sendPush(updated.userId, {
            to: '',
            sound: 'default',
            title: notifTitle,
            body: notifBody,
            data: { type: 'SUPPORT_UPDATE', screen: 'home', ticketId: updated.id },
          })
          .catch(() => {});
      }

      if (updated.userEmail) {
        this.mailService
          .sendAdminBroadcastEmail(
            updated.userEmail,
            notifTitle,
            `${notifBody}\n\nKadın Atlası Destek Ekibi`,
          )
          .catch(() => {});
      }
    }

    return updated;
  }
}
