import { Controller, Get, Patch, Body, UseGuards, Post, BadRequestException, Req, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SubscriptionStatus, SubscriptionTier, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pump = promisify(pipeline);

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string | null; // ISO date string

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  profilePictureUrl?: string | null;

  @IsOptional()
  preferencesJson?: any;
}

class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}

class ProfileUpdateDto {
  @IsOptional()
  @IsString()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  lastName?: string | null;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsString()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsNumber()
  heightCm?: number | null;

  @IsOptional()
  @IsNumber()
  weightKg?: number | null;

  @IsOptional()
  @IsString()
  country?: string | null;

  @IsOptional()
  @IsString()
  timezone?: string | null;
}

class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  username?: string | null;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  pinEnabled?: boolean;

  @IsOptional()
  @IsString()
  newPassword?: string;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileUpdateDto)
  profile?: ProfileUpdateDto;
}

class AdminUpdateUserSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(SubscriptionTier)
  tier?: SubscriptionTier | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;

  @IsOptional()
  @IsNumber()
  aiMessagesLimit?: number;

  @IsOptional()
  @IsBoolean()
  resetAiUsage?: boolean;
}

class SetupPinDto {
  @IsString()
  @IsNotEmpty()
  pin!: string;
}

class VerifyPinDto {
  @IsString()
  @IsNotEmpty()
  pin!: string;
}

class DisablePinDto {
  @IsString()
  @IsNotEmpty()
  pin!: string;
}

class ChangePinDto {
  @IsString()
  @IsNotEmpty()
  oldPin!: string;

  @IsString()
  @IsNotEmpty()
  newPin!: string;
}

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('users/check-username')
  @ApiOperation({ summary: 'Check username availability' })
  async checkUsernameAvailability(@Query('username') username: string) {
    if (!username) {
      throw new BadRequestException('Username is required');
    }
    const available = await this.usersService.isUsernameAvailable(username);
    return { available };
  }

  @Patch('me/username')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user username' })
  async updateMyUsername(@CurrentUser() user: any, @Body() dto: UpdateUsernameDto) {
    return this.usersService.updateUsername(user.id, dto.username);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: any) {
    return this.usersService.getUserWithProfile(user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user account' })
  async deleteMe(@CurrentUser() user: any) {
    return this.usersService.deleteUser(user.id);
  }

  @Get('me/export')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all user data' })
  async exportMyData(@CurrentUser() user: any) {
    return this.usersService.exportUserData(user.id);
  }

  @Get('me/retention-offer')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active in-app retention offer & heartbeat' })
  async getMyRetentionOffer(@CurrentUser() user: any) {
    return this.usersService.getMyRetentionOffer(user.id);
  }

  @Post('me/retention-offer/ack')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dismiss or claim retention offer' })
  async ackMyRetentionOffer(
    @CurrentUser() user: any,
    @Body() body: { action?: 'dismiss' | 'claim' },
  ) {
    return this.usersService.ackMyRetentionOffer(
      user.id,
      body?.action === 'claim' ? 'claim' : 'dismiss',
    );
  }

  // Admin endpoints
  @Post('users')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user (Admin)' })
  async createUser(@Body() dto: any) {
    return this.usersService.createUser(dto);
  }

  @Get('users')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin)' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.usersService.getAllUsers(pageNum, limitNum);
  }

  @Get('users/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (Admin)' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch('users/:id/subscription')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert or update user subscription (Admin)' })
  async updateUserSubscription(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserSubscriptionDto,
  ) {
    return this.usersService.adminUpdateUserSubscription(id, dto);
  }

  @Get('users/:id/export')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export user KVKK data (Admin)' })
  async exportUserDataAdmin(@Param('id') id: string) {
    return this.usersService.exportUserData(id);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (Admin)' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('me/profile-picture')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  async uploadProfilePicture(@CurrentUser() user: any, @Req() req: any) {
    try {
      const data = await req.file();

      if (!data) {
        throw new BadRequestException('File is required');
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        throw new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)');
      }

      // Generate unique filename
      const fileExtension = path.extname(data.filename);
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      const filename = `${randomName}${fileExtension}`;

      // Ensure upload directory exists
      const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      const filePath = path.join(uploadDir, filename);
      await pump(data.file, fs.createWriteStream(filePath));

      // Generate public URL (in production, this would be an S3 URL)
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      const profilePictureUrl = `${baseUrl}/uploads/profiles/${filename}`;

      console.log('Updating profile with URL:', profilePictureUrl, 'for user:', user.id);

      // Update user profile with new picture URL
      try {
        const updatedUser = await this.usersService.updateProfile(user.id, { profilePictureUrl });
        console.log('Profile updated successfully, new URL:', updatedUser?.profile?.profilePictureUrl);
      } catch (updateError) {
        console.error('Failed to update profile:', updateError);
        throw new BadRequestException('Failed to update profile with picture URL');
      }

      return { profilePictureUrl };
    } catch (error) {
      console.error('Upload error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to upload profile picture');
    }
  }

  // PIN Management Endpoints
  @Get('me/pin-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PIN status for current user' })
  async getPinStatus(@CurrentUser() user: any) {
    return this.usersService.getPinStatus(user.id);
  }

  @Post('me/pin/setup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup PIN for app lock' })
  async setupPin(@CurrentUser() user: any, @Body() dto: SetupPinDto) {
    return this.usersService.setupPin(user.id, dto.pin);
  }

  @Post('me/pin/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify PIN' })
  async verifyPin(@CurrentUser() user: any, @Body() dto: VerifyPinDto) {
    return this.usersService.verifyPin(user.id, dto.pin);
  }

  @Post('me/pin/disable')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable PIN lock' })
  async disablePin(@CurrentUser() user: any, @Body() dto: DisablePinDto) {
    return this.usersService.disablePin(user.id, dto.pin);
  }

  @Patch('me/pin/change')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change PIN' })
  async changePin(@CurrentUser() user: any, @Body() dto: ChangePinDto) {
    return this.usersService.changePin(user.id, dto.oldPin, dto.newPin);
  }

  @Patch('me/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
