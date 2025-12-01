import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res, Get, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signIn(loginDto.employeeNumber, loginDto.password);

    // Set JWT in httpOnly cookie
    res.cookie('token', result.access_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user info (without token in body)
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      user: result.payload,
    };
  }

  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // TEMPORARY: Remove this endpoint after creating first admin
  @Post('register-first-admin')
  @HttpCode(HttpStatus.CREATED)
  async registerFirstAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: Request) {
    const user: any = req['user'];
    return {
      userid: user?.userid,
      employeeNumber: user?.employeeNumber,
      email: user?.email,
      roles: user?.roles,
      status: user?.status,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the cookie by setting it to empty and expired
    res.cookie('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }
}
