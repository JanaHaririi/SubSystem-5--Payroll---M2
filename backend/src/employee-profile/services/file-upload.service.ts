import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'profiles');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  // Save uploaded file
  async saveFile(file: Express.Multer.File, employeeId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed');
    }

    const fileExtension = extname(file.originalname);
    const fileName = `${employeeId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return fileName;
  }

  // Get uploaded file
  async getFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    return fs.readFileSync(filePath);
  }

  // Delete uploaded file
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadPath, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
