import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * OpenPay-specific webhook endpoint
 * Handles OpenPay webhook format and validation
 */

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get('x-openpay-signature');
    const userAgent = headersList.get('user-agent') || '';

    // Verify this is actually from OpenPay
    if (!userAgent.includes('OpenPay') && process.env.NODE_ENV === 'production') {
      console.error('Invalid user agent for OpenPay webhook:', userAgent);
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      );
    }

    const rawPayload = await request.text();
    
    // Verify OpenPay webhook signature
    if (process.env.NODE_ENV === 'production' && !verifyOpenPaySignature(rawPayload, signature)) {
      console.error('Invalid OpenPay webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse OpenPay payload
    const payload = JSON.parse(rawPayload);
    
    // OpenPay webhook structure
    const webhookType = payload.type;
    const transaction = payload.transaction || payload.data?.object;
    
    if (!transaction) {
      console.error('No transaction data in OpenPay webhook');
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Process different OpenPay event types
    switch (webhookType) {
      case 'charge.succeeded':
        await handleOpenPayChargeSucceeded(transaction);
        break;
      case 'charge.failed':
        await handleOpenPayChargeFailed(transaction);
        break;
      case 'charge.cancelled':
        await handleOpenPayChargeCancelled(transaction);
        break;
      case 'charge.refunded':
        await handleOpenPayChargeRefunded(transaction);
        break;
      case 'chargeback.created':
        await handleOpenPayChargeback(transaction);
        break;
      default:
        console.warn(`Unhandled OpenPay webhook type: ${webhookType}`);
    }

    // Log successful webhook processing
    await prisma.auditLog.create({
      data: {
        action: 'OPENPAY_WEBHOOK_PROCESSED',
        resource: 'PAYMENT',
        resourceId: transaction.id,
        details: JSON.stringify({
          type: webhookType,
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'INFO'
      }
    });

    // OpenPay expects 200 OK response
    return NextResponse.json({ 
      received: true,
      processed: true,
      transaction_id: transaction.id
    });

  } catch (error) {
    console.error('OpenPay webhook processing error:', error);
    
    // Log failed webhook
    await prisma.auditLog.create({
      data: {
        action: 'OPENPAY_WEBHOOK_FAILED',
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

// ==================== SIGNATURE VERIFICATION ====================

function verifyOpenPaySignature(payload: string, signature?: string | null): boolean {
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

// ==================== EVENT HANDLERS ====================

async function handleOpenPayChargeSucceeded(transaction: any) {
  console.log(`OpenPay charge succeeded: ${transaction.id}`);
  
  await updatePaymentStatus(transaction.id, 'COMPLETED', {
    completedAt: new Date(),
    processedAt: new Date(),
    pspResponse: transaction
  });
}

async function handleOpenPayChargeFailed(transaction: any) {
  console.log(`OpenPay charge failed: ${transaction.id}`);
  
  await updatePaymentStatus(transaction.id, 'FAILED', {
    failedAt: new Date(),
    errorCode: transaction.error_code,
    errorMessage: transaction.description || 'Payment failed',
    pspResponse: transaction
  });
}

async function handleOpenPayChargeCancelled(transaction: any) {
  console.log(`OpenPay charge cancelled: ${transaction.id}`);
  
  await updatePaymentStatus(transaction.id, 'CANCELLED', {
    cancelledAt: new Date(),
    pspResponse: transaction
  });
}

async function handleOpenPayChargeRefunded(transaction: any) {
  console.log(`OpenPay charge refunded: ${transaction.id}`);
  
  await updatePaymentStatus(transaction.id, 'REFUNDED', {
    refundedAt: new Date(),
    pspResponse: transaction
  });

  // Create refund record
  const payment = await prisma.payment.findFirst({
    where: { pspTransactionId: transaction.id }
  });

  if (payment) {
    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: transaction.refund?.amount || transaction.amount,
        reason: transaction.refund?.description || 'Refund processed',
        status: 'COMPLETED',
        pspRefundId: transaction.refund?.id,
        processedAt: new Date()
      }
    });
  }
}

async function handleOpenPayChargeback(transaction: any) {
  console.log(`OpenPay chargeback created: ${transaction.id}`);
  
  // Handle chargeback as a forced refund
  await updatePaymentStatus(transaction.id, 'REFUNDED', {
    refundedAt: new Date(),
    errorCode: 'chargeback',
    errorMessage: 'Chargeback created',
    pspResponse: transaction
  });

  // TODO: Notify administrators about chargeback
  // TODO: Mark investment as disputed
}

// ==================== HELPER FUNCTIONS ====================

async function updatePaymentStatus(transactionId: string, status: string, additionalData: any = {}) {
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
          project: true,
          user: true
        }
      }
    }
  });

  if (!payment) {
    console.error(`Payment not found for OpenPay transaction: ${transactionId}`);
    return;
  }

  // Update payment record
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      updatedAt: new Date(),
      ...additionalData
    }
  });

  // Update investment if applicable
  if (payment.investment) {
    const investmentUpdate: any = {
      paymentStatus: status,
      updatedAt: new Date()
    };

    if (status === 'COMPLETED') {
      investmentUpdate.status = 'CONFIRMED';
      investmentUpdate.confirmedAt = new Date();
      investmentUpdate.investmentDate = new Date();

      // Update project funding
      const newFunding = Number(payment.investment.project.currentFunding) + Number(payment.amount);
      await prisma.project.update({
        where: { id: payment.investment.projectId },
        data: {
          currentFunding: newFunding
        }
      });

      // Update user total invested
      const newTotal = Number(payment.investment.user.totalInvested) + Number(payment.amount);
      await prisma.user.update({
        where: { id: payment.investment.userId },
        data: {
          totalInvested: newTotal
        }
      });

    } else if (status === 'FAILED' || status === 'CANCELLED') {
      investmentUpdate.status = 'FAILED';
      if (status === 'CANCELLED') {
        investmentUpdate.cancelledAt = new Date();
      }
    } else if (status === 'REFUNDED') {
      investmentUpdate.status = 'REFUNDED';
      investmentUpdate.refundedAt = new Date();

      // Reverse the funding amounts
      const newFunding = Math.max(0, Number(payment.investment.project.currentFunding) - Number(payment.amount));
      const newTotal = Math.max(0, Number(payment.investment.user.totalInvested) - Number(payment.amount));

      await Promise.all([
        prisma.project.update({
          where: { id: payment.investment.projectId },
          data: { currentFunding: newFunding }
        }),
        prisma.user.update({
          where: { id: payment.investment.userId },
          data: { totalInvested: newTotal }
        })
      ]);
    }

    await prisma.investment.update({
      where: { id: payment.investment.id },
      data: investmentUpdate
    });
  }
}

// Handle GET requests for OpenPay webhook testing
export async function GET(request: NextRequest) {
  // OpenPay sometimes sends GET requests to verify webhook endpoints
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    status: 'OpenPay webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}