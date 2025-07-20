import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

/**
 * Lemonway-specific webhook endpoint
 * Handles Lemonway webhook format (form-encoded data)
 */

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const contentType = headersList.get('content-type') || '';
    const userAgent = headersList.get('user-agent') || '';

    // Lemonway sends form-encoded data
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      console.error('Invalid content type for Lemonway webhook:', contentType);
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Verify request is from Lemonway (IP-based verification in production)
    if (process.env.NODE_ENV === 'production' && !isLemonwayIP(request.ip)) {
      console.error('Webhook not from Lemonway IP:', request.ip);
      return NextResponse.json(
        { error: 'Invalid request source' },
        { status: 403 }
      );
    }

    const rawPayload = await request.text();
    
    // Parse form-encoded data
    const formData = new URLSearchParams(rawPayload);
    const payload = Object.fromEntries(formData);
    
    // Validate required Lemonway fields
    if (!payload.ID || !payload.STATUS) {
      console.error('Missing required fields in Lemonway webhook:', payload);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    // Process Lemonway webhook
    await handleLemonwayWebhook(payload);

    // Log successful webhook processing
    await prisma.auditLog.create({
      data: {
        action: 'LEMONWAY_WEBHOOK_PROCESSED',
        resource: 'PAYMENT',
        resourceId: payload.ID,
        details: JSON.stringify({
          transactionId: payload.ID,
          status: payload.STATUS,
          amount: payload.CRED || payload.DEB,
          currency: payload.CURRENCY || 'EUR',
          wallet: payload.WALLET,
          type: payload.TYPE
        }),
        ipAddress: request.ip,
        userAgent: request.headers.get('user-agent'),
        severity: 'INFO'
      }
    });

    // Lemonway expects specific response format
    return new NextResponse('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('Lemonway webhook processing error:', error);
    
    // Log failed webhook
    await prisma.auditLog.create({
      data: {
        action: 'LEMONWAY_WEBHOOK_FAILED',
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

    return new NextResponse('ERROR', { status: 500 });
  }
}

// ==================== IP VERIFICATION ====================

function isLemonwayIP(clientIP?: string | null): boolean {
  if (!clientIP) return false;
  
  // Lemonway webhook IP ranges (these should be updated from their documentation)
  const lemonwayIPs = [
    '82.239.153.4',
    '82.239.153.5',
    '82.239.153.6',
    '195.101.112.0/24', // Example range
    // Add more IPs as provided by Lemonway
  ];
  
  // For development, allow localhost
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  return lemonwayIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // Handle CIDR ranges
      return isIPInRange(clientIP, allowedIP);
    }
    return clientIP === allowedIP;
  });
}

function isIPInRange(ip: string, cidr: string): boolean {
  // Simple CIDR check implementation
  // In production, use a proper IP range library
  const [range, bits] = cidr.split('/');
  const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  
  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// ==================== WEBHOOK HANDLER ====================

async function handleLemonwayWebhook(payload: any) {
  const transactionId = payload.ID;
  const status = mapLemonwayStatus(payload.STATUS);
  const amount = parseFloat(payload.CRED || payload.DEB || '0');
  const currency = payload.CURRENCY || 'EUR';
  const walletId = payload.WALLET;
  const transactionType = payload.TYPE;

  console.log(`Lemonway webhook: ${transactionId}, status: ${status}, amount: ${amount}`);

  // Different handling based on transaction type
  switch (transactionType) {
    case 'MoneyIn':
      await handleLemonwayMoneyIn(transactionId, status, amount, currency, payload);
      break;
    case 'MoneyOut':
      await handleLemonwayMoneyOut(transactionId, status, amount, currency, payload);
      break;
    case 'Refund':
      await handleLemonwayRefund(transactionId, status, amount, currency, payload);
      break;
    default:
      console.warn(`Unhandled Lemonway transaction type: ${transactionType}`);
  }
}

function mapLemonwayStatus(lemonwayStatus: string): 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PROCESSING' {
  switch (lemonwayStatus) {
    case '3': // Completed
      return 'COMPLETED';
    case '0': // Cancelled
      return 'CANCELLED';
    case '4': // Refunded
      return 'REFUNDED';
    case '1': // Pending
      return 'PROCESSING';
    case '2': // Failed
    default:
      return 'FAILED';
  }
}

// ==================== TRANSACTION TYPE HANDLERS ====================

