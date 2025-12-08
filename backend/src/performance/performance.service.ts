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

        return await this.appraisalAssignmentModel
            .find({ cycleId })
            .populate('employeeProfileId', 'firstName lastName position')
            .populate('managerProfileId', 'firstName lastName')
            .populate('templateId', 'name templateType')
            .populate('departmentId', 'name')
            .exec();
    }
    

    // Appraisal Assignment Methods
    async createAppraisalAssignments(cycleId: string) {
        if (!Types.ObjectId.isValid(cycleId)) {
            throw new NotFoundException('Invalid cycle ID');
        }

        const cycle = await this.appraisalCycleModel
            .findById(cycleId)
            .exec();

        if (!cycle) {
            throw new NotFoundException('Appraisal cycle not found');
        }

        if (!cycle.templateAssignments || cycle.templateAssignments.length === 0) {
            throw new BadRequestException('Cycle has no template assignments');
        }

        // ⭐ Pull required fields from cycle so we satisfy schema
        const templateId = cycle.templateAssignments[0].templateId;
        const departmentId = cycle.templateAssignments[0].departmentIds[0];

        const createdAssignments: AppraisalAssignmentDocument[] = [];

        // Fetch ALL employees
        const EmployeeProfileModel = this.appraisalAssignmentModel.db.model('EmployeeProfile');
        const employees = await EmployeeProfileModel.find({});

        for (const emp of employees) {
            const existing = await this.appraisalAssignmentModel.findOne({
            cycleId,
            employeeProfileId: emp._id,
            });

            if (existing) continue;

            const newAssignment = new this.appraisalAssignmentModel({
            cycleId,
            templateId,       // ⭐ REQUIRED
            employeeProfileId: emp._id,
            
            // ⭐ Your DB has no supervisor hierarchy → use employee as own manager
            managerProfileId: emp._id,

            // ⭐ REQUIRED and must match cycle's department
            departmentId,

            status: AppraisalAssignmentStatus.NOT_STARTED,
            assignedAt: new Date(),
            });

            const saved = await newAssignment.save();
            createdAssignments.push(saved);

            // Send notification to employee about new assignment
            await this.notificationLogService.sendNotification({
                to: new Types.ObjectId(emp._id.toString()),
                type: 'Performance Appraisal Assignment',
                message: `You have been assigned a new performance appraisal for cycle: ${cycle.name}. Your manager will evaluate your performance.`,
            });
        }

        return createdAssignments;
    }





    async getEmployeeAppraisals(employeeProfileId: string) {
        if (!Types.ObjectId.isValid(employeeProfileId)) {
            throw new NotFoundException('Invalid employee profile ID');
        }

        return await this.appraisalAssignmentModel
        .find({ employeeProfileId })
        .populate('cycleId', 'name cycleType startDate endDate status')
        .populate('templateId', 'name templateType')
        .populate('managerProfileId', 'firstName lastName')
        .populate('departmentId', 'name')
        .sort({ assignedAt: -1 })
        .exec();
    }

    async getManagerAppraisalAssignments(managerProfileId: string) {
        if (!Types.ObjectId.isValid(managerProfileId)) {
            throw new NotFoundException('Invalid manager profile ID');
        }

        return await this.appraisalAssignmentModel
        .find({ managerProfileId })
        .populate('employeeProfileId', 'firstName lastName position')
        .populate('cycleId', 'name cycleType startDate endDate status')
        .populate('templateId', 'name templateType')
        .populate('departmentId', 'name')
        .sort({ dueDate: 1 })
        .exec();
    }

    async getAppraisalAssignmentById(assignmentId: string) {
        if (!Types.ObjectId.isValid(assignmentId)) {
            throw new NotFoundException('Invalid assignment ID');
        }

        const assignment = await this.appraisalAssignmentModel
            .findById(assignmentId)
            .populate('employeeProfileId', 'firstName lastName position departmentId')
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
    async createOrUpdateAppraisalRecord(assignmentId: string, createRecordDto: any) {
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

        const recordData = {
        ...createRecordDto,
        assignmentId,
        cycleId: assignment.cycleId,
        templateId: assignment.templateId,
        employeeProfileId: assignment.employeeProfileId,
        managerProfileId: assignment.managerProfileId,
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

        // Update assignment status
        await this.appraisalAssignmentModel
        .findByIdAndUpdate(assignmentId, {
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

        // Update record status
        record.status = AppraisalRecordStatus.HR_PUBLISHED;
        record.hrPublishedAt = new Date();
        record.publishedByEmployeeId = new Types.ObjectId(publishedByEmployeeId);
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
        await this.notificationLogService.sendNotification({
            to: new Types.ObjectId(record.employeeProfileId.toString()),
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
            .populate('templateId', 'name templateType')
            .populate('employeeProfileId', 'firstName lastName position')
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

    // Appraisal Dispute Methods
    async createAppraisalDispute(createDisputeDto: any) {
        const requiredIds = [
            "appraisalId",
            "assignmentId",
            "cycleId",
            "raisedByEmployeeId"
        ];

        for (const field of requiredIds) {
            if (!createDisputeDto[field]) {
            throw new BadRequestException(`${field} is required`);
            }
            if (!Types.ObjectId.isValid(createDisputeDto[field])) {
            throw new BadRequestException(`${field} is not a valid ObjectId`);
            }
        }

        // Check if dispute is within 7-day window (BR 31)
        const appraisal = await this.appraisalRecordModel.findById(createDisputeDto.appraisalId).exec();
        if (appraisal && appraisal.hrPublishedAt) {
            const daysSincePublished = Math.floor(
                (new Date().getTime() - appraisal.hrPublishedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSincePublished > 7) {
                throw new BadRequestException('Objection period has expired. Disputes must be raised within 7 days of publication.');
            }
        }

        // ⭐ FIX #1 — MANUALLY GENERATE _id BECAUSE SCHEMA OVERRIDES IT
        const _id = new Types.ObjectId();

        // ⭐ FIX #2 — Convert all IDs to ObjectId
        const dto = {
            _id,
            appraisalId: new Types.ObjectId(createDisputeDto.appraisalId),
            assignmentId: new Types.ObjectId(createDisputeDto.assignmentId),
            cycleId: new Types.ObjectId(createDisputeDto.cycleId),
            raisedByEmployeeId: new Types.ObjectId(createDisputeDto.raisedByEmployeeId),
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
        await this.notificationLogService.sendNotification({
            to: new Types.ObjectId(dispute.raisedByEmployeeId.toString()),
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
