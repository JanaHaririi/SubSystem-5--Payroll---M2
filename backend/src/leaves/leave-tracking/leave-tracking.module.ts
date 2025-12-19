import { Module } from '@nestjs/common'; 
import { MongooseModule } from '@nestjs/mongoose'; 
import { LeaveTrackingService } from './leave-tracking.service';
import { LeaveTrackingController } from './leave-tracking.controller'; 

import { LeaveAdjustment, LeaveAdjustmentSchema } from '../models/leave-adjustment.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicySchema } from '../models/leave-policy.schema';

@Module({ 
    imports: [ 
        MongooseModule.forFeature([ 
        
            { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema }, 
            { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
            { name: LeavePolicy.name, schema: LeavePolicySchema },
        ]), 
    ],
    controllers: [LeaveTrackingController], 
    providers: [LeaveTrackingService],
    exports: [LeaveTrackingService], })

    export class LeaveTrackingModule {}