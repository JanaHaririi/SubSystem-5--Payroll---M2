import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Onboarding, OnboardingDocument } from '../models/onboarding.schema';
import { Contract, ContractDocument } from '../models/contract.schema';
import { CreateOnboardingTaskDto } from '../dto/create-onboarding-task.dto';
import { UpdateOnboardingTaskDto } from '../dto/update-onboarding-task.dto';
//import { OnboardingTaskStatus } from 'src/enums/onboarding-task-status.enum';
import { NotificationLogService } from 'src/time-management/services/notification-log.service'; 
import { Offer , OfferDocument } from '../models/offer.schema';
import { CreateContractDto } from '../dto/create-onboarding-contract.dto';
import { UpdateContractDto } from '../dto/update-onboarding-contract.dto';
import { CreateOnboardingDocumentDto } from '../dto/create-onboarding-document.dto';
import { UpdateOnboardingDocumentDto } from '../dto/update-onboarding-document.dto';
import { DocumentDocument } from '../models/document.schema';
import { Application , ApplicationDocument} from '../models/application.schema';
import { ApplicationStatus } from '../enums/application-status.enum';
import { Document } from '../models/document.schema';
//ERRORS WILL DISSAPEAR ONCE ALL IS MERGED INTO MAIN -DO NOT REMOVE ANYTHING
import { EmployeeProfileService } from 'src/employee-profile/employee-profile.service';
import { EmployeeStatus, SystemRole } from 'src/employee-profile/enums/employee-profile.enums';
import { PayrollExecutionService } from 'src/payroll-execution/payroll-execution.service';
import { payrollRuns } from 'src/payroll-execution/models/payrollRuns.schema';
import { employeePayrollDetails } from 'src/payroll-execution/models/employeePayrollDetails.schema';
import { employeeSigningBonus } from 'src/payroll-execution/models/EmployeeSigningBonus.schema';
import { signingBonus } from 'src/payroll-configuration/models/signingBonus.schema';
//import { PayrollExecutionService } from 'src/external-controller-services/services/payroll-execution-service.service';
import { EmployeeRoleService } from 'src/employee-profile/services/employee-role.service';
import { AuthService } from 'src/auth/auth.service';
import { PayrollConfigurationService } from 'src/payroll-configuration/payroll-configuration.service';
import { ConfigStatus } from 'src/payroll-configuration/enums/payroll-configuration-enums';
import { BonusStatus, PayRollStatus } from 'src/payroll-execution/enums/payroll-execution-enum';
import { customAlphabet } from 'nanoid';


