# OpenPay Integration Guide for Mexico

## 🇲🇽 Complete OpenPay Setup

Based on your OpenPay credentials, here's the complete integration guide for Mexican payments.

### 1. Environment Setup

Add to your `.env.local`:

```bash
# OpenPay Configuration
OPENPAY_MERCHANT_ID="moiep6umtcnanql3jrxp"
OPENPAY_PRIVATE_KEY="sk_3433941e467c4875b178ce26348b0fac"
OPENPAY_PRODUCTION="false"  # Set to "true" when ready for production
```

### 2. Frontend Integration

#### Install OpenPay.js for tokenization

```html
<!-- Add to your layout or payment page -->
<script type="text/javascript" src="https://openpay.s3.amazonaws.com/openpay.v1.min.js"></script>
<script type="text/javascript" src="https://openpay.s3.amazonaws.com/openpay-data.v1.min.js"></script>
```

#### Create Card Token Component

```typescript
// src/components/payment/OpenpayCardForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    OpenPay: any;
  }
}

interface OpenpayCardFormProps {
  merchantId: string;
  publicKey: string;
  sandbox: boolean;
  onTokenCreated: (token: string) => void;
}

export default function OpenpayCardForm({ 
  merchantId, 
  publicKey, 
  sandbox,
  onTokenCreated 
}: OpenpayCardFormProps) {
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    holderName: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: ''
  });
  const [deviceSessionId, setDeviceSessionId] = useState('');

  useEffect(() => {
    // Initialize OpenPay
    if (window.OpenPay) {
      window.OpenPay.setId(merchantId);
      window.OpenPay.setApiKey(publicKey);
      window.OpenPay.setSandboxMode(sandbox);
      
      // Generate device session ID for fraud prevention
      const sessionId = window.OpenPay.deviceData.setup();
      setDeviceSessionId(sessionId);
    }
  }, [merchantId, publicKey, sandbox]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const card = {
      card_number: cardDetails.cardNumber.replace(/\s/g, ''),
      holder_name: cardDetails.holderName,
      expiration_month: cardDetails.expirationMonth,
      expiration_year: cardDetails.expirationYear,
      cvv2: cardDetails.cvv
    };

    window.OpenPay.token.create(
      card,
      (response: any) => {
        // Success - pass token to parent
        onTokenCreated(response.data.id);
      },
      (error: any) => {
        // Error - show message
        toast.error(error.data.description || 'Card validation failed');
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Number
        </label>
        <input
          type="text"
          value={cardDetails.cardNumber}
          onChange={(e) => setCardDetails({
            ...cardDetails,
            cardNumber: e.target.value
          })}
          placeholder="4111 1111 1111 1111"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          maxLength={19}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardDetails.holderName}
          onChange={(e) => setCardDetails({
            ...cardDetails,
            holderName: e.target.value
          })}
          placeholder="John Doe"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Month
          </label>
          <input
            type="text"
            value={cardDetails.expirationMonth}
            onChange={(e) => setCardDetails({
              ...cardDetails,
              expirationMonth: e.target.value
            })}
            placeholder="MM"
            maxLength={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            type="text"
            value={cardDetails.expirationYear}
            onChange={(e) => setCardDetails({
              ...cardDetails,
              expirationYear: e.target.value
            })}
            placeholder="YY"
            maxLength={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            CVV
          </label>
          <input
            type="text"
            value={cardDetails.cvv}
            onChange={(e) => setCardDetails({
              ...cardDetails,
              cvv: e.target.value
            })}
            placeholder="123"
            maxLength={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>

      <input type="hidden" name="deviceSessionId" value={deviceSessionId} />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Process Payment
      </button>
    </form>
  );
}
```

### 3. Payment Method Selection

```typescript
// src/components/payment/MexicanPaymentMethods.tsx
import { CreditCard, Building, Store } from 'lucide-react';

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay instantly with Visa, MasterCard, or American Express',
    icon: CreditCard,
    fee: '3.5% + $3 MXN'
  },
  {
    id: 'spei',
    name: 'Bank Transfer (SPEI)',
    description: 'Transfer from any Mexican bank',
    icon: Building,
    fee: '$8 MXN'
  },
  {
    id: 'oxxo',
    name: 'Cash at OXXO',
    description: 'Pay in cash at any OXXO store within 3 days',
    icon: Store,
    fee: '$10 MXN'
  }
];

export default function MexicanPaymentMethods({ 
  onSelect 
}: { 
  onSelect: (method: string) => void 
}) {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          className="w-full p-4 border rounded-lg hover:border-blue-500 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <method.icon className="w-6 h-6 text-gray-600" />
              <div className="text-left">
                <h3 className="font-medium">{method.name}</h3>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
            </div>
            <span className="text-sm text-gray-400">{method.fee}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

### 4. SPEI Payment Instructions

When user selects SPEI, show the bank details:

```typescript
// src/components/payment/SPEIInstructions.tsx
interface SPEIInstructionsProps {
  clabe: string;
  amount: number;
  reference: string;
}

