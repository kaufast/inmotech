/**
 * Payment Service Integration
 * Supports OpenPay (Mexico) and Lemonway (EU) payment providers
 */

// Mock PSPProvider enum for build
type PSPProvider = 'OPENPAY' | 'LEMONWAY' | 'STRIPE' | 'MOCK';
export type { PSPProvider };

export interface PaymentIntentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  userId: string;
  investmentId?: string;
  userJurisdiction?: string | null;
  description: string;
  metadata: Record<string, any>;
}

export interface PaymentIntentResponse {
  transactionId: string;
  sessionId?: string;
  clientSecret?: string;
  paymentUrl?: string;
  provider: PSPProvider;
  processingFee?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface WebhookPayload {
  provider: PSPProvider;
  transactionId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount?: number;
  currency?: string;
  metadata?: Record<string, any>;
  rawPayload: any;
}

// ==================== PAYMENT SERVICE ====================

export async function createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  const provider = determinePaymentProvider(request.userJurisdiction, request.currency);
  
  switch (provider) {
    case 'OPENPAY':
      return createOpenPayIntent(request);
    case 'LEMONWAY':
      return createLemonwayIntent(request);
    case 'STRIPE':
      return createStripeIntent(request);
    default:
      return createMockIntent(request);
  }
}

export async function processWebhook(payload: any, provider: PSPProvider): Promise<WebhookPayload> {
  switch (provider) {
    case 'OPENPAY':
      return processOpenPayWebhook(payload);
    case 'LEMONWAY':
      return processLemonwayWebhook(payload);
    case 'STRIPE':
      return processStripeWebhook(payload);
    default:
      return processMockWebhook(payload);
  }
}

// ==================== PROVIDER SELECTION ====================

function determinePaymentProvider(jurisdiction?: string | null, currency?: string): PSPProvider {
  // Mexico: Use OpenPay
  if (jurisdiction === 'MX' || currency === 'MXN') {
    return 'OPENPAY';
  }
  
  // EU countries: Use Lemonway
  const euCountries = ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'IE', 'FI', 'LU'];
  if (jurisdiction && euCountries.includes(jurisdiction)) {
    return 'LEMONWAY';
  }
  
  // Fallback to Stripe for other regions
  if (process.env.NODE_ENV === 'production') {
    return 'STRIPE';
  }
  
  // Development/testing
  return 'MOCK';
}

// ==================== OPENPAY INTEGRATION ====================

