import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CurrentUserData } from '../decorators/current-user.decorator';

@Injectable()
export class AuthorizationMiddleware implements NestMiddleware {
  constructor(private allowedRoles: string[]) {}

  use(req: Request, res: Response, next: NextFunction) {
    const user = req['user'] as CurrentUserData;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = user.roles?.some((role: string) =>
      this.allowedRoles.includes(role)
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    next();
  }
}
