import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

export class SecurityService {
  static async submitConsent(userId: string, data: {
    consentType: string;
    granted: boolean;
  }) {
    const consent = await prisma.gDPRConsent.create({
      data: {
        userId,
        consentType: data.consentType,
        granted: data.granted,
      },
    });
    return consent;
  }

  static async getConsent(userId: string) {
    const consents = await prisma.gDPRConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return consents;
  }

  static async requestDataDeletion(userId: string, reason: string) {
    // Direct account deactivation instead of deletion queue
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await prisma.session.deleteMany({ where: { userId } });
    return { status: 'COMPLETED', reason };
  }

  static async getAuditLogs(userId: string, query: {
    page?: number;
    limit?: number;
    action?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (query.action) where.action = query.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getPrivacyPolicy() {
    return {
      version: '1.0.0',
      effectiveDate: '2024-01-01',
      content: 'This is a placeholder privacy policy. Replace with your actual privacy policy content.',
    };
  }

  static async logActivity(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // NOTE(added): Prisma JSON typing is stricter than `Record<string, unknown>`.
    await prisma.auditLog.create({ data: data as any });
  }

  /**
   * Accept privacy policy
   */
  static async acceptPrivacyPolicy(userId: string, version: string, ipAddress?: string, userAgent?: string) {
    const consent = await prisma.gDPRConsent.create({
      data: {
        userId,
        consentType: 'privacy_policy',
        granted: true,
        ipAddress,
        userAgent,
      },
    });

    await this.logActivity({
      userId,
      action: 'privacy_policy_accepted',
      resource: 'privacy_policy',
      details: { version },
      ipAddress,
      userAgent,
    });

    return { accepted: true, version, consentId: consent.id };
  }

  /**
   * Check if user has accepted current privacy policy
   */
  static async hasAcceptedPrivacyPolicy(userId: string): Promise<boolean> {
    const consent = await prisma.gDPRConsent.findFirst({
      where: { userId, consentType: 'privacy_policy', granted: true },
      orderBy: { createdAt: 'desc' },
    });
    return !!consent;
  }

  /**
   * Get ethical AI declaration content
   */
  static async getEthicalAIDeclaration() {
    return {
      version: '1.0.0',
      title: 'Ethical AI Declaration',
      effectiveDate: '2024-01-01',
      principles: [
        { title: 'No Automated Hiring Decisions', description: 'This platform is designed for interview practice and preparation only. AI evaluations are advisory and should not be used as the sole basis for hiring decisions.' },
        { title: 'Fairness & Non-Discrimination', description: 'Our AI models are regularly audited for bias. Scores are normalized across demographics and roles to ensure fair evaluation.' },
        { title: 'Transparency', description: 'All AI-generated scores include explanations (SHAP values) so users understand how their performance was evaluated.' },
        { title: 'Data Privacy', description: 'Interview recordings and personal data are encrypted and automatically deleted after the retention period. Users can request immediate deletion at any time.' },
        { title: 'Human Oversight', description: 'AI evaluations are designed to assist, not replace, human judgment. We encourage users to seek feedback from mentors and peers alongside AI feedback.' },
        { title: 'Continuous Improvement', description: 'We monitor ML model performance for drift and bias, retraining models regularly to maintain quality and fairness.' },
      ],
      disclaimer: 'This platform provides AI-powered interview practice tools for educational purposes. It does not make hiring decisions, and its evaluations should not be treated as definitive assessments of a candidate\'s abilities.',
    };
  }

  /**
   * Get no-automated-hiring disclaimer
   */
  static async getHiringDisclaimer() {
    return {
      title: 'Important Disclaimer',
      content: 'This platform is an AI-powered interview preparation tool designed for practice and self-improvement. It does NOT make automated hiring decisions. All scores, feedback, and evaluations are generated by AI models for educational purposes only and should not be used as the sole basis for employment decisions by any organization.',
      lastUpdated: '2024-01-01',
    };
  }
}