async function createOpenPayIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  const openPayConfig = {
    merchantId: process.env.OPENPAY_MERCHANT_ID!,
    privateKey: process.env.OPENPAY_PRIVATE_KEY!,
    publicKey: process.env.OPENPAY_PUBLIC_KEY!,
    sandbox: process.env.NODE_ENV !== 'production'
  };

  const baseUrl = openPayConfig.sandbox 
    ? 'https://sandbox-api.openpay.mx/v1'
    : 'https://api.openpay.mx/v1';

  const paymentData = {
    method: request.paymentMethod === 'card' ? 'card' : 'bank_account',
    amount: request.amount,
    currency: request.currency.toUpperCase(),
    description: request.description,
    order_id: `${request.investmentId}-${Date.now()}`,
    customer: {
      external_id: request.userId,
      requires_account: false
    },
    redirect_url: `${process.env.FRONTEND_URL}/payment/success`,
    webhook_url: `${process.env.API_URL}/api/payments/webhook/openpay`,
    metadata: request.metadata
  };

  try {
    const response = await fetch(`${baseUrl}/${openPayConfig.merchantId}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${openPayConfig.privateKey}:`).toString('base64')}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenPay API error: ${error.description || error.error_code}`);
    }

    const result = await response.json();

    return {
      transactionId: result.id,
      sessionId: result.order_id,
      paymentUrl: result.payment_method?.url,
      provider: 'OPENPAY',
      processingFee: calculateOpenPayFee(request.amount),
      status: 'pending'
    };

  } catch (error) {
    console.error('OpenPay payment creation failed:', error);
    throw new Error('Failed to create OpenPay payment intent');
  }
}

async function processOpenPayWebhook(payload: any): Promise<WebhookPayload> {
  // Verify webhook signature
  const expectedSignature = payload.verification_code;
  // TODO: Implement signature verification
  
  const transaction = payload.transaction || payload;
  const status = mapOpenPayStatus(transaction.status);
  
  return {
    provider: 'OPENPAY',
    transactionId: transaction.id,
    status,
    amount: transaction.amount,
    currency: transaction.currency,
    metadata: transaction.metadata,
    rawPayload: payload
  };
}

function mapOpenPayStatus(openPayStatus: string): 'completed' | 'failed' | 'cancelled' | 'refunded' {
  switch (openPayStatus?.toLowerCase()) {
    case 'completed':
    case 'charge_succeeded':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'failed':
    case 'charge_failed':
    default:
      return 'failed';
  }
}

function calculateOpenPayFee(amount: number): number {
  // OpenPay fee: 3.6% + $3 MXN for cards
  return (amount * 0.036) + 3;
}

// ==================== LEMONWAY INTEGRATION ====================

async function createLemonwayIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  const lemonwayConfig = {
    apiLogin: process.env.LEMONWAY_API_LOGIN!,
    apiPassword: process.env.LEMONWAY_API_PASSWORD!,
    environment: process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox'
  };

  const baseUrl = lemonwayConfig.environment === 'prod'
    ? 'https://ws.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx'
    : 'https://sandbox-api.lemonway.fr/mb/demo/dev/directkitjson2/Service.asmx';

  // Create wallet for user if not exists
  const walletData = {
    wallet: request.userId,
    clientMail: request.metadata.userEmail,
    clientTitle: 'Mr', // TODO: Get from user data
    clientFirstName: request.metadata.userFirstName,
    clientLastName: request.metadata.userLastName,
    currency: request.currency
  };

  // Create payment intent
  const paymentData = {
    wallet: request.userId,
    amountTot: request.amount.toString(),
    amountCom: calculateLemonwayFee(request.amount).toString(),
    message: request.description,
    autoCommission: '1',
    returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
    cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
    errorUrl: `${process.env.FRONTEND_URL}/payment/error`,
    notificationUrl: `${process.env.API_URL}/api/payments/webhook/lemonway`,
    template: 'https://webkit.lemonway.fr/css/kit.css'
  };

  try {
    // First register wallet
    const walletResponse = await fetch(`${baseUrl}/RegisterWallet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${lemonwayConfig.apiLogin}:${lemonwayConfig.apiPassword}`).toString('base64')}`
      },
      body: JSON.stringify(walletData)
    });

    // Create money-in web
    const paymentResponse = await fetch(`${baseUrl}/MoneyInWebInit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${lemonwayConfig.apiLogin}:${lemonwayConfig.apiPassword}`).toString('base64')}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(`Lemonway API error: ${error.message || 'Unknown error'}`);
    }

    const result = await paymentResponse.json();

    return {
      transactionId: result.d.TRANS.ID,
      sessionId: result.d.TOKEN,
      paymentUrl: `https://webkit.lemonway.fr/mb/demo/dev/directkit/?moneyintoken=${result.d.TOKEN}`,
      provider: 'LEMONWAY',
      processingFee: calculateLemonwayFee(request.amount),
      status: 'pending'
    };

  } catch (error) {
    console.error('Lemonway payment creation failed:', error);
    throw new Error('Failed to create Lemonway payment intent');
  }
}

async function processLemonwayWebhook(payload: any): Promise<WebhookPayload> {
  // Lemonway sends form-encoded data
  const status = mapLemonwayStatus(payload.STATUS);
  
  return {
    provider: 'LEMONWAY',
    transactionId: payload.ID,
    status,
    amount: parseFloat(payload.CRED || payload.DEB || '0'),
    currency: payload.CURRENCY || 'EUR',
    metadata: {
      wallet: payload.WALLET,
      type: payload.TYPE
    },
    rawPayload: payload
  };
}

