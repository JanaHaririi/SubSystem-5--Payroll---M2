import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { AttendanceCorrectionRequestDto, UpdateAttendanceCorrectionRequestDto } from '../dtos/create-attendance-correction-request-dto';

import { CorrectionRequestStatus } from '../models/enums/index';

@Injectable()
export class AttendanceCorrectionRequestService {
  constructor(
    @InjectModel(AttendanceCorrectionRequest.name)
    private readonly requestModel: Model<AttendanceCorrectionRequestDocument>,
  ) {}

  // employee submits a request
  async submitCorrectionRequest(dto: AttendanceCorrectionRequestDto) {
    const request = await this.requestModel.create({
      employeeId: new Types.ObjectId(dto.employeeId),
      attendanceRecord: new Types.ObjectId(dto.attendanceRecordId),
      reason: dto.reason,
      status: CorrectionRequestStatus.SUBMITTED,
    });

    return {
      success: true,
      message: 'Attendance correction request submitted successfully!',
      data: request,
    };
  }

  // employee updates a pending request idk if thats necessary but ok
  async updateCorrectionRequest(id: string, dto: UpdateAttendanceCorrectionRequestDto) {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Correction request not found!');
    if (request.status !== CorrectionRequestStatus.SUBMITTED && request.status !== CorrectionRequestStatus.IN_REVIEW) {
      throw new BadRequestException('Only pending requests can be updated.');
    }

    if (dto.reason !== undefined) request.reason = dto.reason;

    await request.save();

    return {
      success: true,
      message: 'Correction request updated successfully!',
      data: request,
    };
  }

  // line manager approves a request
  async approveCorrectionRequest(id: string) {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Correction request not found!');
    if (request.status !== CorrectionRequestStatus.SUBMITTED && request.status !== CorrectionRequestStatus.IN_REVIEW) {
      throw new BadRequestException('Only pending requests can be approved.');
    }

    request.status = CorrectionRequestStatus.APPROVED;
    await request.save();

    return {
      success: true,
      message: 'Correction request approved successfully!',
      data: request,
    };
  }

  // line manager rejects a request
  async rejectCorrectionRequest(id: string, reason: string) {
    const request = await this.requestModel.findById(id);
    if (!request) throw new NotFoundException('Correction request not found!');
    if (request.status !== CorrectionRequestStatus.SUBMITTED && request.status !== CorrectionRequestStatus.IN_REVIEW) {
      throw new BadRequestException('Only pending requests can be rejected.');
    }

    request.status = CorrectionRequestStatus.REJECTED;
    request.reason = reason;
    await request.save();

    return {
      success: true,
      message: 'Correction request rejected successfully!',
      data: request,
    };
  }

  async listEmployeeCorrectionRequests(employeeId: string) {
    return await this.requestModel
      .find({ employeeId })
      .populate('attendanceRecord')
      .exec();
  }

  async autoEscalatePendingCorrections() {
    
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 48);
  
    const updated = await this.requestModel.updateMany(
      {
        status: CorrectionRequestStatus.IN_REVIEW,
        createdAt: { $lt: cutoff }
      },
      {
        $set: { status: CorrectionRequestStatus.ESCALATED }
      }
    );
  
    return {
      escalatedCount: updated.modifiedCount
    };
  }
  

 
}
