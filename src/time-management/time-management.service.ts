import { ShiftAssignmentStatus } from './models/enums/index';
import { EmployeeProfile,EmployeeProfileDocument } from './../employee-profile/models/employee-profile.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BadRequestException, Controller } from '@nestjs/common';
import { Shift, ShiftDocument } from './models/shift.schema';
import { ShiftAssignment, ShiftAssignmentDocument, ShiftAssignmentSchema } from './models/shift-assignment.schema';
import { connection, Model } from 'mongoose';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Department,DepartmentDocument } from '../organization-structure/models/department.schema';
import { Position,PositionDocument } from '../organization-structure/models/position.schema';

@Injectable()
export class TimeManagementService {


    
}
