import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { EmployeeProfile } from './models/employee-profile.schema';
import { EmployeeSystemRole } from './models/employee-system-role.schema';
import { EmployeeStatus, Gender, MaritalStatus, SystemRole } from './enums/employee-profile.enums';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const employeeProfileModel = app.get<Model<EmployeeProfile>>(getModelToken(EmployeeProfile.name));
  const employeeSystemRoleModel = app.get<Model<EmployeeSystemRole>>(getModelToken(EmployeeSystemRole.name));

  try {
    // Clear existing data
    await employeeProfileModel.deleteMany({});
    await employeeSystemRoleModel.deleteMany({});
    console.log('Cleared existing employee profile and role data');

    // Hash default password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Employee Profiles
    const employee1 = await employeeProfileModel.create({
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      nationalId: '29005151234567',
      password: hashedPassword,
      gender: Gender.MALE,
      dateOfBirth: new Date('1990-05-15'),
      maritalStatus: MaritalStatus.SINGLE,
      workEmail: 'john.doe@company.com',
      personalEmail: 'john.doe@email.com',
      mobilePhone: '+201234567890',
      dateOfHire: new Date('2020-01-15'),
      status: EmployeeStatus.ACTIVE,
    });

    const employee2 = await employeeProfileModel.create({
      employeeNumber: 'EMP002',
      firstName: 'Sarah',
      lastName: 'Smith',
      fullName: 'Sarah Smith',
      nationalId: '28808221234568',
      password: hashedPassword,
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1988-08-22'),
      maritalStatus: MaritalStatus.MARRIED,
      workEmail: 'sarah.smith@company.com',
      personalEmail: 'sarah.smith@email.com',
      mobilePhone: '+201234567891',
      dateOfHire: new Date('2019-03-10'),
      status: EmployeeStatus.ACTIVE,
    });

    const employee3 = await employeeProfileModel.create({
      employeeNumber: 'EMP003',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      fullName: 'Ahmed Hassan',
      nationalId: '29212031234569',
      password: hashedPassword,
      gender: Gender.MALE,
      dateOfBirth: new Date('1992-12-03'),
      maritalStatus: MaritalStatus.SINGLE,
      workEmail: 'ahmed.hassan@company.com',
      personalEmail: 'ahmed.hassan@email.com',
      mobilePhone: '+201234567892',
      dateOfHire: new Date('2021-06-01'),
      status: EmployeeStatus.ACTIVE,
    });

    const employee4 = await employeeProfileModel.create({
      employeeNumber: 'EMP004',
      firstName: 'Fatima',
      lastName: 'Ali',
      fullName: 'Fatima Ali',
      nationalId: '29503181234570',
      password: hashedPassword,
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1995-03-18'),
      maritalStatus: MaritalStatus.SINGLE,
      workEmail: 'fatima.ali@company.com',
      personalEmail: 'fatima.ali@email.com',
      mobilePhone: '+201234567893',
      dateOfHire: new Date('2022-01-20'),
      status: EmployeeStatus.ACTIVE,
    });

    const hrAdmin = await employeeProfileModel.create({
      employeeNumber: 'HR001',
      firstName: 'Mohamed',
      lastName: 'Ibrahim',
      fullName: 'Mohamed Ibrahim',
      nationalId: '28507101234571',
      password: hashedPassword,
      gender: Gender.MALE,
      dateOfBirth: new Date('1985-07-10'),
      maritalStatus: MaritalStatus.MARRIED,
      workEmail: 'mohamed.ibrahim@company.com',
      personalEmail: 'mohamed.ibrahim@email.com',
      mobilePhone: '+201234567894',
      dateOfHire: new Date('2018-01-05'),
      status: EmployeeStatus.ACTIVE,
    });

    const hrManager = await employeeProfileModel.create({
      employeeNumber: 'HR002',
      firstName: 'Layla',
      lastName: 'Ahmed',
      fullName: 'Layla Ahmed',
      nationalId: '28711251234572',
      password: hashedPassword,
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1987-11-25'),
      maritalStatus: MaritalStatus.MARRIED,
      workEmail: 'layla.ahmed@company.com',
      personalEmail: 'layla.ahmed@email.com',
      mobilePhone: '+201234567895',
      dateOfHire: new Date('2017-09-12'),
      status: EmployeeStatus.ACTIVE,
    });

    const sysAdmin = await employeeProfileModel.create({
      employeeNumber: 'SYS001',
      firstName: 'Omar',
      lastName: 'Mahmoud',
      fullName: 'Omar Mahmoud',
      nationalId: '29004151234573',
      password: hashedPassword,
      gender: Gender.MALE,
      dateOfBirth: new Date('1990-04-15'),
      maritalStatus: MaritalStatus.SINGLE,
      workEmail: 'omar.mahmoud@company.com',
      personalEmail: 'omar.mahmoud@email.com',
      mobilePhone: '+201234567896',
      dateOfHire: new Date('2019-05-20'),
      status: EmployeeStatus.ACTIVE,
    });

    // Create System Roles for each employee
    const emp1Role = await employeeSystemRoleModel.create({
      employeeProfileId: employee1._id,
      roles: [SystemRole.DEPARTMENT_EMPLOYEE],
      isActive: true,
    });

    const emp2Role = await employeeSystemRoleModel.create({
      employeeProfileId: employee2._id,
      roles: [SystemRole.DEPARTMENT_HEAD],
      isActive: true,
    });

    const emp3Role = await employeeSystemRoleModel.create({
      employeeProfileId: employee3._id,
      roles: [SystemRole.DEPARTMENT_EMPLOYEE],
      isActive: true,
    });

    const emp4Role = await employeeSystemRoleModel.create({
      employeeProfileId: employee4._id,
      roles: [SystemRole.DEPARTMENT_EMPLOYEE],
      isActive: true,
    });

    const hrAdminRole = await employeeSystemRoleModel.create({
      employeeProfileId: hrAdmin._id,
      roles: [SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE],
      isActive: true,
    });

    const hrManagerRole = await employeeSystemRoleModel.create({
      employeeProfileId: hrManager._id,
      roles: [SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE],
      isActive: true,
    });

    const sysAdminRole = await employeeSystemRoleModel.create({
      employeeProfileId: sysAdmin._id,
      roles: [SystemRole.SYSTEM_ADMIN],
      isActive: true,
    });

    // Update employees with accessProfileId
    await employeeProfileModel.findByIdAndUpdate(employee1._id, { accessProfileId: emp1Role._id });
    await employeeProfileModel.findByIdAndUpdate(employee2._id, { accessProfileId: emp2Role._id });
    await employeeProfileModel.findByIdAndUpdate(employee3._id, { accessProfileId: emp3Role._id });
    await employeeProfileModel.findByIdAndUpdate(employee4._id, { accessProfileId: emp4Role._id });
    await employeeProfileModel.findByIdAndUpdate(hrAdmin._id, { accessProfileId: hrAdminRole._id });
    await employeeProfileModel.findByIdAndUpdate(hrManager._id, { accessProfileId: hrManagerRole._id });
    await employeeProfileModel.findByIdAndUpdate(sysAdmin._id, { accessProfileId: sysAdminRole._id });

    console.log('\n✅ Employee profiles and roles seed completed successfully!');
    console.log('\nSample Employee IDs for testing:');
    console.log('  Employee 1 (John Doe):', employee1._id);
    console.log('  Employee 2 (Sarah Smith - Manager):', employee2._id);
    console.log('  Employee 3 (Ahmed Hassan):', employee3._id);
    console.log('  Employee 4 (Fatima Ali):', employee4._id);
    console.log('  HR Admin (Mohamed Ibrahim):', hrAdmin._id);
    console.log('  HR Manager (Layla Ahmed):', hrManager._id);
    console.log('  System Admin (Omar Mahmoud):', sysAdmin._id);

    console.log('\nYou can test the API with these employee IDs!');

  } catch (error) {
    console.error('Error seeding employee profiles:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
