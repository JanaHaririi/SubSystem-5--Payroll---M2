import { NotificationLogCreateDto } from './../dtos/notification-log-create-dto';
import { InjectModel } from '@nestjs/mongoose';
import { NotificationLog, NotificationLogDocument, NotificationLogSchema } from './../models/notification-log.schema';
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { isValidObjectId, Model, Types } from 'mongoose';
import { ObjectId } from 'mongodb';

@Injectable()
export class NotificationLogService{
    constructor(
        @InjectModel(NotificationLog.name)
        private notificationLogModel: Model<NotificationLogDocument>,
    ){}
    async sendNotification(notifData:NotificationLogCreateDto){ //Working!
        if(!notifData.to){
            throw new BadRequestException("Recepient cannot be empty!")
        }
        if(!notifData.type){
            throw new BadRequestException("Type cannot be empty!")
        }
        const notification = await this.notificationLogModel.create(notifData)
        return{
            success: true,
            message:"Notification sent successfully!",
            data: notification
        }
    }
    async getAllNotifications(){ //Working!
        const notifications = await this.notificationLogModel.find()
        if(!notifications) throw new NotFoundException("No notifications found!")
        return{
            success:true,
            message:"All notifications displayed sucessfully!",
            data: notifications
        };
    }
async getEmployeeNotifications(recepientId: string) {
    let notifications;
    
    // First, try to find by string match (in case 'to' is stored as string)
    notifications = await this.notificationLogModel.find({ to: recepientId });
    
    // If no results found with string search AND recepientId is a valid ObjectId
    // then try searching as ObjectId
    if ((!notifications || notifications.length === 0) && isValidObjectId(recepientId)) {
        try {
            notifications = await this.notificationLogModel.find({ 
                to: new Types.ObjectId(recepientId) 
            });
        } catch (error) {
            // If conversion fails, return empty array or handle error
            notifications = [];
        }
    }
    
    if (!notifications || notifications.length === 0) {
        throw new NotFoundException('No employee notifications found!');
    }
    
    return {
        success: true,
        message: "Employee notifications displayed successfully!",
        data: notifications
    };
}
    async getNotificationById(notifId:string){
        const notification = await this.notificationLogModel.findById(notifId)
        if(!notification) throw new NotFoundException("Notification not found!")
        this.readNotif(notifId)
        return{
            success:true,
            message: "Notification retrieved successfully!",
            data:notification
        }
    }
    async readNotif(notifId:string){
        const notification = await this.notificationLogModel.findByIdAndUpdate(notifId, {readStatus:true})
        if(!notification){
            throw new NotFoundException("Notification not found!")
        }
        return{
            success:true,
            message: "Notification Read!",
            data:notification
        }
    }
    //Ask about read status method
}