// Payment processing for OpenPay (Mexico) and Lemonway (EU)

interface PaymentRequest {
  amount: number;
  currency: string;
  method: 'card' | 'bank_transfer' | 'spei' | 'oxxo';
  details: {
    cardToken?: string;
    bankAccount?: string;
    customerEmail: string;
    customerName: string;
    customerId?: string;
    deviceSessionId?: string; // For OpenPay fraud prevention
  };
  metadata: {
    investmentId: string;
    projectId: string;
    userId: string;
  };
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  metadata?: any;
}

// OpenPay integration for Mexico using official SDK
class OpenPayProcessor {
  private openpay: any;
  private merchantId: string;

  constructor() {
    // Dynamic import to avoid server-side issues
    const Openpay = require('openpay');
    this.merchantId = process.env.OPENPAY_MERCHANT_ID!;
    this.openpay = new Openpay(
      this.merchantId,
      process.env.OPENPAY_PRIVATE_KEY!,
      process.env.OPENPAY_PRODUCTION === 'true'
    );
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Create or get customer
      const customer = await this.ensureCustomer(
        request.metadata.userId,
        request.details.customerEmail,
        request.details.customerName
      );

      if (!customer) {
        return {
          success: false,
          error: 'Failed to create customer',
        };
      }

      // Process based on payment method
      switch (request.method) {
        case 'card':
          return await this.processCardPayment(request, customer.id);
        case 'spei':
          return await this.processSPEIPayment(request, customer.id);
        case 'oxxo':
          return await this.processOXXOPayment(request, customer.id);
        default:
          return {
            success: false,
            error: 'Unsupported payment method',
          };
      }

    } catch (error) {
      console.error('OpenPay payment error:', error);
      return {
        success: false,
        error: (error as any)?.description || 'Payment processing failed',
      };
    }
  }

  private async ensureCustomer(userId: string, email: string, name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const customerRequest = {
        external_id: userId,
        name: name,
        email: email,
        requires_account: false
      };

      // Try to get existing customer first
      this.openpay.customers.get(userId, (error: any, customer: any) => {
        if (!error && customer) {
          resolve(customer);
        } else {
          // Create new customer
          this.openpay.customers.create(customerRequest, (error: any, customer: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(customer);
            }
          });
        }
      });
    });
  }

  private async processCardPayment(request: PaymentRequest, customerId: string): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const chargeRequest = {
        method: 'card',
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        description: `Investment ${request.metadata.investmentId}`,
        order_id: request.metadata.investmentId,
        device_session_id: request.details.deviceSessionId,
        customer: {
          customer_id: customerId
        },
        ...(request.details.cardToken && {
          source_id: request.details.cardToken
        }),
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?investmentId=${request.metadata.investmentId}`
      };

      this.openpay.charges.create(chargeRequest, (error: any, charge: any) => {
        if (error) {
          resolve({
            success: false,
            error: (error as any)?.description || 'Card payment failed',
          });
        } else {
          resolve({
            success: true,
            transactionId: charge.id,
            requiresAction: charge.status === 'in_progress',
            actionUrl: charge.payment_method?.url,
          });
        }
      });
    });
  }

  private async processSPEIPayment(request: PaymentRequest, customerId: string): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const chargeRequest = {
        method: 'bank_account',
        amount: request.amount,
        currency: 'MXN',
        description: `Investment ${request.metadata.investmentId}`,
        order_id: request.metadata.investmentId,
        customer: {
          customer_id: customerId
        }
      };

      this.openpay.charges.create(chargeRequest, (error: any, charge: any) => {
        if (error) {
          resolve({
            success: false,
            error: (error as any)?.description || 'SPEI payment failed',
          });
        } else {
          resolve({
            success: true,
            transactionId: charge.id,
            requiresAction: true,
            actionUrl: charge.payment_method?.bank_account?.clabe, // CLABE for bank transfer
          });
        }
      });
    });
  }

  private async processOXXOPayment(request: PaymentRequest, customerId: string): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const chargeRequest = {
        method: 'store',
        amount: request.amount,
        currency: 'MXN',
        description: `Investment ${request.metadata.investmentId}`,
        order_id: request.metadata.investmentId,
        customer: {
          customer_id: customerId
        },
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days to pay
      };

      this.openpay.charges.create(chargeRequest, (error: any, charge: any) => {
        if (error) {
          resolve({
            success: false,
            error: (error as any)?.description || 'OXXO payment failed',
          });
        } else {
          resolve({
            success: true,
            transactionId: charge.id,
            requiresAction: true,
            actionUrl: charge.payment_method?.reference, // OXXO payment reference
          });
        }
      });
    });
  }
}

// Lemonway integration for EU using official SDK pattern
class LemonwayProcessor {
  private authorization: string;
  private sdk: any;

  constructor() {
    this.authorization = process.env.LEMONWAY_AUTHORIZATION || '54321';
    // Initialize Lemonway SDK
    const sdk = require("api")("@lemonportal/v1.1#2j3hc41dls8ur5kp");
    this.sdk = sdk;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // For card payments, use the CardWebInit endpoint
      if (request.method === 'card') {
        return await this.processCardWebInit(request);
      } else if (request.method === 'bank_transfer') {
        return await this.processBankTransfer(request);
      }

      return {
        success: false,
        error: 'Unsupported payment method',
      };

    } catch (error) {
      console.error('Lemonway payment error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private async processCardWebInit(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const result = await this.sdk.moneyIns_CardWebInitPost({
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        errorUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
        accountId: request.metadata.userId,
        totalAmount: Math.round(request.amount * 100), // Convert to cents
        commissionAmount: 0, // Platform commission
      }, {
        authorization: this.authorization,
        "psu-ip-address": "127.0.0.1",
      });

      return {
        success: true,
        transactionId: result.data.id.toString(),
        requiresAction: true,
        actionUrl: result.data.webKitToken ? 
          `https://webkit.lemonway.com/mb/inmote/prod/init?wkToken=${result.data.webKitToken}` : 
          undefined,
        metadata: {
          webKitToken: result.data.webKitToken,
          cardId: result.data.cardId,
        },
      };

    } catch (error) {
      console.error('Lemonway CardWebInit error:', error);
      return {
        success: false,
        error: 'Card payment initialization failed',
      };
    }
  }


  private async processBankTransfer(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // For SEPA bank transfers in EU
      const payload = {
        accountId: request.metadata.userId,
        totalAmount: Math.round(request.amount * 100), // Convert to cents
        commissionAmount: 0,
        comment: `Investment ${request.metadata.investmentId}`,
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        errorUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      };

      // For now, return placeholder - would implement SEPA transfer via SDK
      return {
        success: false,
        error: 'SEPA bank transfers not yet implemented with new SDK',
      };

    } catch (error) {
      console.error('Lemonway SEPA transfer error:', error);
      return {
        success: false,
        error: 'Bank transfer setup failed',
      };
    }
  }
}

// Main payment processor
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
  // Determine processor based on currency/region
  if (request.currency === 'MXN' || request.method === 'spei' || request.method === 'oxxo') {
    const processor = new OpenPayProcessor();
    return await processor.processPayment(request);
  } else if (['EUR', 'GBP', 'USD'].includes(request.currency)) {
    const processor = new LemonwayProcessor();
    return await processor.processPayment(request);
  }

  return {
    success: false,
    error: 'Unsupported currency or payment method',
  };
}