async function handleLemonwayMoneyIn(transactionId: string, status: string, amount: number, currency: string, payload: any) {
  const payment = await findPaymentByTransaction(transactionId);
  
  if (!payment) {
    console.error(`Payment not found for Lemonway transaction: ${transactionId}`);
    return;
  }

  // Update payment status
  const updateData: any = {
    status,
    updatedAt: new Date(),
    pspResponse: payload
  };

  if (status === 'COMPLETED') {
    updateData.completedAt = new Date();
    updateData.processedAt = new Date();
    
    // Handle successful investment payment
    if (payment.investment) {
      await handleSuccessfulInvestment(payment, amount);
    }
    
  } else if (status === 'FAILED') {
    updateData.failedAt = new Date();
    updateData.errorCode = payload.ERROR || 'payment_failed';
    updateData.errorMessage = payload.MESSAGE || 'Payment failed via Lemonway';
    
  } else if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: updateData
  });
}

async function handleLemonwayMoneyOut(transactionId: string, status: string, amount: number, currency: string, payload: any) {
  // Handle money out transactions (withdrawals, return payments)
  console.log(`Lemonway MoneyOut: ${transactionId}, status: ${status}`);
  
  // Find related return payment or withdrawal
  const returnPayment = await prisma.returnPayment.findFirst({
    where: { 
      // Assuming we store Lemonway transaction ID in description or custom field
      description: { contains: transactionId }
    }
  });

  if (returnPayment) {
    await prisma.returnPayment.update({
      where: { id: returnPayment.id },
      data: {
        status: status === 'COMPLETED' ? 'PROCESSED' : 'FAILED'
      }
    });
  }
}

async function handleLemonwayRefund(transactionId: string, status: string, amount: number, currency: string, payload: any) {
  // Handle refund transactions
  const payment = await findPaymentByTransaction(payload.INT_TRANS_ID || transactionId);
  
  if (!payment) {
    console.error(`Original payment not found for Lemonway refund: ${transactionId}`);
    return;
  }

  if (status === 'COMPLETED') {
    // Create refund record
    await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount,
        reason: payload.MESSAGE || 'Refund processed',
        status: 'COMPLETED',
        pspRefundId: transactionId,
        processedAt: new Date()
      }
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date()
      }
    });

    // Handle investment refund
    if (payment.investment) {
      await handleInvestmentRefund(payment.investment, amount);
    }
  }
}

// ==================== HELPER FUNCTIONS ====================

async function findPaymentByTransaction(transactionId: string) {
  return prisma.payment.findFirst({
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
      },
      user: true
    }
  });
}

async function handleSuccessfulInvestment(payment: any, amount: number) {
  if (!payment.investment) return;

  // Update investment status
  await prisma.investment.update({
    where: { id: payment.investment.id },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'COMPLETED',
      confirmedAt: new Date(),
      investmentDate: new Date()
    }
  });

  // Update project funding
  const newFunding = Number(payment.investment.project.currentFunding) + amount;
  await prisma.project.update({
    where: { id: payment.investment.projectId },
    data: {
      currentFunding: newFunding
    }
  });

  // Update user total invested
  const newTotal = Number(payment.investment.user.totalInvested) + amount;
  await prisma.user.update({
    where: { id: payment.investment.userId },
    data: {
      totalInvested: newTotal
    }
  });

  // Create/update escrow entry
  await createLemonwayEscrowEntry(payment.investment, amount);

  // Check if project is fully funded
  if (newFunding >= Number(payment.investment.project.targetFunding)) {
    await prisma.project.update({
      where: { id: payment.investment.projectId },
      data: {
        status: 'FUNDING_COMPLETE'
      }
    });
  }
}

async function handleInvestmentRefund(investment: any, amount: number) {
  // Update investment status
  await prisma.investment.update({
    where: { id: investment.id },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date()
    }
  });

  // Reverse funding amounts
  const newFunding = Math.max(0, Number(investment.project.currentFunding) - amount);
  const newTotal = Math.max(0, Number(investment.user.totalInvested) - amount);

  await Promise.all([
    prisma.project.update({
      where: { id: investment.projectId },
      data: { currentFunding: newFunding }
    }),
    prisma.user.update({
      where: { id: investment.userId },
      data: { totalInvested: newTotal }
    })
  ]);
}

async function createLemonwayEscrowEntry(investment: any, amount: number) {
  try {
    // Find or create escrow account
    let escrowAccount = await prisma.escrowAccount.findFirst({
      where: { projectId: investment.projectId }
    });

    if (!escrowAccount) {
      escrowAccount = await prisma.escrowAccount.create({
        data: {
          projectId: investment.projectId,
          accountNumber: `LW-${investment.projectId}-${Date.now()}`,
          pspProvider: 'LEMONWAY',
          balance: 0,
          currency: 'EUR'
        }
      });
    }

    // Create escrow entry
    await prisma.escrowEntry.create({
      data: {
        escrowAccountId: escrowAccount.id,
        paymentId: investment.payments[0]?.id,
        entryType: 'DEPOSIT',
        amount,
        description: `Lemonway deposit for ${investment.project.title}`,
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
    console.error('Failed to create Lemonway escrow entry:', error);
  }
}

// Handle GET requests for endpoint verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'Lemonway webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}