function mapLemonwayStatus(lemonwayStatus: string): 'completed' | 'failed' | 'cancelled' | 'refunded' {
  switch (lemonwayStatus) {
    case '3': // Completed
      return 'completed';
    case '0': // Cancelled
      return 'cancelled';
    case '4': // Refunded
      return 'refunded';
    case '1': // Pending
    case '2': // Failed
    default:
      return 'failed';
  }
}

function calculateLemonwayFee(amount: number): number {
  // Lemonway fee: 1.2% + €0.18 for SEPA
  return (amount * 0.012) + 0.18;
}

// ==================== STRIPE INTEGRATION ====================

async function createStripeIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  // Basic Stripe integration for other regions
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured');
  }
  
  let stripe;
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    throw new Error('Stripe package not installed');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(request.amount * 100), // Stripe uses cents
      currency: request.currency.toLowerCase(),
      payment_method_types: ['card'],
      metadata: {
        ...request.metadata,
        userId: request.userId,
        investmentId: request.investmentId || ''
      },
      description: request.description
    });

    return {
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      provider: 'STRIPE',
      processingFee: calculateStripeFee(request.amount),
      status: 'pending'
    };

  } catch (error) {
    console.error('Stripe payment creation failed:', error);
    throw new Error('Failed to create Stripe payment intent');
  }
}

async function processStripeWebhook(payload: any): Promise<WebhookPayload> {
  const event = payload;
  let status: 'completed' | 'failed' | 'cancelled' | 'refunded';

  switch (event.type) {
    case 'payment_intent.succeeded':
      status = 'completed';
      break;
    case 'payment_intent.payment_failed':
      status = 'failed';
      break;
    case 'payment_intent.canceled':
      status = 'cancelled';
      break;
    case 'charge.dispute.created':
      status = 'refunded';
      break;
    default:
      status = 'failed';
  }

  const paymentIntent = event.data.object;

  return {
    provider: 'STRIPE',
    transactionId: paymentIntent.id,
    status,
    amount: paymentIntent.amount / 100, // Convert from cents
    currency: paymentIntent.currency.toUpperCase(),
    metadata: paymentIntent.metadata,
    rawPayload: payload
  };
}

function calculateStripeFee(amount: number): number {
  // Stripe fee: 2.9% + $0.30
  return (amount * 0.029) + 0.30;
}

// ==================== MOCK INTEGRATION (DEVELOPMENT) ====================

async function createMockIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
  // Mock payment for development/testing
  const transactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    transactionId,
    sessionId: `session_${transactionId}`,
    paymentUrl: `${process.env.FRONTEND_URL}/payment/mock?intent=${transactionId}`,
    provider: 'MOCK',
    processingFee: 0,
    status: 'pending'
  };
}

async function processMockWebhook(payload: any): Promise<WebhookPayload> {
  return {
    provider: 'MOCK',
    transactionId: payload.transactionId || payload.id,
    status: payload.status || 'completed',
    amount: payload.amount || 0,
    currency: payload.currency || 'EUR',
    metadata: payload.metadata || {},
    rawPayload: payload
  };
}

// ==================== REFUND PROCESSING ====================

export async function processRefund(transactionId: string, amount: number, reason: string): Promise<{success: boolean, refundId?: string, error?: string}> {
  // Implementation depends on the PSP provider
  // This would be called when project funding fails or cancellation occurs
  
  try {
    // Determine provider from transaction ID or lookup in database
    // For now, return mock success
    return {
      success: true,
      refundId: `refund_${Date.now()}`
    };
  } catch (error) {
    console.error('Refund processing failed:', error);
    return {
      success: false,
      error: 'Failed to process refund'
    };
  }
}