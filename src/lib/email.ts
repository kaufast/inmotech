// AWS SES Email Integration

import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables if not already loaded
if (!process.env.AWS_ACCESS_KEY_ID) {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface EmailTemplate {
  welcome: {
    subject: string;
    data: { firstName: string; verificationUrl: string };
  };
  passwordReset: {
    subject: string;
    data: { firstName: string; resetUrl: string; expiresIn: string };
  };
  kycApproved: {
    subject: string;
    data: { firstName: string; dashboardUrl: string };
  };
  investmentConfirmed: {
    subject: string;
    data: { 
      firstName: string; 
      projectTitle: string; 
      amount: string; 
      currency: string;
      transactionId: string;
    };
  };
}

class EmailService {
  private fromEmail = process.env.SES_FROM_EMAIL || 'noreply@inmote.ch';

  // Send simple email
  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string
  ): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
          Text: { Data: textBody || this.stripHtml(htmlBody) },
        },
      },
    });

    await sesClient.send(command);
  }

  // Send templated email
  async sendTemplatedEmail<T extends keyof EmailTemplate>(
    to: string,
    templateName: T,
    templateData: EmailTemplate[T]['data']
  ): Promise<void> {
    const command = new SendTemplatedEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
    });

    await sesClient.send(command);
  }

  // Auth-specific emails
  async sendWelcomeEmail(
    email: string, 
    firstName: string, 
    verificationToken: string,
    isReminder: boolean = false
  ): Promise<void> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`;
    
    const subject = isReminder 
      ? 'Reminder: Please verify your InmoTech email address'
      : 'Welcome to InmoTech - Verify Your Email';
    
    const greeting = isReminder
      ? `Hi ${firstName}, we noticed you haven't verified your email yet.`
      : `Welcome to InmoTech, ${firstName}!`;
    
    const message = isReminder
      ? 'To access all features of our real estate investment platform, please verify your email address:'
      : 'Thank you for joining our real estate investment platform. Please verify your email address to activate your account:';
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${greeting}</h1>
        <p>${message}</p>
        <a href="${verificationUrl}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          This verification link expires in 24 hours.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail(email, subject, htmlBody);
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hi ${firstName},</p>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <a href="${resetUrl}" 
           style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail(email, 'Reset Your InmoTech Password', htmlBody);
  }

  async sendInvestmentConfirmation(
    email: string,
    data: EmailTemplate['investmentConfirmed']['data']
  ): Promise<void> {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Investment Confirmed!</h1>
        <p>Hi ${data.firstName},</p>
        <p>Your investment has been successfully processed:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Project:</strong> ${data.projectTitle}</p>
          <p><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
          <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        </div>
        <p>Funds are held in escrow and will be released according to project milestones.</p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/investments" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Investment
        </a>
      </div>
    `;

    await this.sendEmail(
      email, 
      `Investment Confirmed - ${data.projectTitle}`, 
      htmlBody
    );
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();