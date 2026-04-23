import { config } from '../config';
import { logger } from '../config/logger';

export class MLProxyService {
  private static baseUrl = config.mlService.url;

  static async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`ML service error: ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`ML proxy error for ${endpoint}:`, error);
      throw error;
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`ML service error: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`ML proxy error for ${endpoint}:`, error);
      throw error;
    }
  }
}
