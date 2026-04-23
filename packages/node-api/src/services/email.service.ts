import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../config/logger';

// Use real SMTP if credentials provided, otherwise log to console
const hasSmtpCredentials = config.email.user && config.email.pass;

const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    })
  : null;

export class EmailService {
  private static async send(to: string, subject: string, html: string): Promise<void> {
    if (!transporter) {
      // No SMTP credentials — log email to console (dev mode)
      logger.warn(`══════════════════════════════════════════`);
      logger.warn(`📧 EMAIL (no SMTP configured — console only)`);
      logger.warn(`To: ${to}`);
      logger.warn(`Subject: ${subject}`);
      // Extract links from HTML for easy copy-paste
      const linkMatch = html.match(/href="([^"]+)"/);
      if (linkMatch) {
        logger.warn(`🔗 Link: ${linkMatch[1]}`);
      }
      logger.warn(`══════════════════════════════════════════`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });
      logger.info(`✅ Email sent: ${info.messageId} to ${to}`);
    } catch (error) {
      logger.error('Email send failed:', error);
      if (config.isProduction) throw error;
      logger.warn(`[DEV] Email to ${to}: ${subject}`);
    }
  }

  static async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
    await this.send(to, 'Verify your email', `
      <h1>Email Verification</h1>
      <p>Click the link below to verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link expires in 24 hours.</p>
    `);
  }

  static async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    await this.send(to, 'Reset your password', `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `);
  }

  static async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.send(to, 'Welcome to Interview Prep Platform', `
      <h1>Welcome, ${name}!</h1>
      <p>Your account has been created. Start practicing for your next interview!</p>
    `);
  }

  static async sendInterviewCompletedEmail(to: string, interviewId: string, name: string): Promise<void> {
    await this.send(to, 'Interview Completed', `
      <h1>Great job, ${name}!</h1>
      <p>Your interview session is complete. View your results:</p>
      <a href="${config.frontendUrl}/review/${interviewId}/report">View Report</a>
    `);
  }

  static async sendReportReadyEmail(to: string, reportId: string, name: string): Promise<void> {
    await this.send(to, 'Your Interview Report is Ready', `
      <h1>Hi ${name},</h1>
      <p>Your interview report is ready for review.</p>
      <a href="${config.frontendUrl}/review/${reportId}/report">View Report</a>
    `);
  }

  static async sendGenericEmail(to: string, subject: string, html: string): Promise<void> {
    await this.send(to, subject, html);
  }
}
