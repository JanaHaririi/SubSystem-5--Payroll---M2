import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PayrollTrackingController } from './payroll-tracking.controller';
import { PayrollTrackingService } from './payroll-tracking.service';

// Schemas (MUST MATCH EXACT NAMES)
import { Claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { refunds, refundsSchema } from './models/refunds.schema';

// Auth module from main system
import { AuthModule } from '../auth/auth.module';

// Other connected subsystems
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';

@Module({
  imports: [
    AuthModule,

    PayrollConfigurationModule,

    forwardRef(() => PayrollExecutionModule),

    MongooseModule.forFeature([
      { name: Claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: refunds.name, schema: refundsSchema },
    ]),
  ],

  controllers: [PayrollTrackingController],

  providers: [PayrollTrackingService],

  exports: [PayrollTrackingService],
})
export class PayrollTrackingModule {}
