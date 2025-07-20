import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { processWebhook, type PSPProvider } from '@/lib/payment/payment-service';
import { sendInvestmentConfirmationEmail, sendPaymentFailedEmail } from '@/lib/sesClient';

// ==================== WEBHOOK SECURITY ====================

function verifyWebhookSignature(provider: PSPProvider, payload: string, signature?: string): boolean {
  switch (provider) {
    case 'OPENPAY':
      return verifyOpenPaySignature(payload, signature);
    case 'LEMONWAY':
      return verifyLemonwaySignature(payload, signature);
    case 'STRIPE':
      return verifyStripeSignature(payload, signature);
    default:
      return true; // Mock always passes
  }
}

function verifyOpenPaySignature(payload: string, signature?: string): boolean {
  if (!signature || !process.env.OPENPAY_WEBHOOK_SECRET) {
    return false;
  }
  
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.OPENPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

function verifyLemonwaySignature(payload: string, signature?: string): boolean {
  // Lemonway uses IP whitelisting rather than signatures
  // In production, verify the request comes from Lemonway's IPs
  return true;
}

function verifyStripeSignature(payload: string, signature?: string): boolean {
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return false;
  }
  
  let stripe;
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    console.warn('Stripe not available');
    return false;
  }
  
  try {
    stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return true;
  } catch (error) {
    console.error('Stripe signature verification failed:', error);
    return false;
  }
}

