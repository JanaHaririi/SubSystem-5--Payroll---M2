import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppraisalTemplate,   AppraisalTemplateDocument } from './models/appraisal-template.schema';
import { AppraisalCycle,   AppraisalCycleDocument } from './models/appraisal-cycle.schema';
import { AppraisalAssignment,   AppraisalAssignmentDocument } from './models/appraisal-assignment.schema';
import { AppraisalRecord,   AppraisalRecordDocument } from './models/appraisal-record.schema';
import { AppraisalDispute, AppraisalDisputeDocument } from './models/appraisal-dispute.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { Department } from '../organization-structure/models/department.schema';
import { AppraisalCycleStatus,  AppraisalAssignmentStatus,
    AppraisalRecordStatus, AppraisalDisputeStatus,} from '../performance/enums/performance.enums';
import { NotificationLogService } from '../time-management/services/notification-log.service';

@Injectable()
export class PerformanceService {
    constructor(
        @InjectModel(AppraisalTemplate.name)
        private appraisalTemplateModel: Model<AppraisalTemplateDocument>,
        @InjectModel(AppraisalCycle.name)
        private appraisalCycleModel: Model<AppraisalCycleDocument>,
        @InjectModel(AppraisalAssignment.name)
        private appraisalAssignmentModel: Model<AppraisalAssignmentDocument>,
        @InjectModel(AppraisalRecord.name)
        private appraisalRecordModel: Model<AppraisalRecordDocument>,
        @InjectModel(AppraisalDispute.name)
        private appraisalDisputeModel: Model<AppraisalDisputeDocument>,
        @InjectModel(Department.name)
        private departmentModel: Model<Department>,
        @InjectModel(EmployeeProfile.name)
        private employeeProfileModel: Model<EmployeeProfileDocument>,
        private notificationLogService: NotificationLogService,
    ) {}

    private toObjectId(value: any) {
        if (!value) return undefined;
        if (value instanceof Types.ObjectId) return value;
        try {
            return new Types.ObjectId(value);
        } catch {
            return undefined;
        }
    }

    async createDispute(dto: any){
        // 1. Convert all IDs coming from request
        const appraisalId = this.toObjectId(dto.appraisalId);
        const assignmentId = this.toObjectId(dto.assignmentId);
        const cycleId = this.toObjectId(dto.cycleId);
        const employeeId = this.toObjectId(dto.raisedByEmployeeId);

        // 2. FIX the bad cycle document BEFORE ANYTHING FAILS
        await this.appraisalCycleModel.updateOne(
            { _id: cycleId },
            {
            $set: {
                "templateAssignments.0.templateId": this.toObjectId(dto.templateId),
                "templateAssignments.0.departmentIds.0": this.toObjectId(
                dto.departmentId
                )
            }
            }
        );

        // 3. Create the dispute safely
        const dispute = new this.appraisalDisputeModel({
            appraisalId,
            assignmentId,
            cycleId,
            raisedByEmployeeId: employeeId,
            reason: dto.reason,
            details: dto.details,
        });

        return dispute.save(); // no more _id issues
    }

    // Appraisal Template Methods
    async createAppraisalTemplate(createTemplateDto: any) {
        const template = new this.appraisalTemplateModel(createTemplateDto);
        return await template.save();
    }

    async getAllAppraisalTemplates() {
        return await this.appraisalTemplateModel
      .find({ isActive: true })
      .exec();
    }

