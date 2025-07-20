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
}

// OpenPay integration for Mexico
class OpenPayProcessor {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENPAY_API_KEY!;
    this.merchantId = process.env.OPENPAY_MERCHANT_ID!;
    this.baseUrl = process.env.OPENPAY_SANDBOX === 'true' 
      ? 'https://sandbox-api.openpay.mx/v1' 
      : 'https://api.openpay.mx/v1';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const auth = Buffer.from(`${this.apiKey}:`).toString('base64');
      
      const payload = {
        method: this.mapPaymentMethod(request.method),
        amount: request.amount,
        currency: request.currency.toUpperCase(),
        description: `Investment in project ${request.metadata.projectId}`,
        order_id: request.metadata.investmentId,
        customer: {
          name: request.details.customerName,
          email: request.details.customerEmail,
        },
        ...(request.details.cardToken && {
          source_id: request.details.cardToken
        }),
        confirmation_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/confirm`,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      };

      const response = await fetch(
        `${this.baseUrl}/${this.merchantId}/charges`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.description || 'Payment failed',
        };
      }

      return {
        success: true,
        transactionId: data.id,
        requiresAction: data.status === 'in_progress',
        actionUrl: data.payment_method?.url,
      };

    } catch (error) {
      console.error('OpenPay payment error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private mapPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      'card': 'card',
      'bank_transfer': 'bank_account',
      'spei': 'bank_account',
      'oxxo': 'store',
    };
    return methodMap[method] || 'card';
  }
}

// Lemonway integration for EU
class LemonwayProcessor {
  private apiKey: string;
  private login: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.LEMONWAY_API_KEY!;
    this.login = process.env.LEMONWAY_LOGIN!;
    this.baseUrl = process.env.LEMONWAY_SANDBOX === 'true'
      ? 'https://sandbox-api.lemonway.fr/mb/kaufast/dev/directkitjson2/Service.asmx'
      : 'https://ws.lemonway.fr/mb/kaufast/prod/directkitjson2/Service.asmx';
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // First, create or get wallet for user
      const walletId = await this.ensureUserWallet(
        request.metadata.userId,
        request.details.customerEmail,
        request.details.customerName
      );

      if (!walletId) {
        return {
          success: false,
          error: 'Failed to create user wallet',
        };
      }

      // Process payment based on method
      if (request.method === 'card') {
        return await this.processCardPayment(request, walletId);
      } else if (request.method === 'bank_transfer') {
        return await this.processBankTransfer(request, walletId);
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

  private async ensureUserWallet(
    userId: string, 
    email: string, 
    name: string
  ): Promise<string | null> {
    const walletId = `USER_${userId}`;
    
    const payload = {
      p: {
        wlLogin: this.login,
        wlPass: this.apiKey,
        language: 'en',
        version: '1.1',
        walletIp: '127.0.0.1',
        walletUa: 'InmoTech/1.0',
        wallet: walletId,
        clientMail: email,
        clientTitle: name.split(' ')[0],
        clientFirstName: name.split(' ')[0],
        clientLastName: name.split(' ').slice(1).join(' ') || name,
      }
    };

    const response = await fetch(`${this.baseUrl}/RegisterWallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.d?.E?.Code === '0' || data.d?.E?.Code === '1') {
      return walletId;
    }

    return null;
  }

  private async processCardPayment(
    request: PaymentRequest,
    walletId: string
  ): Promise<PaymentResult> {
    const payload = {
      p: {
        wlLogin: this.login,
        wlPass: this.apiKey,
        language: 'en',
        version: '1.1',
        walletIp: '127.0.0.1',
        walletUa: 'InmoTech/1.0',
        wallet: walletId,
        amountTot: request.amount.toString(),
        amountCom: '0',
        comment: `Investment ${request.metadata.investmentId}`,
        returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
        errorUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
        token: request.details.cardToken,
      }
    };

    const response = await fetch(`${this.baseUrl}/MoneyInWithCardId`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.d?.E?.Code === '0') {
      return {
        success: true,
        transactionId: data.d?.TRANS?.[0]?.ID,
      };
    }

    return {
      success: false,
      error: data.d?.E?.Msg || 'Card payment failed',
    };
  }

  private async processBankTransfer(
    request: PaymentRequest,
    walletId: string
  ): Promise<PaymentResult> {
    // Generate IBAN for bank transfer
    const payload = {
      p: {
        wlLogin: this.login,
        wlPass: this.apiKey,
        language: 'en',
        version: '1.1',
        walletIp: '127.0.0.1',
        walletUa: 'InmoTech/1.0',
        wallet: walletId,
        amountTot: request.amount.toString(),
        autoCommission: '0',
        comment: `Investment ${request.metadata.investmentId}`,
      }
    };

    const response = await fetch(`${this.baseUrl}/MoneyInIbanGenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.d?.E?.Code === '0') {
      return {
        success: true,
        transactionId: data.d?.TRANS?.[0]?.ID,
        requiresAction: true,
        actionUrl: data.d?.IBAN_FULLNAME, // IBAN details for transfer
      };
    }

    return {
      success: false,
      error: data.d?.E?.Msg || 'Bank transfer setup failed',
    };
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