import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get token from cookie or Authorization header
    const token = request.cookies?.token || request.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      });

      // Check if this is a candidate or employee
      if (payload.userType === 'candidate') {
        // Candidate login
        request.user = {
          userId: payload.userid,
          userType: 'candidate',
          candidateNumber: payload.candidateNumber,
          email: payload.email,
          status: payload.status,
        };
      } else {
        // Employee login - BR-3j: Check employee status
        const allowedStatuses = ['ACTIVE', 'PROBATION'];
        if (payload.status && !allowedStatuses.includes(payload.status)) {
          throw new UnauthorizedException(
            `Access denied. Employee status: ${payload.status}. Only ACTIVE or PROBATION employees can access the system.`,
          );
        }

        request.user = {
          employeeId: payload.userid,
          employeeNumber: payload.employeeNumber,
          email: payload.email,
          roles: payload.roles || ['department employee'],
          status: payload.status,
        };
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