    async getAppraisalTemplateById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid template ID');
        }
        const template = await this.appraisalTemplateModel
        .findById(id)
        .exec();
        
        if (!template) {
            throw new NotFoundException('Appraisal template not found');
        }
        return template;
    }

    async updateAppraisalTemplate(id: string, updateTemplateDto: any) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid template ID');
        }
        
        const template = await this.appraisalTemplateModel
        .findByIdAndUpdate(id, updateTemplateDto, { new: true })
        .exec();
        
        if (!template) {
            throw new NotFoundException('Appraisal template not found');
        }
        return template;
    }

    // Appraisal Cycle Methods
    async createAppraisalCycle(createCycleDto: any) {
        // Validate dates
        if (new Date(createCycleDto.startDate) >= new Date(createCycleDto.endDate)) {
            throw new BadRequestException('Start date must be before end date');
        }

        const cycle = new this.appraisalCycleModel(createCycleDto);
        return await cycle.save();
    }

    async getAllAppraisalCycles() {
        return await this.appraisalCycleModel
            .find()
            // REMOVE the broken populates
            .sort({ startDate: -1 })
            .exec();
    }


    async getAppraisalCycleById(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid cycle ID');
        }

        return await this.appraisalCycleModel
            .findById(id)
            // REMOVE broken populate lines
            .exec();
    }


    async updateAppraisalCycleStatus(id: string, status: AppraisalCycleStatus) {
        if (!Types.ObjectId.isValid(id)) {
            throw new NotFoundException('Invalid cycle ID');
        }

        const updateData: any = { status };
        
        // Set timestamps based on status changes
        if (status === AppraisalCycleStatus.ACTIVE) {
        updateData.publishedAt = new Date();
        } 
        else if (status === AppraisalCycleStatus.CLOSED) {
        updateData.closedAt = new Date();
        } 
        else if (status === AppraisalCycleStatus.ARCHIVED) {
        updateData.archivedAt = new Date();
        }

        const cycle = await this.appraisalCycleModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
        
        if (!cycle) {
            throw new NotFoundException('Appraisal cycle not found');
        }
        return cycle;
    }

    async getAppraisalAssignmentsByCycle(cycleId: string) {
        if (!Types.ObjectId.isValid(cycleId)) {
            throw new NotFoundException('Invalid cycle ID');
        }

        // Get assignments without populate first to avoid casting errors
        const assignments = await this.appraisalAssignmentModel
            .find({
                cycleId,
                templateId: { $ne: '<templateId>' } // Exclude placeholder values
            })
            .lean()
            .exec();

        // Manually populate the references with validation
        for (const assignment of assignments) {
            try {
                if (assignment.employeeProfileId && Types.ObjectId.isValid(assignment.employeeProfileId)) {
                    (assignment as any).employeeProfileId = await this.employeeProfileModel
                        .findById(assignment.employeeProfileId)
                        .select('firstName lastName employeeNumber primaryPositionId')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate employeeProfileId:', err.message);
            }

            try {
                if (assignment.managerProfileId && Types.ObjectId.isValid(assignment.managerProfileId)) {
                    (assignment as any).managerProfileId = await this.employeeProfileModel
                        .findById(assignment.managerProfileId)
                        .select('firstName lastName employeeNumber')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate managerProfileId:', err.message);
            }

            try {
                if (assignment.templateId && Types.ObjectId.isValid(assignment.templateId)) {
                    (assignment as any).templateId = await this.appraisalTemplateModel
                        .findById(assignment.templateId)
                        .select('name templateType')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate templateId:', err.message);
            }

            try {
                if (assignment.departmentId && Types.ObjectId.isValid(assignment.departmentId)) {
                    (assignment as any).departmentId = await this.departmentModel
                        .findById(assignment.departmentId)
                        .select('name')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate departmentId:', err.message);
            }
        }

        return assignments as any;
    }
    

    // Appraisal Assignment Methods
    async createAppraisalAssignments(cycleId: string) {
        console.log("📆 Appraisal cycle assignment started:", cycleId);

        if (!Types.ObjectId.isValid(cycleId)) {
            throw new NotFoundException('Invalid cycle ID');
        }

        const cycle = await this.appraisalCycleModel
            .findById(cycleId)
            .exec();

        if (!cycle) {
            console.error("❌ ERROR: Appraisal cycle not found");
            throw new NotFoundException('Appraisal cycle not found');
        }

        console.log("📋 Cycle:", cycle.name);

        if (!cycle.templateAssignments || cycle.templateAssignments.length === 0) {
            console.error("❌ ERROR: Cycle has no template assignments");
            throw new BadRequestException('Cycle has no template assignments');
        }

        // ⭐ Pull required fields from cycle so we satisfy schema
        const templateId = cycle.templateAssignments[0].templateId;
        const departmentIds = cycle.templateAssignments[0].departmentIds;

        console.log("📁 Cycle departments:", departmentIds);
        console.log("📋 Template ID:", templateId);

        const createdAssignments: AppraisalAssignmentDocument[] = [];
        let skippedCount = 0;

        // Fetch employees in the specified departments
        const EmployeeProfileModel = this.appraisalAssignmentModel.db.model('EmployeeProfile');
        const PositionModel = this.appraisalAssignmentModel.db.model('Position');

        // Filter employees by departments in the cycle
        const employees = await EmployeeProfileModel.find({
            primaryDepartmentId: { $in: departmentIds },
            status: 'ACTIVE'
        }).exec();

        console.log("👥 Employees in specified departments:", employees.length);

        for (const emp of employees) {
            console.log("👤 Employee:", emp._id);
            console.log("📌 Employee supervisorPositionId:", emp.supervisorPositionId);
            console.log("📌 Employee departmentId:", emp.primaryDepartmentId);
            console.log("📌 Employee positionId:", emp.primaryPositionId);

            const existing = await this.appraisalAssignmentModel.findOne({
                cycleId,
                employeeProfileId: emp._id,
            });

            if (existing) {
                console.log("⏭️ Skipping - assignment already exists");
                continue;
            }

            // 👔 Resolve manager for this employee
            console.log("👔 Resolving manager for employee");
            let managerProfileId = null;

            if (emp.supervisorPositionId) {
                // Find manager who holds the supervisor position
                const manager = await EmployeeProfileModel.findOne({
                    primaryPositionId: emp.supervisorPositionId,
                    status: 'ACTIVE'
                }).exec();

                if (manager) {
                    managerProfileId = manager._id;
                    console.log("👔 Manager found:", manager._id);
                    console.log("👔 Manager primaryPositionId:", manager.primaryPositionId);
                } else {
                    console.warn("⚠️ SKIPPING: No active employee holds supervisorPositionId:", emp.supervisorPositionId);
                    console.warn("   Employee:", emp.employeeNumber, "-", emp.firstName, emp.lastName);
                    console.warn("   This position may be vacant or the employee may not be ACTIVE");
                    console.warn("   Cannot create assignment - manager is required");
                    skippedCount++;
                    continue;
                }
            } else {
                console.warn("⚠️ SKIPPING: Employee has NO supervisorPositionId set");
                console.warn("   Employee:", emp.employeeNumber, "-", emp.firstName, emp.lastName);
                console.warn("   Department:", emp.primaryDepartmentId);
                console.warn("   Position:", emp.primaryPositionId);
                console.warn("   Cannot create assignment - manager is required");
                skippedCount++;
                continue;
            }

            console.log("📝 Creating appraisal assignment:", {
                employeeProfileId: emp._id,
                managerProfileId,
                departmentId: emp.primaryDepartmentId,
                positionId: emp.primaryPositionId,
                cycleId,
                templateId,
            });

            const newAssignment = new this.appraisalAssignmentModel({
                cycleId,
                templateId,
                employeeProfileId: emp._id,
                managerProfileId,
                departmentId: emp.primaryDepartmentId,
                positionId: emp.primaryPositionId,
                status: AppraisalAssignmentStatus.NOT_STARTED,
                assignedAt: new Date(),
            });

            const saved = await newAssignment.save();
            createdAssignments.push(saved);
            console.log("✅ Assignment created:", saved._id);

            // Send notification to employee about new assignment
            await this.notificationLogService.sendNotification({
                to: new Types.ObjectId(emp._id.toString()),
                type: 'Performance Appraisal Assignment',
                message: `You have been assigned a new performance appraisal for cycle: ${cycle.name}. Your manager will evaluate your performance.`,
            });
        }

        console.log("📊 Total assignments created:", createdAssignments.length);
        if (createdAssignments.length === 0) {
            console.warn("⚠️ No assignments created — check departments list and employee filtering rules");
        }

        console.log(`✅ Created ${createdAssignments.length} assignments`);
        console.log(`⚠️ Skipped ${skippedCount} employees without managers`);
        return createdAssignments;
    }





    async getEmployeeAppraisals(employeeProfileId: string) {
        if (!Types.ObjectId.isValid(employeeProfileId)) {
            throw new NotFoundException('Invalid employee profile ID');
        }

        console.log('🔍 getEmployeeAppraisals called with:', employeeProfileId);
        console.log('   Type:', typeof employeeProfileId);

        const results = await this.appraisalAssignmentModel
        .find({ employeeProfileId: new Types.ObjectId(employeeProfileId) })
        .lean()
        .sort({ assignedAt: -1 })
        .exec();

        console.log('📊 Found assignments:', results.length);

        // Manually populate the references
        for (const assignment of results) {
            try {
                if (assignment.cycleId && Types.ObjectId.isValid(assignment.cycleId)) {
                    (assignment as any).cycleId = await this.appraisalCycleModel.findById(assignment.cycleId).select('name cycleType startDate endDate status').lean().exec();
                }
            } catch (err) {
                console.warn('Failed to populate cycleId:', err.message);
            }

            try {
                if (assignment.templateId && Types.ObjectId.isValid(assignment.templateId)) {
                    (assignment as any).templateId = await this.appraisalTemplateModel.findById(assignment.templateId).select('name templateType').lean().exec();
                }
            } catch (err) {
                console.warn('Failed to populate templateId:', err.message);
            }

            try {
                if (assignment.managerProfileId && Types.ObjectId.isValid(assignment.managerProfileId)) {
                    (assignment as any).managerProfileId = await this.employeeProfileModel.findById(assignment.managerProfileId).select('firstName lastName').lean().exec();
                }
            } catch (err) {
                console.warn('Failed to populate managerProfileId:', err.message);
            }

            try {
                if (assignment.departmentId && Types.ObjectId.isValid(assignment.departmentId)) {
                    (assignment as any).departmentId = await this.departmentModel.findById(assignment.departmentId).select('name').lean().exec();
                }
            } catch (err) {
                console.warn('Failed to populate departmentId:', err.message);
            }
        }

        return results as any;
    }

    async getSubmittedAssignments() {
        // Get all SUBMITTED assignments efficiently
        const assignments = await this.appraisalAssignmentModel
            .find({ status: AppraisalAssignmentStatus.SUBMITTED })
            .lean()
            .sort({ submittedAt: -1 })
            .exec();

        // Manually populate only what's needed for display
        for (const assignment of assignments) {
            try {
                if (assignment.employeeProfileId && Types.ObjectId.isValid(assignment.employeeProfileId)) {
                    (assignment as any).employeeProfileId = await this.employeeProfileModel
                        .findById(assignment.employeeProfileId)
                        .select('firstName lastName employeeNumber')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate employeeProfileId');
            }

            try {
                if (assignment.managerProfileId && Types.ObjectId.isValid(assignment.managerProfileId)) {
                    (assignment as any).managerProfileId = await this.employeeProfileModel
                        .findById(assignment.managerProfileId)
                        .select('firstName lastName')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate managerProfileId');
            }

            try {
                if (assignment.cycleId && Types.ObjectId.isValid(assignment.cycleId)) {
                    (assignment as any).cycleId = await this.appraisalCycleModel
                        .findById(assignment.cycleId)
                        .select('name')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate cycleId');
            }

            try {
                if (assignment.departmentId && Types.ObjectId.isValid(assignment.departmentId)) {
                    (assignment as any).departmentId = await this.departmentModel
                        .findById(assignment.departmentId)
                        .select('name')
                        .lean()
                        .exec();
                }
            } catch (err) {
                console.warn('Failed to populate departmentId');
            }
        }

        return assignments as any;
    }

    async getManagerAppraisalAssignments(managerProfileId: string, user?: any) {
        if (!Types.ObjectId.isValid(managerProfileId)) {
            throw new NotFoundException('Invalid manager profile ID');
        }

        // Get the manager's employee profile to check their department and role
        const managerProfile = await this.employeeProfileModel
            .findById(managerProfileId)
            .populate('accessProfileId')
            .exec();

        if (!managerProfile) {
            throw new NotFoundException('Manager profile not found');
        }

        console.log('👔 Fetching assignments for manager:', managerProfileId);
        console.log('   Manager department:', managerProfile.primaryDepartmentId);
        console.log('   User roles from JWT:', user?.roles);
        console.log('   Access profile:', managerProfile.accessProfileId);

        // Build query based on role
        let query: any;

        // Check if user is Department Head from multiple sources
        const userRoles = user?.roles || [];
        const accessProfileRoles = (managerProfile.accessProfileId as any)?.roles || [];
        const allRoles = [...userRoles, ...accessProfileRoles];

        console.log('   All roles combined:', allRoles);

        // Case-insensitive check for Department Head role
        const isDepartmentHead = allRoles.some(role =>
            role && role.toLowerCase().includes('department') && role.toLowerCase().includes('head')
        );

        if (isDepartmentHead && managerProfile.primaryDepartmentId) {
            console.log('✅ Department Head access - showing all department assignments');
            console.log('   Querying departmentId:', managerProfile.primaryDepartmentId);

            // Show all assignments in the manager's department
            query = { departmentId: managerProfile.primaryDepartmentId };
        } else {
            console.log('👤 Manager access - showing only direct reports');
            console.log('   Querying managerProfileId:', managerProfileId);

            // Show only assignments where this person is the manager
            query = { managerProfileId };
        }

        const assignments = await this.appraisalAssignmentModel
        .find(query)
        .populate('employeeProfileId', 'firstName lastName position')
        .populate('managerProfileId', 'firstName lastName')
        .populate('cycleId', 'name cycleType startDate endDate status')
        .populate('templateId', 'name templateType')
        .populate('departmentId', 'name')
        .sort({ dueDate: 1 })
        .exec();

        console.log('📊 Found assignments:', assignments.length);
        if (assignments.length > 0) {
            console.log('   Sample assignment departmentId:', assignments[0].departmentId);
        }

        return assignments;
    }

    async getAppraisalAssignmentById(assignmentId: string) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const assignment = await this.appraisalAssignmentModel
            .findById(assignmentId)
            .populate('employeeProfileId', 'firstName lastName employeeNumber position departmentId')
            .populate('managerProfileId', 'firstName lastName')
            .populate('templateId', 'name templateType evaluationCriteria')
            .populate('cycleId', 'name startDate endDate status')
            .populate('departmentId', 'name')
            .exec();

        if (!assignment) {
            throw new NotFoundException('Appraisal assignment not found');
        }
        return assignment;
    }

    async updateAppraisalAssignmentStatus(assignmentId: string, status: string) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const assignment = await this.appraisalAssignmentModel
            .findByIdAndUpdate(
            assignmentId, 
            { status }, 
            { new: true }
            )
            .exec();

        if (!assignment) {
            throw new NotFoundException('Appraisal assignment not found');
        }
        return assignment;
    }

    // Appraisal Record Methods
    async createOrUpdateAppraisalRecord(assignmentId: string, createRecordDto: any, user?: any) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const assignment = await this.appraisalAssignmentModel.findById(assignmentId).exec();
        if (!assignment) {
            throw new NotFoundException('Appraisal assignment not found');
        }

        // Calculate total score
        let totalScore = 0;
        if (createRecordDto.ratings && createRecordDto.ratings.length > 0) {
            totalScore = createRecordDto.ratings.reduce((sum: number, rating: any) => {
                return sum + (rating.weightedScore || rating.ratingValue);
            }, 0);
        }

        // Determine managerProfileId: use assignment's manager, or current user if no manager assigned
        let managerProfileId = assignment.managerProfileId;
        if (!managerProfileId && user) {
            console.log('🔍 Assignment has no manager, using current user as manager');
            console.log('   User object:', user);
            console.log('   Looking for employee profile with userid:', user.userid || user.employeeNumber || user.email);

            // Find the employee profile for the current user
            const userId = user.userid || user.employeeNumber || user.email;
            const managerProfile = await this.employeeProfileModel
                .findById(userId)
                .exec();

            console.log('   Found manager profile:', managerProfile ? managerProfile._id : 'NOT FOUND');

            if (managerProfile) {
                managerProfileId = managerProfile._id;
            } else {
                throw new Error('Cannot create appraisal record: Manager profile not found for current user');
            }
        }

        const recordData: any = {
        ...createRecordDto,
        assignmentId,
        cycleId: assignment.cycleId,
        templateId: assignment.templateId,
        employeeProfileId: assignment.employeeProfileId,
        managerProfileId,
        totalScore,
        status: AppraisalRecordStatus.DRAFT,
        };

        // Find existing record or create new one
        let record = await this.appraisalRecordModel.findOne({ assignmentId }).exec();
        
        if (record) {
            record = await this.appraisalRecordModel
            .findOneAndUpdate({ assignmentId }, recordData, { new: true })
            .exec();
        } 
        else {
            record = new this.appraisalRecordModel(recordData);
            await record.save();
        }
        return record;
    }

    async submitAppraisalRecord(assignmentId: string) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const record = await this.appraisalRecordModel.findOne({ assignmentId })
            .populate('employeeProfileId')
            .exec();
        if (!record) {
            throw new NotFoundException('Appraisal record not found');
        }

        // Update record status
        record.status = AppraisalRecordStatus.MANAGER_SUBMITTED;
        record.managerSubmittedAt = new Date();
        await record.save();

        // Update assignment status - use record.assignmentId which is the assignment's _id
        await this.appraisalAssignmentModel
        .findByIdAndUpdate(record.assignmentId, {
            status: AppraisalAssignmentStatus.SUBMITTED,
            submittedAt: new Date(),
            latestAppraisalId: record._id,
        })
        .exec();

        // Send notification to HR about submission
        const hrAdmins = await this.employeeProfileModel.find({
            systemRoles: { $in: ['HR Admin', 'HR Manager'] }
        }).exec();

        for (const hrAdmin of hrAdmins) {
            await this.notificationLogService.sendNotification({
                to: new Types.ObjectId(hrAdmin._id.toString()),
                type: 'Performance Appraisal Submitted',
                message: `Manager has submitted performance appraisal for employee. Ready for HR review and publishing.`,
            });
        }

        return record;
    }

    async publishAppraisalRecord(assignmentId: string, publishedByEmployeeId: string) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const record = await this.appraisalRecordModel.findOne({ assignmentId })
            .populate('employeeProfileId')
            .populate('cycleId')
            .exec();
        if (!record) {
            throw new NotFoundException('Appraisal record not found');
        }

        // Find the HR user's employee profile
        let publisherProfileId: Types.ObjectId | undefined;
        if (Types.ObjectId.isValid(publishedByEmployeeId)) {
            publisherProfileId = new Types.ObjectId(publishedByEmployeeId);
        } else {
            // It's a username, look up the employee profile
            const publisherProfile = await this.employeeProfileModel
                .findOne({ accessProfileId: publishedByEmployeeId })
                .exec();
            if (publisherProfile) {
                publisherProfileId = publisherProfile._id;
            }
        }

        // Update record status
        record.status = AppraisalRecordStatus.HR_PUBLISHED;
        record.hrPublishedAt = new Date();
        if (publisherProfileId) {
            record.publishedByEmployeeId = publisherProfileId;
        }
        await record.save();

        // Update assignment status
        await this.appraisalAssignmentModel
        .findByIdAndUpdate(assignmentId, {
            status: AppraisalAssignmentStatus.PUBLISHED,
            publishedAt: new Date(),
        })
        .exec();

        // Save appraisal history to Employee Profile (BR 6)
        await this.employeeProfileModel.findByIdAndUpdate(
            record.employeeProfileId,
            {
                $push: {
                    appraisalHistory: {
                        appraisalId: record._id,
                        cycleId: record.cycleId,
                        totalScore: record.totalScore,
                        appraisalDate: record.hrPublishedAt,
                        status: record.status,
                    }
                }
            }
        ).exec();

        // Send notification to employee
        const employeeId = typeof record.employeeProfileId === 'object'
            ? (record.employeeProfileId as any)._id
            : record.employeeProfileId;

        await this.notificationLogService.sendNotification({
            to: new Types.ObjectId(employeeId.toString()),
            type: 'Performance Appraisal Published',
            message: `Your performance appraisal has been published. Total score: ${record.totalScore}. You have 7 days to raise objections if needed.`,
        });

        return record;
    }

    async getAppraisalRecordById(recordId: string) {
        if (!Types.ObjectId.isValid(recordId)) {
            throw new NotFoundException('Invalid record ID');
        }

        const record = await this.appraisalRecordModel
            .findById(recordId)
            .populate('assignmentId')
            .populate('cycleId', 'name cycleType')
            .populate('templateId', 'name templateType criteria ratingScale')
            .populate('employeeProfileId', 'firstName lastName employeeNumber position')
            .populate('managerProfileId', 'firstName lastName')
            .populate('publishedByEmployeeId', 'firstName lastName')
            .exec();

        if (!record) {
            throw new NotFoundException('Appraisal record not found');
        }
        return record;
    }

    async updateAppraisalRecordStatus(recordId: string, status: string) {
        if (!Types.ObjectId.isValid(recordId)) {
            throw new NotFoundException('Invalid record ID');
        }

        const record = await this.appraisalRecordModel
            .findByIdAndUpdate(
            recordId,
            { status },
            { new: true }
            )
            .exec();

        if (!record) {
            throw new NotFoundException('Appraisal record not found');
        }
        return record;
    }

    async updateAppraisalRecord(recordId: string, updateDto: any) {
        if (!Types.ObjectId.isValid(recordId)) {
            throw new NotFoundException('Invalid record ID');
        }

        // Get the current record to access template
        const currentRecord = await this.appraisalRecordModel
            .findById(recordId)
            .populate('templateId')
            .exec();

        if (!currentRecord) {
            throw new NotFoundException('Appraisal record not found');
        }

        const template = currentRecord.templateId as any;

        // Build update object
        const updateData: any = {};

        // Update ratings if provided
        if (updateDto.ratings && Array.isArray(updateDto.ratings)) {
            updateData.ratings = updateDto.ratings;

            // Recalculate total score based on template weights
            let totalScore = 0;
            updateDto.ratings.forEach((rating: any) => {
                const templateCriterion = template.criteria.find((c: any) => c.key === rating.key);
                if (templateCriterion) {
                    const weight = templateCriterion.weight / 100;
                    const weightedScore = rating.ratingValue * weight;
                    rating.weightedScore = weightedScore;
                    totalScore += weightedScore;
                }
            });

            updateData.totalScore = totalScore;

            // Determine overall rating label based on total score
            if (totalScore >= 90) updateData.overallRatingLabel = 'Exceptional';
            else if (totalScore >= 80) updateData.overallRatingLabel = 'Exceeds Expectations';
            else if (totalScore >= 70) updateData.overallRatingLabel = 'Meets Expectations';
            else if (totalScore >= 60) updateData.overallRatingLabel = 'Below Expectations';
            else updateData.overallRatingLabel = 'Unsatisfactory';
        }

        // Update other fields if provided
        if (updateDto.managerSummary !== undefined) {
            updateData.managerSummary = updateDto.managerSummary;
        }
        if (updateDto.strengths !== undefined) {
            updateData.strengths = updateDto.strengths;
        }
        if (updateDto.improvementAreas !== undefined) {
            updateData.improvementAreas = updateDto.improvementAreas;
        }

        // Update the record
        const updatedRecord = await this.appraisalRecordModel
            .findByIdAndUpdate(recordId, updateData, { new: true })
            .populate('employeeProfileId', 'firstName lastName')
            .populate('managerProfileId', 'firstName lastName')
            .exec();

        return updatedRecord;
    }

    // Appraisal Dispute Methods
    async createAppraisalDispute(createDisputeDto: any) {
        // Validate appraisalId is provided
        if (!createDisputeDto.appraisalId) {
            throw new BadRequestException('appraisalId is required');
        }
        if (!Types.ObjectId.isValid(createDisputeDto.appraisalId)) {
            throw new BadRequestException('appraisalId is not a valid ObjectId');
        }

        // Fetch the appraisal record to auto-resolve other fields
        const appraisal = await this.appraisalRecordModel
            .findById(createDisputeDto.appraisalId)
            .populate('assignmentId')
            .exec();

        if (!appraisal) {
            throw new NotFoundException('Appraisal record not found');
        }

        // Auto-resolve required fields from the appraisal record
        const assignmentId = appraisal.assignmentId instanceof Types.ObjectId
            ? appraisal.assignmentId
            : (appraisal.assignmentId as any)._id;
        const cycleId = appraisal.cycleId;
        const raisedByEmployeeId = appraisal.employeeProfileId;

        // Check if dispute is within 7-day window (BR 31)
        if (appraisal.hrPublishedAt) {
            const daysSincePublished = Math.floor(
                (new Date().getTime() - appraisal.hrPublishedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSincePublished > 7) {
                throw new BadRequestException('Objection period has expired. Disputes must be raised within 7 days of publication.');
            }
        }

        // ⭐ FIX #1 — MANUALLY GENERATE _id BECAUSE SCHEMA OVERRIDES IT
        const _id = new Types.ObjectId();

        // ⭐ FIX #2 — Convert all IDs to ObjectId (auto-resolved from appraisal)
        const dto = {
            _id,
            appraisalId: new Types.ObjectId(createDisputeDto.appraisalId),
            assignmentId: new Types.ObjectId(assignmentId),
            cycleId: new Types.ObjectId(cycleId),
            raisedByEmployeeId: new Types.ObjectId(raisedByEmployeeId),
            reason: createDisputeDto.reason,
            details: createDisputeDto.details,
            status: AppraisalDisputeStatus.OPEN,
            submittedAt: new Date()
        };

        const dispute = new this.appraisalDisputeModel(dto);
        const savedDispute = await dispute.save();

        // Send notification to HR about new dispute
        const hrAdmins = await this.employeeProfileModel.find({
            systemRoles: { $in: ['HR Admin', 'HR Manager'] }
        }).exec();

        for (const hrAdmin of hrAdmins) {
            await this.notificationLogService.sendNotification({
                to: new Types.ObjectId(hrAdmin._id.toString()),
                type: 'Performance Appraisal Dispute',
                message: `New performance appraisal dispute raised. Reason: ${createDisputeDto.reason}. Please review and resolve.`,
            });
        }

        return savedDispute;
    }



    async getAppraisalDisputes(cycleId?: string) {
        const query: any = {};
        if (cycleId && Types.ObjectId.isValid(cycleId)) {
            query.cycleId = new Types.ObjectId(cycleId);
        }

        return await this.appraisalDisputeModel
        .find(query)
        .populate('appraisalId')
        .populate('assignmentId')
        .populate('cycleId', 'name cycleType')
        .populate('raisedByEmployeeId', 'firstName lastName')
        .populate('assignedReviewerEmployeeId', 'firstName lastName')
        .populate('resolvedByEmployeeId', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .exec();
    }

    async getEmployeeDisputes(employeeId: string) {
        // employeeId is actually the employee's _id from the JWT token
        // Convert string to ObjectId for proper querying
        const employeeObjectId = new Types.ObjectId(employeeId);

        const disputes = await this.appraisalDisputeModel
        .find({ raisedByEmployeeId: employeeObjectId })
        .populate('appraisalId')
        .populate('assignmentId')
        .populate('cycleId', 'name cycleType')
        .populate('raisedByEmployeeId', 'firstName lastName')
        .populate('assignedReviewerEmployeeId', 'firstName lastName')
        .populate('resolvedByEmployeeId', 'firstName lastName')
        .sort({ submittedAt: -1 })
        .exec();

        return disputes;
    }

    async updateDisputeStatus(
  disputeId: string,
  status: AppraisalDisputeStatus,
  resolutionData?: any
) {
    // 1. Validate disputeId BEFORE ANYTHING
    if (!Types.ObjectId.isValid(disputeId)) {
        throw new NotFoundException('Invalid dispute ID');
    }

    const _id = new Types.ObjectId(disputeId);

    // 2. Prepare update object
    const updateData: any = { status };

    // 3. Only add resolved info IF status requires it
    if (status === AppraisalDisputeStatus.ADJUSTED ||
        status === AppraisalDisputeStatus.REJECTED) {

        updateData.resolvedAt = new Date();

        // ⚠ FIX: Only convert if valid string
        if (resolutionData?.resolvedByEmployeeId &&
            Types.ObjectId.isValid(resolutionData.resolvedByEmployeeId)) {

            updateData.resolvedByEmployeeId = new Types.ObjectId(
                resolutionData.resolvedByEmployeeId
            );
        }

        if (resolutionData?.resolutionSummary) {
            updateData.resolutionSummary = resolutionData.resolutionSummary;
        }
    }

    // 4. Run update with safe ObjectId
    const dispute = await this.appraisalDisputeModel
        .findOneAndUpdate({ _id }, updateData, { new: true })
        .populate('raisedByEmployeeId')
        .exec();

    // 5. STILL not found? → real 404
    if (!dispute) {
        throw new NotFoundException('Appraisal dispute not found');
    }

    // Send notification to employee about dispute resolution
    if (status === AppraisalDisputeStatus.ADJUSTED || status === AppraisalDisputeStatus.REJECTED) {
        // Get the employee ID - raisedByEmployeeId is populated so we need to extract _id
        const employeeId = dispute.raisedByEmployeeId._id || dispute.raisedByEmployeeId;

        await this.notificationLogService.sendNotification({
            to: new Types.ObjectId(employeeId.toString()),
            type: 'Performance Appraisal Dispute Resolved',
            message: `Your performance appraisal dispute has been ${status.toLowerCase()}. ${resolutionData?.resolutionSummary || ''}`,
        });
    }

    return dispute;
}


    async getAppraisalDisputeById(disputeId: string) {
        let id: Types.ObjectId;

        try {
            id = new Types.ObjectId(disputeId);
        } catch {
            throw new NotFoundException('Invalid dispute ID');
        }

        const dispute = await this.appraisalDisputeModel
            .findOne({ _id: id }) // <-- do NOT use findById
            .populate('appraisalId')
            .populate('assignmentId')
            .populate('cycleId', 'name cycleType')
            .populate('raisedByEmployeeId', 'firstName lastName')
            .populate('assignedReviewerEmployeeId', 'firstName lastName')
            .populate('resolvedByEmployeeId', 'firstName lastName')
            .exec();

        if (!dispute) {
            throw new NotFoundException('Appraisal dispute not found');
        }

        return dispute;
    }


    async assignDisputeReviewer(disputeId: string, reviewerId: string) {
        // Validate IDs
        if (!Types.ObjectId.isValid(disputeId)) {
            throw new NotFoundException('Invalid dispute ID');
        }
        if (!Types.ObjectId.isValid(reviewerId)) {
            throw new NotFoundException('Invalid reviewer ID');
        }

        const _id = new Types.ObjectId(disputeId);
        const reviewer = new Types.ObjectId(reviewerId);

        const dispute = await this.appraisalDisputeModel
            .findOneAndUpdate(
                { _id },   // <<<<<< FIXED FILTER
                {
                    assignedReviewerEmployeeId: reviewer,
                    status: AppraisalDisputeStatus.UNDER_REVIEW
                },
                { new: true }
            )
            .exec();

        if (!dispute) {
            throw new NotFoundException('Appraisal dispute not found');
        }

        return dispute;
    }

    // Analytics and Dashboard Methods (REQ-AE-10, REQ-OD-08, REQ-OD-06)
    async getPerformanceAnalytics(cycleId?: string) {
        const query: any = {};
        if (cycleId && Types.ObjectId.isValid(cycleId)) {
            query.cycleId = new Types.ObjectId(cycleId);
        }

        const assignments = await this.appraisalAssignmentModel.find(query).exec();
        const records = await this.appraisalRecordModel.find(query).exec();

        const totalAssignments = assignments.length;
        const completedAssignments = assignments.filter(
            a => a.status === AppraisalAssignmentStatus.PUBLISHED
        ).length;
        const inProgressAssignments = assignments.filter(
            a => a.status === AppraisalAssignmentStatus.IN_PROGRESS ||
                 a.status === AppraisalAssignmentStatus.SUBMITTED
        ).length;
        const notStartedAssignments = assignments.filter(
            a => a.status === AppraisalAssignmentStatus.NOT_STARTED
        ).length;

        const completionRate = totalAssignments > 0 ?
            (completedAssignments / totalAssignments * 100).toFixed(2) : 0;

        const averageScore = records.length > 0 ?
            (records.reduce((sum, r) => sum + (r.totalScore || 0), 0) / records.length).toFixed(2) : 0;

        return {
            totalAssignments,
            completedAssignments,
            inProgressAssignments,
            notStartedAssignments,
            completionRate: `${completionRate}%`,
            averageScore,
            totalRecords: records.length,
        };
    }

    async getDepartmentPerformanceAnalytics(departmentId: string, cycleId?: string) {
        if (!Types.ObjectId.isValid(departmentId)) {
            throw new BadRequestException('Invalid department ID');
        }

        const query: any = { departmentId: new Types.ObjectId(departmentId) };
        if (cycleId && Types.ObjectId.isValid(cycleId)) {
            query.cycleId = new Types.ObjectId(cycleId);
        }

        const assignments = await this.appraisalAssignmentModel.find(query)
            .populate('employeeProfileId', 'firstName lastName')
            .exec();

        const records = await this.appraisalRecordModel.find(query).exec();

        const totalEmployees = assignments.length;
        const completedEvaluations = assignments.filter(
            a => a.status === AppraisalAssignmentStatus.PUBLISHED
        ).length;

        const completionRate = totalEmployees > 0 ?
            (completedEvaluations / totalEmployees * 100).toFixed(2) : 0;

        const averageScore = records.length > 0 ?
            (records.reduce((sum, r) => sum + (r.totalScore || 0), 0) / records.length).toFixed(2) : 0;

        return {
            departmentId,
            totalEmployees,
            completedEvaluations,
            pendingEvaluations: totalEmployees - completedEvaluations,
            completionRate: `${completionRate}%`,
            averageScore,
            assignments: assignments.map(a => ({
                employeeId: a.employeeProfileId?._id,
                employeeName: a.employeeProfileId ?
                    `${(a.employeeProfileId as any).firstName} ${(a.employeeProfileId as any).lastName}` : 'N/A',
                status: a.status,
                assignedAt: a.assignedAt,
                completedAt: a.publishedAt,
            })),
        };
    }

    async getHistoricalTrendAnalysis(employeeProfileId?: string) {
        const query: any = { status: AppraisalRecordStatus.HR_PUBLISHED };
        if (employeeProfileId && Types.ObjectId.isValid(employeeProfileId)) {
            query.employeeProfileId = new Types.ObjectId(employeeProfileId);
        }

        const records = await this.appraisalRecordModel.find(query)
            .populate('cycleId', 'name cycleType startDate endDate')
            .populate('employeeProfileId', 'firstName lastName')
            .sort({ hrPublishedAt: 1 })
            .exec();

        const trends = records.map(record => ({
            employeeId: record.employeeProfileId?._id,
            employeeName: record.employeeProfileId ?
                `${(record.employeeProfileId as any).firstName} ${(record.employeeProfileId as any).lastName}` : 'N/A',
            cycleName: (record.cycleId as any)?.name || 'N/A',
            cycleType: (record.cycleId as any)?.cycleType || 'N/A',
            totalScore: record.totalScore,
            publishedDate: record.hrPublishedAt,
        }));

        return {
            totalRecords: records.length,
            trends,
        };
    }

    async exportPerformanceReport(cycleId?: string) {
        const query: any = {};
        if (cycleId && Types.ObjectId.isValid(cycleId)) {
            query.cycleId = new Types.ObjectId(cycleId);
        }

        const records = await this.appraisalRecordModel.find(query)
            .populate('cycleId', 'name cycleType startDate endDate')
            .populate('employeeProfileId', 'firstName lastName position departmentId')
            .populate('managerProfileId', 'firstName lastName')
            .populate('templateId', 'name templateType')
            .sort({ hrPublishedAt: -1 })
            .exec();

        const reportData = records.map(record => ({
            employeeName: record.employeeProfileId ?
                `${(record.employeeProfileId as any).firstName} ${(record.employeeProfileId as any).lastName}` : 'N/A',
            position: (record.employeeProfileId as any)?.position || 'N/A',
            managerName: record.managerProfileId ?
                `${(record.managerProfileId as any).firstName} ${(record.managerProfileId as any).lastName}` : 'N/A',
            cycleName: (record.cycleId as any)?.name || 'N/A',
            cycleType: (record.cycleId as any)?.cycleType || 'N/A',
            templateName: (record.templateId as any)?.name || 'N/A',
            totalScore: record.totalScore,
            status: record.status,
            managerSubmittedAt: record.managerSubmittedAt,
            hrPublishedAt: record.hrPublishedAt,
            ratings: record.ratings,
            managerSummary: record.managerSummary,
            strengths: record.strengths,
            improvementAreas: record.improvementAreas,
        }));

        return {
            generatedAt: new Date(),
            totalRecords: reportData.length,
            cycleId: cycleId || 'All Cycles',
            data: reportData,
        };
    }


}
