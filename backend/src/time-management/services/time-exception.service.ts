import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { TimeExceptionCreateDto, TimeExceptionUpdateDto } from '../dtos/create-time-exception.dto';
import { TimeExceptionStatus } from '../models/enums/index';

@Injectable()
export class TimeExceptionService {
  constructor(
    @InjectModel(TimeException.name)
    private readonly timeExceptionModel: Model<TimeExceptionDocument>,
  ) {}

  // Employee submits a new time exception
  async create(dto: TimeExceptionCreateDto) {
    const exception = await this.timeExceptionModel.create({
      employeeId: new Types.ObjectId(dto.employeeId),
      type: dto.type,
      attendanceRecordId: new Types.ObjectId(dto.attendanceRecordId),
      assignedTo: new Types.ObjectId(dto.assignedTo),
      reason: dto.reason,
      status: TimeExceptionStatus.PENDING,
    });

    return {
      success: true,
      message: 'Time Exception submitted successfully!',
      data: exception,
    };
  }

  // Employee updates a pending time exception
  async updateTimeException(id: string, dto: TimeExceptionUpdateDto) {
    const exception = await this.timeExceptionModel.findById(id);
    if (!exception) throw new NotFoundException('Time Exception not found');
    if (
      exception.status !== TimeExceptionStatus.OPEN &&
      exception.status !== TimeExceptionStatus.ESCALATED
    ) {
      throw new BadRequestException('Only pending or escalated exceptions can be updated');
    }

    if (dto.reason !== undefined) exception.reason = dto.reason;
    if (dto.type !== undefined) exception.type = dto.type;
    if (dto.assignedTo !== undefined) exception.assignedTo = new Types.ObjectId(dto.assignedTo);

    await exception.save();

    return {
      success: true,
      message: 'Time Exception updated successfully!',
      data: exception,
    };
  }

  // Approve a time exception
  async approve(id: string, approverId: string) {
    const exception = await this.timeExceptionModel.findById(id);
    if (!exception) throw new NotFoundException('Time Exception not found');
    if (exception.status!=="PENDING" && exception.status!=="ESCALATED") {
      throw new BadRequestException('Only pending or escalated exceptions can be approved');
    }

    if (exception.employeeId.toString() === approverId) {
      throw new BadRequestException('You cannot approve your own exception');
    }

    exception.status = TimeExceptionStatus.APPROVED;
    await exception.save();

    return {
      success: true,
      message: 'Time Exception approved successfully!',
      data: exception,
    };
  }

  // Reject a time exception
  async reject(id: string, approverId: string, reason: string) {
    const exception = await this.timeExceptionModel.findById(id);
    if (!exception) throw new NotFoundException('Time Exception not found');
    if (exception.status!=="PENDING" && exception.status!=="ESCALATED") {
      throw new BadRequestException('Only pending or escalated exceptions can be rejected');
    }

    exception.status = TimeExceptionStatus.REJECTED;
    exception.reason = reason;
    await exception.save();

    return {
      success: true,
      message: 'Time Exception rejected successfully!',
      data: exception,
    };
  }

  // Escalate a time exception
  async escalate(id: string) {
    const exception = await this.timeExceptionModel.findById(id);
    if (!exception) throw new NotFoundException('Time Exception not found');

    if (exception.status !== TimeExceptionStatus.PENDING && exception.status !== TimeExceptionStatus.OPEN) {
      throw new BadRequestException('Only pending or open exceptions can be escalated');
    }

   
    exception.status = TimeExceptionStatus.ESCALATED;
    await exception.save();

    return {
      success: true,
      message: 'Time Exception escalated successfully!',
      data: exception,
    };
  }
    async open(id: string, approverId: string) {
    const exception = await this.timeExceptionModel.findById(id);
    if (!exception) throw new NotFoundException('Time Exception not found');
    if (exception.status!=="PENDING") {
      throw new BadRequestException('Only pending or escalated exceptions can be opened');
    }

    exception.status = TimeExceptionStatus.OPEN;
    await exception.save();

    return {
      success: true,
      message: 'Time Exception opened successfully!',
      data: exception,
    };
  }

  // List exceptions submitted by an employee
  async listEmployeeTimeExceptions(employeeId: string) {
    const exception = await this.timeExceptionModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('attendanceRecordId')
      .populate('assignedTo', 'firstName lastName workEmail')
    if(!exception) throw new NotFoundException("Exceptions not found!");
    return{
      success:true,
      message: "Time exceptions returned successfully!",
      data: exception
    }
  }

  // Auto-escalate pending exceptions older than 3 days
  async autoEscalatePending() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);

    const updated = await this.timeExceptionModel.updateMany(
      {
        status: TimeExceptionStatus.OPEN,
      },
      {
        $set: { status: TimeExceptionStatus.ESCALATED },
      },
    );
    return {
      success: true,
      escalatedCount: updated.modifiedCount,
    };
  }

  // Get all time exceptions (for managers/admins)
  async getAllTimeExceptions() {
    return await this.timeExceptionModel
      .find()
      .populate('employeeId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('attendanceRecordId')
      .exec();
  }
}
