import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourplatform.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<boolean> {
  try {
    const command = new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: template.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: template.html,
            Charset: 'UTF-8',
          },
          Text: {
            Data: template.text,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function createPasswordResetTemplate(
  resetToken: string,
  userEmail: string
): EmailTemplate {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;
  
  return {
    subject: 'Reset Your Password - Real Estate Investment Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f8f9fa; }
          .button { display: inline-block; background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello,</h2>
            <p>We received a request to reset your password for your Real Estate Investment Platform account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <strong>Security Note:</strong>
              <ul>
                <li>This link will expire in 30 minutes for your security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; 2024 Real Estate Investment Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello,
      
      We received a request to reset your password for your Real Estate Investment Platform account.
      
      Please visit the following link to reset your password:
      ${resetUrl}
      
      Security Notes:
      - This link will expire in 30 minutes for your security
      - If you didn't request this reset, please ignore this email
      - Never share this link with anyone
      
      This is an automated message. Please do not reply to this email.
      
      © 2024 Real Estate Investment Platform. All rights reserved.
    `
  };
}

export function createWelcomeTemplate(
  userName: string,
  verificationToken?: string
): EmailTemplate {
  const verificationUrl = verificationToken 
    ? `${FRONTEND_URL}/verify-email?token=${verificationToken}` 
    : null;

  return {
    subject: 'Welcome to Real Estate Investment Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f8f9fa; }
          .button { display: inline-block; background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Platform!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome to the Real Estate Investment Platform! We're excited to have you join our community of smart investors.</p>
            ${verificationUrl ? `
              <p>To get started, please verify your email address:</p>
              <a href="${verificationUrl}" class="button">Verify Email</a>
            ` : ''}
            <p>Next steps:</p>
            <ul>
              <li>Complete your KYC verification</li>
              <li>Explore available investment opportunities</li>
              <li>Set up your investment preferences</li>
            </ul>
          </div>
          <div class="footer">
            <p>&copy; 2024 Real Estate Investment Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Real Estate Investment Platform!
      
      Hello ${userName},
      
      Welcome to our platform! We're excited to have you join our community of smart investors.
      
      ${verificationUrl ? `To get started, please verify your email address: ${verificationUrl}` : ''}
      
      Next steps:
      - Complete your KYC verification
      - Explore available investment opportunities  
      - Set up your investment preferences
      
      © 2024 Real Estate Investment Platform. All rights reserved.
    `
  };
}