export default function SPEIInstructions({ 
  clabe, 
  amount, 
  reference 
}: SPEIInstructionsProps) {
  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h3 className="font-bold text-lg mb-4">
        Complete your investment via SPEI transfer
      </h3>
      
      <div className="space-y-3">
        <div className="bg-white p-4 rounded">
          <p className="text-sm text-gray-500">CLABE Account</p>
          <p className="font-mono font-bold text-lg">{clabe}</p>
          <button 
            onClick={() => navigator.clipboard.writeText(clabe)}
            className="text-blue-600 text-sm mt-1"
          >
            Copy CLABE
          </button>
        </div>

        <div className="bg-white p-4 rounded">
          <p className="text-sm text-gray-500">Amount to Transfer</p>
          <p className="font-bold text-lg">${amount.toFixed(2)} MXN</p>
        </div>

        <div className="bg-white p-4 rounded">
          <p className="text-sm text-gray-500">Reference</p>
          <p className="font-mono">{reference}</p>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>⏱️ Transfer must be completed within 24 hours</p>
        <p>📧 You'll receive confirmation once payment is received</p>
      </div>
    </div>
  );
}
```

### 5. OXXO Payment Voucher

```typescript
// src/components/payment/OXXOVoucher.tsx
interface OXXOVoucherProps {
  reference: string;
  amount: number;
  dueDate: string;
}

export default function OXXOVoucher({ 
  reference, 
  amount, 
  dueDate 
}: OXXOVoucherProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
      <div className="text-center mb-6">
        <img 
          src="/oxxo-logo.png" 
          alt="OXXO" 
          className="h-12 mx-auto mb-2"
        />
        <h2 className="text-xl font-bold">Payment Reference</h2>
      </div>

      <div className="space-y-4">
        <div className="text-center bg-gray-100 p-4 rounded">
          <p className="text-sm text-gray-500">Reference Number</p>
          <p className="font-mono text-2xl font-bold mt-1">{reference}</p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">Amount to Pay</p>
          <p className="text-3xl font-bold text-green-600">
            ${amount.toFixed(2)} MXN
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">Pay Before</p>
          <p className="font-medium">{new Date(dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-600">
        <p>📍 Present this reference at any OXXO store</p>
        <p>💵 Pay in cash only</p>
        <p>📧 Confirmation will be sent to your email</p>
      </div>

      <button
        onClick={handlePrint}
        className="w-full mt-6 bg-red-600 text-white py-2 rounded hover:bg-red-700"
      >
        Print Reference
      </button>
    </div>
  );
}
```

### 6. Testing Cards

For sandbox testing, use these test cards:

```typescript
const TEST_CARDS = {
  visa: {
    number: '4111111111111111',
    cvv: '123',
    expiry: '12/25',
    name: 'Test User'
  },
  mastercard: {
    number: '5555555555554444',
    cvv: '123',
    expiry: '12/25',
    name: 'Test User'
  },
  amex: {
    number: '345678901234564',
    cvv: '1234',
    expiry: '12/25',
    name: 'Test User'
  },
  declined: {
    number: '4000000000000002',
    cvv: '123',
    expiry: '12/25',
    name: 'Test User'
  }
};
```

### 7. Webhook Handler

```typescript
// src/app/api/webhooks/openpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-openpay-signature');
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.OPENPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'charge.succeeded':
        // Update investment status
        await handleChargeSucceeded(event.transaction);
        break;
        
      case 'charge.failed':
        // Handle failed payment
        await handleChargeFailed(event.transaction);
        break;
        
      case 'spei.received':
        // SPEI payment received
        await handleSPEIReceived(event.transaction);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('OpenPay webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

### 8. Production Checklist

- [ ] Set `OPENPAY_PRODUCTION="true"` in production
- [ ] Update public key for production environment
- [ ] Configure webhook URL in OpenPay dashboard
- [ ] Test all payment methods with real amounts (small)
- [ ] Implement proper error handling for all scenarios
- [ ] Set up monitoring for payment failures
- [ ] Configure email notifications for payment events

## 🔒 Security Notes

1. **Never expose private key** in frontend code
2. **Always use HTTPS** in production
3. **Implement rate limiting** on payment endpoints
4. **Log all payment attempts** for auditing
5. **Use device session ID** for fraud prevention
6. **Validate webhook signatures** to prevent tampering