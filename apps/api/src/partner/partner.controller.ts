import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PartnerService } from './partner.service';

class AcceptInviteDto {
  @IsString()
  code!: string;
}

@Controller('partner')
@UseGuards(AuthGuard('jwt'))
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post('invite')
  async createInvite(@CurrentUser() user: any) {
    return this.partnerService.createInvite(user.id);
  }

  @Post('accept')
  async acceptInvite(@CurrentUser() user: any, @Body() dto: AcceptInviteDto) {
    return this.partnerService.acceptInvite(user.id, dto.code);
  }

  @Get('status')
  async getStatus(@CurrentUser() user: any) {
    return this.partnerService.getStatus(user.id);
  }

  @Delete('link')
  async unlink(@CurrentUser() user: any) {
    return this.partnerService.unlink(user.id);
  }
}
