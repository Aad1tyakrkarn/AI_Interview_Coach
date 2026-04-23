import fs from 'fs/promises';
import path from 'path';
import { logger } from '../config/logger';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export class StorageService {
  static async uploadFile(key: string, body: Buffer, _contentType: string): Promise<string> {
    await ensureUploadsDir();
    const filePath = path.join(UPLOADS_DIR, key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, body);
    logger.info(`File uploaded: ${key}`);
    return `/uploads/${key}`;
  }

  static async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    return `/uploads/${key}`;
  }

  static async getUploadSignedUrl(key: string, _contentType: string, _expiresIn?: number): Promise<string> {
    return `/uploads/${key}`;
  }

  static async deleteFile(key: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await fs.unlink(filePath);
      logger.info(`File deleted: ${key}`);
    } catch (error) {
      logger.warn(`File not found for deletion: ${key}`);
    }
  }

  static async getFile(key: string): Promise<Buffer> {
    const filePath = path.join(UPLOADS_DIR, key);
    return fs.readFile(filePath);
  }

  static async fileExists(key: string): Promise<boolean> {
    const filePath = path.join(UPLOADS_DIR, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
