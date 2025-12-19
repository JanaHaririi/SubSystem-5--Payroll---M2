// leaves/guards/role-normalizer.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RoleNormalizerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user && req.user.roles) {
      // Normalize roles to match SystemRole exactly
      req.user.roles = req.user.roles.map((r: string) =>
        r.toLowerCase().replace(/\s+/g, ' ').trim()
      );
    }
    return true; // allow request to continue
  }
}