@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(Onboarding.name)
    private readonly onboardingModel: Model<OnboardingDocument>,
    
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,

    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,

    @InjectModel(Document.name)
    private readonly documentModel: Model<DocumentDocument>,

    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,

    @InjectModel(employeeSigningBonus.name)
    private readonly employeeSigningBonusModel: Model<employeeSigningBonus>,

    @InjectModel(employeePayrollDetails.name)
    private readonly employeePayrollDetailsModel: Model<employeePayrollDetails>,

    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,

    @InjectModel(signingBonus.name)
    private readonly signingBonusConfigModel: Model<signingBonus>,
    
    private readonly notificationLogService: NotificationLogService,

    private readonly employeeCrudService: EmployeeProfileService ,

    private readonly payrollExecutionService : PayrollExecutionService ,

    private readonly employeeRoleService : EmployeeRoleService ,

    private readonly authService : AuthService  ,

    private readonly payrollConfigurationService :PayrollConfigurationService 
    

  ) {}

  // contract related services

  async createContract(contractData: CreateContractDto): Promise<ContractDocument> {
    const newContract = new this.contractModel(contractData);
    return newContract.save();
  }

  async getAllContracts(): Promise<ContractDocument[]> {
    return this.contractModel.find().populate('offerId').populate('documentId').exec();
  }

  async getContractById(contractId: string): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(contractId).populate('offerId').populate('documentId').exec();

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    return contract;
  }

    async getContractByOfferId(offerId: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findOne({ offerId: offerId })
      .populate('offerId')
      .populate('documentId')
      .exec();

    if (!contract) {
      throw new NotFoundException(`Contract for offer ID ${offerId} not found`);
    }

    return contract;
  }

  
  async updateContract(contractId: string, contractData: UpdateContractDto): Promise<ContractDocument> {

    const currentContract = await this.contractModel.findById(contractId);
    if (!currentContract) {throw new NotFoundException(`Contract with ID ${contractId} not found`);}

    const updatedContract = await this.contractModel.findByIdAndUpdate(contractId, contractData, { new: true });

    if (!updatedContract) {throw new NotFoundException(`Contract with ID ${contractId} not found`);}

    // Get offer details
    const offer = await this.offerModel.findById(currentContract.offerId).exec();
    if (!offer) { throw new NotFoundException('Offer not found');}

    const candidateID = offer.candidateId;
    const hrManagerID = offer.hrEmployeeId;

    // Trigger: Check if employee signed
    if (!currentContract.employeeSignedAt && updatedContract.employeeSignedAt) {
      await this.notificationLogService.sendNotification({
        to: hrManagerID,
        type: 'Contract Signed by Employee',
        message: `Employee has signed the contract for offer ${updatedContract.offerId}`,
      });
    }

    // Trigger: Check if employer signed
    if (!currentContract.employerSignedAt && updatedContract.employerSignedAt) {
      await this.notificationLogService.sendNotification({
        to: candidateID,
        type: 'Contract Fully Executed',
        message: 'Your employment contract has been fully signed. Welcome aboard!',
      });
    }

    // Trigger: Both signatures complete - update to HIRED and trigger all systems
    if ( updatedContract.employeeSignatureUrl && updatedContract.employerSignedAt &&
      (!currentContract.employeeSignedAt || !currentContract.employerSignedAt)) {

      //update application to hired
      const application = await this.applicationModel.findById(offer.applicationId);
      if (application) {
        await this.applicationModel.findByIdAndUpdate(offer.applicationId,
          { status: ApplicationStatus.HIRED },
          { new: true }
        );

        //  provision system access (payroll, email, internal systems), so that the employee can work via notification

        const payrollManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.PAYROLL_MANAGER);

        if (!payrollManagers || payrollManagers.length === 0) throw new NotFoundException('Payroll Managers not found');

        const payrollManager = payrollManagers[0];

        const systemAdmins = await this.employeeRoleService.getEmployeesByRole(SystemRole.SYSTEM_ADMIN);

        if (!systemAdmins || systemAdmins.length === 0) throw new NotFoundException('System Admins managers not found');

        const systemAdmin = systemAdmins[0];

          //send notification to a payroll mananger
         await this.notificationLogService.sendNotification({
            to: payrollManager.employeeProfileId,
            type: 'Payroll provisioning required',
            message: `Require payroll provisioning for new hire ${candidateID}`,
          });

          //send notification for system access provisioning
           await this.notificationLogService.sendNotification({
            to: systemAdmin.employeeProfileId,
            type: 'System access provisioning required',
            message: `Require requires system access provisioning for new hire ${candidateID}`,
          }); 

          //send notification for email access provisioning
           await this.notificationLogService.sendNotification({
            to: systemAdmin.employeeProfileId,
            type: 'Email access provisioning required',
            message: `Require Email system access provisioning for new hire ${candidateID}`,
          }); 

          await this.notificationLogService.sendNotification({
          to: systemAdmin.employeeProfileId,
          type: 'New Hire Equipment Setup Required',
          message: `New hire equipment and workspace setup needed for employee ID: ${offer.candidateId}. Please reserve: desk, laptop, access card, and other equipment.`,
        });

        //As a HR Manager, I want automated account provisioning (SSO/email/tools) on start date and scheduled revocation on exit, so access is consistent and secure. Will regsiter a new employee account automatically

        try {
        const nanoid = customAlphabet('0123456789', 4);
        const employeeNumber = `EMP-${nanoid()}`;
        const emailUsername = employeeNumber.replace(/-/g, ''); // "EMP4821"
        
        const registerData = {
          employeeNumber: employeeNumber,
          workEmail: `${emailUsername}@gmail.com`,
          password: "password@resetThis",
          firstName: '--',
          lastName: '--',
          nationalId: `PENDING-${employeeNumber}`,
          dateOfHire: new Date().toISOString(),
        };
        const result = await this.authService.register(registerData);
        console.log(result);

        // Send notification with the data we already have
        await this.notificationLogService.sendNotification({
          to: candidateID,
          type: 'Employee Credentials',
          message: `Your employee account has been created. Login credentials - Email: ${registerData.workEmail}, Password: ${registerData.password} ,Employee Number: ${registerData.employeeNumber} . Please reset your password after first login and add your actual national id.`,
        });
        
        console.log(` Employee account provisioned: ${employeeNumber}`);

          //   if (updatedContract.signingBonus && updatedContract.signingBonus > 0) {
          //   const bonusResult = await this.payrollExecutionService.createEmployeeSigningBonuses([
          //   result //result returned is already the id
          // ]);
          // console.log('Employee signing bonuses created:', bonusResult);

          // }

           // const newSigningBonus = await this.payrollConfigurationService.createSigningBonuses({
      //       //   positionName: updatedContract.role,
      //       //   amount: updatedContract.signingBonus,
      //       //   status: ConfigStatus.DRAFT
      //       // });
            

      //       // await this.payrollExecutionService.approveSigningBonus(newSigningBonus?.id);

      //       const bonusResult = await this.payrollExecutionService.createEmployeeSigningBonuses([
      //       //offer.candidateId.toString()
      //       result.id;
      //     ]);
      //     console.log('Employee signing bonuses created:', bonusResult);
      //     }


            if (updatedContract.signingBonus && updatedContract.signingBonus > 0) {
        try {
          console.log(' Creating signing bonus template..');
          
          // 1. Create the signing bonus configuration/template
          const newSigningBonus = await this.payrollConfigurationService.createSigningBonuses({
            positionName: updatedContract.role,
            amount: updatedContract.signingBonus,
            status: ConfigStatus.APPROVED
          });

          // ✅ Check if creation was successful
          if (!newSigningBonus) {
            throw new Error('Failed to create signing bonus template');
          }

          console.log(' Signing bonus template created:', newSigningBonus._id);

          // 2. Create employee signing bonus record directly
          const employeeSigningBonus = await this.employeeSigningBonusModel.create({
            employeeId: new Types.ObjectId(result),
            signingBonusId: newSigningBonus._id,
            status: BonusStatus.PENDING,
          });

          console.log(' Employee signing bonus created:', employeeSigningBonus._id);

          // 3. Approve it
          await this.payrollExecutionService.approveSigningBonus(employeeSigningBonus._id.toString());
          
          console.log(' Signing bonus approved successfully');

        } catch (error) {
          console.error(' Error processing signing bonus:', error);
          
          await this.notificationLogService.sendNotification({
            to: hrManagerID,
            type: 'Signing Bonus Processing Failed',
            message: `Failed to process signing bonus for employee ${result}. Position: ${updatedContract.role}, Amount: $${updatedContract.signingBonus}. Error: ${error.message}. Please process manually.`,
          });
        }
      }

      } catch (error) {
        console.error(' Failed to provision employee account:', error);
        throw error;
      }
      
      //As a HR Manager, I want the system to automatically process signing bonuses based on contract after a new hire is signed. which means you need to trigger service that fills collection that relates user to signing Bonuswhich is in payroll execution module


      //As a HR Manager, I want the system to automatically handle payroll initiation based on the contract signing day for the current payroll cycle. just setting start date if done in any prev phase you can skip since it is handled

      //As a HR Manager, I want the system to automatically handle payroll initiation based on the contract signing day for the current payroll cycle.
 try {
  const contractSigningDate = updatedContract.employerSignedAt || new Date();
  
  const payrollPeriodEnd = new Date(
    contractSigningDate.getFullYear(),
    contractSigningDate.getMonth() + 1,
    0
  );

  console.log('📅 Looking for payroll period:', payrollPeriodEnd.toISOString());

  //  Create completely independent Date objects using the timestamp
  const startOfDay = new Date(payrollPeriodEnd.getTime());
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(payrollPeriodEnd.getTime());
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  console.log(' Date range:', startOfDay.toISOString(), 'to', endOfDay.toISOString());

  const existingPayrollRun = await this.payrollRunsModel.findOne({ 
    payrollPeriod: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: PayRollStatus.DRAFT
  }).exec();

  if (!existingPayrollRun) {
    console.warn(' No draft payroll run found for this period:', payrollPeriodEnd.toISOString());
  } else {
    console.log(` Found existing draft payroll run: ${existingPayrollRun.runId}`);
    
    const initiationResult = await this.payrollExecutionService.startPayrollInitiation({
      payrollRunId: existingPayrollRun._id.toString(),
      payrollSpecialistId: payrollManager.id.toString(),
    });
    
    console.log(`✅ Payroll initiation started: ${initiationResult.message}`);
  }
} catch (error) {
  console.error('❌ Error handling payroll initiation:', error);
}
      }
    }

    return updatedContract;
  }

  //document services - will allow upload and get

  async createOnboardingDocument(documentData: CreateOnboardingDocumentDto): Promise<DocumentDocument> {
    const newDocument = new this.documentModel(documentData);
    return newDocument.save();
  }

  async getAllOnboardingDocuments(): Promise<DocumentDocument[]> {
    return this.documentModel.find().exec();
  }

  async getOnboardingDocument(id: string): Promise<DocumentDocument> {
    const document = await this.documentModel.findById(id).exec();
    if (!document) throw new NotFoundException('Onboarding document not found');
    return document;
  }

  async getDocumentsByOwner(ownerId: string): Promise<DocumentDocument[]> {
    return this.documentModel.find({ ownerId }).exec();
  }

  async updateOnboardingDocument(id: string,documentData: UpdateOnboardingDocumentDto): Promise<DocumentDocument> {
    const updatedDocument = await this.documentModel.findByIdAndUpdate(id,documentData,{ new: true, runValidators: true });

    if (!updatedDocument)
      throw new NotFoundException('Onboarding document not found');

    return updatedDocument;
  }

  async deleteOnboardingDocument(id: string): Promise<DocumentDocument> {
    const deletedDocument = await this.documentModel.findByIdAndDelete(id).exec();

    if (!deletedDocument)
      throw new NotFoundException('Onboarding document not found');

    return deletedDocument;
  }

  // onboarding task services

  async createOnboardingTask(createOnboardingDto: CreateOnboardingTaskDto): Promise<OnboardingDocument> {

    const onboarding = await this.onboardingModel.create(createOnboardingDto);

    return onboarding;

  }

  async getAllTasks(): Promise<OnboardingDocument[]> {

    return this.onboardingModel.find()/*.populate('employeeId')*/.exec();
  }

  async getTaskById(taskId: string): Promise<OnboardingDocument> {
    const onboarding = await this.onboardingModel.findById(taskId)/*.populate('employeeId')*/.exec();

    if (!onboarding) {
      throw new NotFoundException(`Onboarding record with ID ${taskId} not found`);
    }

    return onboarding;
  }

  async getTasksByEmployeeId(employeeId: string): Promise<OnboardingDocument[]> {
  const tasks = await this.onboardingModel
    .find({ employeeId }) // field name in schema
    /* .populate('employeeId') */
    .exec();

  if (!tasks || tasks.length === 0) {
    throw new NotFoundException(
      `No onboarding tasks found for employee ID ${employeeId}`,
    );
  }

  return tasks;
}


  async updateOnboardingTask(id: string, updateOnboardingDto: UpdateOnboardingTaskDto): Promise<OnboardingDocument> {

    const updatedOnboarding = await this.onboardingModel.findByIdAndUpdate(id,updateOnboardingDto,{ new: true });

    if (!updatedOnboarding) throw new NotFoundException('Onboarding not found');



    return updatedOnboarding;

  }

  async deleteTask(taskId: string, taskIndex: number): Promise<OnboardingDocument> {
    const onboarding = await this.onboardingModel.findById(taskId);

    if (!onboarding) {
      throw new NotFoundException(`Onboarding record with ID ${taskId} not found`);
    }

    if (taskIndex < 0 || taskIndex >= onboarding.tasks.length) {
      throw new BadRequestException('Invalid task index');
    }

    // Remove task from array
    onboarding.tasks.splice(taskIndex, 1);

    return onboarding.save();
  }

  async deleteOnboardingRecord(onboardingId: string): Promise<void> {
    const result = await this.onboardingModel.findByIdAndDelete(onboardingId);
    if (!result) {
      throw new NotFoundException(`Onboarding record with ID ${onboardingId} not found`);
    }
  }
}


//extras

// async deleteContract(contractId: string): Promise<void> {
//   const result = await this.contractModel.findByIdAndDelete(contractId);
//   if (!result) {
//     throw new NotFoundException(`Contract with ID ${contractId} not found`);
//   }
// }

// async getTasksByEmployee(employeeId: string): Promise<OnboardingDocument> {
//   const onboarding = await this.onboardingModel.findOne({ employeeId: new Types.ObjectId(employeeId) }).populate('employeeId').exec();

//   if (!onboarding) {
//     throw new NotFoundException(`Onboarding record for employee ${employeeId} not found`);
//   }

//   return onboarding;
// }