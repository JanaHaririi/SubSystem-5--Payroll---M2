import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Holiday, HolidayDocument } from '../models/holiday.schema';
import { CreateHolidayDto } from '../dtos/holiday-create-dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday.name)
    private holidayModel: Model<HolidayDocument>,
  ) {}


  async createHoliday(dto: CreateHolidayDto) {
    if (!dto.type || !dto.startDate) {
      throw new BadRequestException('Holiday type and startDate are required.');
    }

    const holiday = await this.holidayModel.create(dto);

    return {
      success: true,
      message: 'Holiday created successfully!',
      data: holiday,
    };
  }

  async getAllHolidays() {
    const holidays = await this.holidayModel.find().exec();

    if (!holidays || holidays.length === 0) {
      throw new NotFoundException('No holidays found.');
    }

    return {
      success: true,
      message: 'Holidays fetched successfully!',
      data: holidays,
    };
  }
}