// ==================== UNIFIED WEBHOOK HANDLER ====================

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const signature = headersList.get('stripe-signature') || 
                     headersList.get('x-openpay-signature') || 
                     headersList.get('authorization');
    
    // Determine provider from user agent or headers
    let provider: PSPProvider = 'MOCK';
    if (userAgent.includes('OpenPay') || headersList.get('x-openpay-signature')) {
      provider = 'OPENPAY';
    } else if (userAgent.includes('Lemonway') || request.url.includes('lemonway')) {
      provider = 'LEMONWAY';
    } else if (headersList.get('stripe-signature')) {
      provider = 'STRIPE';
    }

    // Get raw payload
    const rawPayload = await request.text();
    
    // Verify webhook signature (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const isValidSignature = verifyWebhookSignature(provider, rawPayload, signature || undefined);
      if (!isValidSignature) {
        console.error(`Invalid webhook signature for ${provider}`);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload based on provider
    let parsedPayload;
    try {
      if (provider === 'LEMONWAY') {
        // Lemonway sends form-encoded data
        const formData = new URLSearchParams(rawPayload);
        parsedPayload = Object.fromEntries(formData);
      } else {
        // OpenPay and Stripe send JSON
        parsedPayload = JSON.parse(rawPayload);
      }
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Process webhook through payment service
    const webhookData = await processWebhook(parsedPayload, provider);
    
    // Handle payment status update
    await handlePaymentStatusUpdate(webhookData);

    // Log webhook processing
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_PROCESSED',
        resource: 'PAYMENT',
        resourceId: webhookData.transactionId,
        details: JSON.stringify({
          provider: webhookData.provider,
          status: webhookData.status,
          amount: webhookData.amount,
          currency: webhookData.currency
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: webhookData.status === 'completed' ? 'INFO' : 'WARN'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log failed webhook
    await prisma.auditLog.create({
      data: {
        action: 'WEBHOOK_FAILED',
        resource: 'PAYMENT',
        details: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'ERROR'
      }
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// ==================== PAYMENT STATUS HANDLER ====================

async function handlePaymentStatusUpdate(webhookData: any) {
  const { transactionId, status, amount, currency, metadata } = webhookData;

  // Find payment record
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { pspTransactionId: transactionId },
        { pspSessionId: transactionId }
      ]
    },
    include: {
      investment: {
        include: {
          project: {
            select: {
              id: true,
              title: true,
              currentFunding: true,
              targetFunding: true,
              status: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalInvested: true
        }
      }
    }
  });

  if (!payment) {
    console.error(`Payment not found for transaction ID: ${transactionId}`);
    return;
  }

  // Update payment status
  const updateData: any = {
    status: mapWebhookStatusToPaymentStatus(status),
    updatedAt: new Date()
  };

  if (status === 'completed') {
    updateData.completedAt = new Date();
    updateData.processedAt = new Date();
  } else if (status === 'failed') {
    updateData.failedAt = new Date();
    updateData.errorMessage = 'Payment failed via webhook';
  } else if (status === 'refunded') {
    updateData.refundedAt = new Date();
  }

  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: updateData
  });

  // Handle investment-specific logic
  if (payment.investment) {
    await handleInvestmentPaymentUpdate(payment.investment, status, amount);
  }

  // Send notifications
  await sendPaymentNotifications(payment, status);
}

function mapWebhookStatusToPaymentStatus(webhookStatus: string): string {
  switch (webhookStatus) {
    case 'completed':
      return 'COMPLETED';
    case 'failed':
      return 'FAILED';
    case 'cancelled':
      return 'CANCELLED';
    case 'refunded':
      return 'REFUNDED';
    default:
      return 'PROCESSING';
  }
}

// ==================== INVESTMENT PAYMENT HANDLER ====================

async function handleInvestmentPaymentUpdate(investment: any, status: string, amount?: number) {
  const updateData: any = {
    paymentStatus: mapWebhookStatusToPaymentStatus(status),
    updatedAt: new Date()
  };

  if (status === 'completed') {
    updateData.status = 'CONFIRMED';
    updateData.confirmedAt = new Date();
    updateData.investmentDate = new Date();

    // Update project funding
    const newCurrentFunding = Number(investment.project.currentFunding) + Number(investment.amount);
    await prisma.project.update({
      where: { id: investment.projectId },
      data: {
        currentFunding: newCurrentFunding,
        updatedAt: new Date()
      }
    });

    // Update user total invested
    const newTotalInvested = Number(investment.user.totalInvested) + Number(investment.amount);
    await prisma.user.update({
      where: { id: investment.userId },
      data: {
        totalInvested: newTotalInvested,
        updatedAt: new Date()
      }
    });

    // Check if project is fully funded
    if (newCurrentFunding >= Number(investment.project.targetFunding)) {
      await prisma.project.update({
        where: { id: investment.projectId },
        data: {
          status: 'FUNDING_COMPLETE',
          updatedAt: new Date()
        }
      });

      // TODO: Trigger escrow release process
      await scheduleEscrowRelease(investment.projectId);
    }

    // Create escrow entry
    await createEscrowEntry(investment, amount || Number(investment.amount));

  } else if (status === 'failed' || status === 'cancelled') {
    updateData.status = 'FAILED';
    updateData.cancelledAt = new Date();

  } else if (status === 'refunded') {
    updateData.status = 'REFUNDED';
    updateData.refundedAt = new Date();

    // Reverse funding and user totals
    const newCurrentFunding = Math.max(0, Number(investment.project.currentFunding) - Number(investment.amount));
    const newTotalInvested = Math.max(0, Number(investment.user.totalInvested) - Number(investment.amount));

    await Promise.all([
      prisma.project.update({
        where: { id: investment.projectId },
        data: {
          currentFunding: newCurrentFunding,
          updatedAt: new Date()
        }
      }),
      prisma.user.update({
        where: { id: investment.userId },
        data: {
          totalInvested: newTotalInvested,
          updatedAt: new Date()
        }
      })
    ]);
  }

  // Update investment
  await prisma.investment.update({
    where: { id: investment.id },
    data: updateData
  });
}

// ==================== ESCROW MANAGEMENT ====================

async function createEscrowEntry(investment: any, amount: number) {
  try {
    // Find or create escrow account for project
    let escrowAccount = await prisma.escrowAccount.findFirst({
      where: { projectId: investment.projectId }
    });

    if (!escrowAccount) {
      escrowAccount = await prisma.escrowAccount.create({
        data: {
          projectId: investment.projectId,
          accountNumber: `ESC-${investment.projectId}-${Date.now()}`,
          pspProvider: 'LEMONWAY', // Default, should be determined by jurisdiction
          balance: 0,
          currency: 'EUR' // Should be from investment currency
        }
      });
    }

    // Create escrow entry
    await prisma.escrowEntry.create({
      data: {
        escrowAccountId: escrowAccount.id,
        paymentId: investment.payments[0]?.id, // Assuming latest payment
        entryType: 'DEPOSIT',
        amount,
        description: `Investment deposit for ${investment.project.title}`,
        processingDate: new Date()
      }
    });

    // Update escrow balance
    await prisma.escrowAccount.update({
      where: { id: escrowAccount.id },
      data: {
        balance: Number(escrowAccount.balance) + amount
      }
    });

  } catch (error) {
    console.error('Failed to create escrow entry:', error);
    // Don't fail the entire webhook for escrow errors
  }
}

async function scheduleEscrowRelease(projectId: string) {
  // TODO: Implement escrow release logic
  // This would typically involve:
  // 1. Checking project completion status
  // 2. Verifying all conditions are met
  // 3. Releasing funds to project owner
  // 4. Sending notifications

  console.log(`Scheduling escrow release for project: ${projectId}`);
  
  // For now, just log the event
  await prisma.auditLog.create({
    data: {
      action: 'ESCROW_RELEASE_SCHEDULED',
      resource: 'PROJECT',
      resourceId: projectId,
      details: JSON.stringify({
        reason: 'Project fully funded',
        scheduledAt: new Date()
      }),
      severity: 'INFO'
    }
  });
}

// ==================== NOTIFICATIONS ====================

async function sendPaymentNotifications(payment: any, status: string) {
  try {
    const user = payment.user || payment.investment?.user;
    if (!user?.email) return;

    if (status === 'completed' && payment.investment) {
      // Send investment confirmation
      await sendInvestmentConfirmationEmail(
        user.email,
        user.firstName || 'Investor',
        payment.investment.project.title,
        Number(payment.amount)
      );

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'investment_confirmed',
          title: 'Investment Confirmed',
          message: `Your investment of ${payment.amount} ${payment.currency} in ${payment.investment.project.title} has been confirmed.`,
          data: {
            investmentId: payment.investment.id,
            projectId: payment.investment.projectId,
            amount: payment.amount,
            currency: payment.currency
          }
        }
      });

    } else if (status === 'failed') {
      // Send payment failed notification
      await sendPaymentFailedEmail(
        user.email,
        user.firstName || 'User',
        payment.investment?.project?.title || 'Investment',
        Number(payment.amount)
      );

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment of ${payment.amount} ${payment.currency} could not be processed. Please try again or contact support.`,
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            errorMessage: payment.errorMessage
          }
        }
      });
    }

  } catch (error) {
    console.error('Failed to send payment notifications:', error);
    // Don't fail webhook for notification errors
  }
}

// ==================== PROVIDER-SPECIFIC ENDPOINTS ====================

// These can be used if providers require specific webhook URLs

export { POST as GET }; // Some providers use GET for testing