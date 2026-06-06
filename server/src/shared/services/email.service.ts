import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfigService } from '../config/config.service';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: EmailAttachment[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: AppConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const mailUser = this.configService.mailUser;
    if (mailUser) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.mailHost,
        port: this.configService.mailPort,
        secure: this.configService.mailPort === 465,
        auth: {
          user: mailUser,
          pass: this.configService.mailPassword,
        },
      });
      this.logger.log('Nodemailer transporter initialized');
    } else {
      this.logger.warn('MAIL_USER not configured — emails will be logged to console');
    }
  }

  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    attachments?: EmailAttachment[],
  ): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.configService.mailFrom,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          text: body,
          attachments: attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        this.logger.log(`Email sent to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);
      } else {
        this.logger.log('═══════════════════════════════════════════════════');
        this.logger.log('EMAIL (console fallback — MAIL_USER not set)');
        this.logger.log('═══════════════════════════════════════════════════');
        this.logger.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
        this.logger.log(`Subject: ${subject}`);
        this.logger.log(`Body:\n${body}`);
        this.logger.log('═══════════════════════════════════════════════════');
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  async sendMFACode(to: string, code: string, name: string): Promise<boolean> {
    const subject = `${this.configService.appName} — Your verification code`;
    const body = `Hi ${name},\n\nYour verification code is: ${code}\n\nThis code expires in ${this.configService.mfaCodeExpiresMinutes} minutes.\n\nIf you did not request this code, please ignore this email.\n\n— ${this.configService.appName}`;
    return this.sendEmail(to, subject, body);
  }

  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
    const subject = 'Password Reset Request - FieldForce Pro';
    const resetUrl = `${this.configService.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const body = `Hi ${name},\n\nYou requested to reset your password. Click the link below to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.`;
    return this.sendEmail(to, subject, body);
  }

  async sendMagicLinkEmail(to: string, name: string, token: string): Promise<boolean> {
    const subject = 'Your Magic Link - FieldForce Pro';
    const magicLinkUrl = `${this.configService.frontendUrl}/auth/verify?token=${token}`;
    const body = `Hi ${name},\n\nClick the link below to sign in or complete your registration to FieldForce Pro:\n\n${magicLinkUrl}\n\nThis link will expire in 15 minutes. If you did not request this, please ignore this email.`;
    return this.sendEmail(to, subject, body);
  }

  async sendTemplatedEmail(
    to: string | string[],
    templateName: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('TEMPLATED EMAIL SENT (PLACEHOLDER)');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`To: ${Array.isArray(to) ? to.join(', ') : to}`);
      this.logger.log(`Template: ${templateName}`);
      this.logger.log(`Data: ${JSON.stringify(data, null, 2)}`);
      this.logger.log('═══════════════════════════════════════════════════');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send templated email: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendEstimate(estimateId: string): Promise<boolean> {
    try {
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('ESTIMATE EMAIL (PLACEHOLDER)');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`Estimate ID: ${estimateId}`);
      this.logger.log('═══════════════════════════════════════════════════');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send estimate email: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendInvoice(invoiceId: string): Promise<boolean> {
    try {
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('INVOICE EMAIL (PLACEHOLDER)');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`Invoice ID: ${invoiceId}`);
      this.logger.log('═══════════════════════════════════════════════════');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send invoice email: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendWorkOrderNotification(
    workOrderId: string,
    recipientEmail: string,
    notificationType: 'created' | 'updated' | 'completed' | 'cancelled',
  ): Promise<boolean> {
    try {
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('WORK ORDER NOTIFICATION (PLACEHOLDER)');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`Work Order ID: ${workOrderId}`);
      this.logger.log(`Recipient: ${recipientEmail}`);
      this.logger.log(`Type: ${notificationType}`);
      this.logger.log('═══════════════════════════════════════════════════');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send work order notification: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async sendAppointmentReminder(
    appointmentId: string,
    recipientEmail: string,
  ): Promise<boolean> {
    try {
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('APPOINTMENT REMINDER (PLACEHOLDER)');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`Appointment ID: ${appointmentId}`);
      this.logger.log(`Recipient: ${recipientEmail}`);
      this.logger.log('═══════════════════════════════════════════════════');
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send appointment reminder: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
