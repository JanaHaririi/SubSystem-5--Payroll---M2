import { InternalServerErrorException } from '@nestjs/common';import { BadRequestException } from '@nestjs/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';

import { TimeException, TimeExceptionDocument } from '../models/time-exception.schema';
import { TimeExceptionCreateDto } from '../dtos/create-time-exception.dto';
import { TimeExceptionUpdateDto } from '../dtos/update-time-exception.dto';

 @Injectable()
export class TimeExceptionService {
  constructor(
    @InjectModel(TimeException.name)
    private readonly timeExceptionModel: Model<TimeException>,
  ) {}


 
  async listAll() {
    return this.timeExceptionModel.find();
  }

  async update(id: string, dto: TimeExceptionUpdateDto) {

   
  const existing = await this.timeExceptionModel.findById(id);
  if (!existing) {
    throw new NotFoundException('Time Exception not found');
    
  }

 
  

   
 
  const updated = await this.timeExceptionModel.findByIdAndUpdate(id, dto, { new: true });

  return {
    success: true,
    message: 'Time Exception updated successfully',
    data: updated,
  };
}

 
  async delete(id: string) {
    const deleted = await this.timeExceptionModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Time Exception not found');
    }

    return {
      success: true,
      message: 'Time Exception deleted',
    };
  }
   async approve(id: string, approvedBy: string) {

  const exception = await this.timeExceptionModel.findById(id);
  if (!exception) {
    throw new NotFoundException('Time Exception not found');
  }
 
  if (exception.status !== 'PENDING') {
    throw new BadRequestException('Only PENDING exceptions can be approved.');
  }

 
  if (exception.employeeId.toString() === approvedBy) {
    throw new BadRequestException('You cannot approve your own exception.');
  }

 
  const updated = await this.timeExceptionModel.findByIdAndUpdate(
    id,
    {
      status: 'APPROVED',
      approvedBy,
      approvedAt: new Date(),
    },
    { new: true }
  );

  return {
    success: true,
    message: 'Time Exception approved successfully',
    data: updated,
  };
}


  async findById(id: string) {
    return this.timeExceptionModel.findById(id);
  }
  async reject(id: string, rejectedBy: string, reason: string) {
  const updated = await this.timeExceptionModel.findByIdAndUpdate(
    id,
    {
      status: 'REJECTED',
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason
    },
    { new: true }
  );

  if (!updated) throw new BadRequestException('Time Exception not found');

  return {
    success: true,
    message: 'Time Exception rejected successfully',
    data: updated,
  };
}
  

 async autoEscalatePending() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // ⭐ Create proper Mongo ObjectId from timestamp — bulletproof method
    const timestamp = Math.floor(threeDaysAgo.getTime() / 1000);
    const hexSeconds = timestamp.toString(16);
    const objectIdLimit = new Types.ObjectId(hexSeconds.padStart(8, '0') + "0000000000000000");

    const updated = await this.timeExceptionModel.updateMany(
      {
        status: 'PENDING',
        _id: { $lte: objectIdLimit },  // ⭐ SAFE – objectIdLimit is real ObjectId instance
      },
      { $set: { status: 'ESCALATED' } }
    );

    return {
      success: true,
      message: 'Pending Time Exceptions auto-escalated',
      count: updated.modifiedCount,
    };
  } catch (error) {
    console.error("AUTO ESCALATE ERROR:", error);
    throw new InternalServerErrorException("Failed to auto-escalate");
  }
}
async create(dto: TimeExceptionCreateDto) {
  const created = new this.timeExceptionModel(dto);
  return await created.save();
}
 
async forcePending(id: string) {
  return this.timeExceptionModel.findByIdAndUpdate(
    id,
    { status: 'PENDING' },
    { new: true }
  );
}
async escalatePendingExceptions() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    const updated = await this.timeExceptionModel.updateMany(
      {
        status: 'PENDING',
        createdAt: { $lt: threeDaysAgo },
      },
      {
        $set: { status: 'ESCALATED' },
      },
    );

    return {
      matched: updated.matchedCount,
      modified: updated.modifiedCount,
    };
  } catch (err) {
    console.error('ESCALATION ERROR:', err);
    throw new InternalServerErrorException(err.message);
  }
}

 async escalate(id: string) {
  const exception = await this.timeExceptionModel.findById(id);
  if (!exception) {
    throw new NotFoundException('Time Exception not found');
  }

  if (exception.status === 'APPROVED') {
    throw new BadRequestException('Approved exceptions cannot be escalated');
  }

  const updated = await this.timeExceptionModel.findByIdAndUpdate(
    id,
    { status: 'ESCALATED' },
    { new: true }
  );

  return {
    success: true,
    message: 'Time Exception escalated successfully',
    data: updated,
  };
}


}
