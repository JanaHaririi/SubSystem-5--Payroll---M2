import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole } from '../employee-profile/models/employee-system-role.schema';
import { Candidate } from '../employee-profile/models/candidate.schema';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfile>,
    @InjectModel(EmployeeSystemRole.name)
    private employeeRoleModel: Model<EmployeeSystemRole>,
    @InjectModel(Candidate.name)
    private candidateModel: Model<Candidate>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<string> {
    const existingEmployee = await this.employeeProfileModel.findOne({
      employeeNumber: registerDto.employeeNumber
    });

    if (existingEmployee) {
      throw new ConflictException('Employee number already exists');
    }

    const existingEmail = await this.employeeProfileModel.findOne({
      workEmail: registerDto.workEmail
    });

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingNationalId = await this.employeeProfileModel.findOne({
      nationalId: registerDto.nationalId
    });

    if (existingNationalId) {
      throw new ConflictException('National ID already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create employee profile
    const newEmployee = await this.employeeProfileModel.create({
      employeeNumber: registerDto.employeeNumber,
      workEmail: registerDto.workEmail,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      nationalId: registerDto.nationalId,
      dateOfHire: new Date(registerDto.dateOfHire),
      fullName: `${registerDto.firstName} ${registerDto.lastName}`,
    });

    // Create role assignment with provided roles or default
    const roleAssignment = await this.employeeRoleModel.create({
      employeeProfileId: newEmployee._id,
      roles: registerDto.roles || ['department employee'],
      permissions: registerDto.permissions || [],
      isActive: true,
    });

    // Link role assignment to employee profile
    await this.employeeProfileModel.findByIdAndUpdate(newEmployee._id, {
      accessProfileId: roleAssignment._id,
    });

    return 'Registered successfully';
  }

  async signIn(
    employeeNumber: string,
    password: string
  ): Promise<{ access_token: string; payload: { userid: Types.ObjectId; roles: string[]; status: string } }> {
    // Check if password is empty
    if (!password || password.trim() === '') {
      throw new UnauthorizedException('Password is required');
    }

    const employee = await this.employeeProfileModel
      .findOne({ employeeNumber })
      .populate('accessProfileId');

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (!employee.password) {
      throw new UnauthorizedException('Password not set for this employee');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = employee.accessProfileId
      ? (employee.accessProfileId as any).roles || ['department employee']
      : ['department employee'];

    const payload = {
      userid: employee._id,
      roles,
      employeeNumber: employee.employeeNumber,
      email: employee.workEmail,
      status: employee.status, // BR-3j: Include employee status in JWT
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      payload: {
        userid: employee._id,
        roles,
        status: employee.status,
      },
    };
  }

  async findByEmployeeNumber(employeeNumber: string) {
    return this.employeeProfileModel.findOne({ employeeNumber });
  }

  async candidateLogin(
    email: string,
    password: string
  ): Promise<{ access_token: string; payload: { userid: Types.ObjectId; userType: string; status: string } }> {
    // Check if password is empty
    if (!password || password.trim() === '') {
      throw new UnauthorizedException('Password is required');
    }

    const candidate = await this.candidateModel
      .findOne({ personalEmail: email.toLowerCase() });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (!candidate.password) {
      throw new UnauthorizedException('Password not set for this candidate');
    }

    const isPasswordValid = await bcrypt.compare(password, candidate.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userid: candidate._id,
      userType: 'candidate',
      candidateNumber: candidate.candidateNumber,
      email: candidate.personalEmail,
      status: candidate.status,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      payload: {
        userid: candidate._id,
        userType: 'candidate',
        status: candidate.status,
      },
    };
  }
}
