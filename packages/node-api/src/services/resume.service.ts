import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { StorageService } from './storage.service';
import { logger } from '../config/logger';

export class ResumeService {
  static async upload(userId: string, file: Express.Multer.File) {
    const ext = file.originalname.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const key = `resumes/${userId}/${timestamp}-${file.originalname}`;

    const fileUrl = await StorageService.uploadFile(key, file.buffer, file.mimetype);

    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'PENDING',
      },
    });

    // Trigger async parsing via ML service (non-blocking)
    // Send file buffer directly so ML service doesn't need to download
    this.triggerParsing(resume.id, fileUrl, file.buffer, file.mimetype).catch((err) => {
      logger.error('Resume parsing trigger failed:', err);
    });

    return resume;
  }

  private static async triggerParsing(
    resumeId: string,
    fileUrl: string,
    fileBuffer: Buffer,
    mimeType: string,
  ) {
    try {
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'PARSING' },
      });

      // Determine file type from mime type
      let fileType = 'pdf';
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx';
      } else if (mimeType === 'application/msword') {
        fileType = 'doc';
      }

      // Send file content as base64 to ML service so it doesn't need HTTP access to uploads dir
      const fileBase64 = fileBuffer.toString('base64');

      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const response = await fetch(`${mlServiceUrl}/ml/resume/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: fileUrl,
          file_type: fileType,
          file_content_base64: fileBase64,
        }),
      });

      if (response.ok) {
        const parsedData = (await response.json()) as any;
        await prisma.resume.update({
          where: { id: resumeId },
          data: { status: 'PARSED', parsedData },
        });
      } else {
        const errorBody = await response.text().catch(() => '');
        throw new Error(`ML service returned ${response.status}: ${errorBody}`);
      }
    } catch (error) {
      logger.error('Resume parsing failed:', error);
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Parsing failed',
        },
      });
    }
  }

  static async list(userId: string) {
    return prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(userId: string, resumeId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new AppError('Resume not found', 404);
    return resume;
  }

  static async reparse(userId: string, resumeId: string) {
    const resume = await this.getById(userId, resumeId);
    if (!resume.fileUrl) {
      throw new AppError('Resume file URL missing', 400);
    }
    // fileUrl looks like "/uploads/resumes/{userId}/{timestamp}-{filename}";
    // strip the "/uploads/" prefix to get the storage key.
    const key = resume.fileUrl.replace(/^\/uploads\//, '');
    const buffer = await StorageService.getFile(key);

    // Fire-and-forget re-parse using the stored file.
    this.triggerParsing(resume.id, resume.fileUrl, buffer, resume.mimeType || 'application/pdf').catch(
      (err) => {
        logger.error('Resume re-parse trigger failed:', err);
      },
    );

    return { id: resume.id, status: 'PARSING' };
  }

  static async getParsedData(userId: string, resumeId: string) {
    const resume = await this.getById(userId, resumeId);
    if (resume.status !== 'PARSED') {
      throw new AppError(`Resume parsing status: ${resume.status}`, 400);
    }
    return { parsedData: resume.parsedData };
  }

  static async update(userId: string, resumeId: string, data: { fileName?: string }) {
    await this.getById(userId, resumeId); // verify ownership
    return prisma.resume.update({
      where: { id: resumeId },
      data,
    });
  }

  static async delete(userId: string, resumeId: string) {
    const resume = await this.getById(userId, resumeId);
    // Delete file from storage
    if (resume.fileUrl) {
      const key = resume.fileUrl.replace('/uploads/', '');
      await StorageService.deleteFile(key).catch(() => {});
    }
    await prisma.resume.delete({ where: { id: resumeId } });
  }
}
