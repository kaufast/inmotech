# Payment Integration Guide

## 🏦 Lemonway Integration (EU/Spain)

Based on the official Lemonway API documentation, here's how to integrate payments for European users.

### Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Lemonway Configuration
LEMONWAY_AUTHORIZATION="your-lemonway-authorization-token"
LEMONWAY_SANDBOX="true"  # Set to "false" for production

# Base URL for redirects
NEXT_PUBLIC_BASE_URL="http://localhost:3000"  # Change for production
```

### Card Payment Flow

```typescript
// Example usage in your investment component
const handleInvestment = async (amount: number, projectId: string) => {
  try {
    const response = await fetch('/api/investments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        projectId,
        amount,
        paymentMethod: 'card',
        paymentDetails: {
          customerEmail: user.email,
          customerName: `${user.firstName} ${user.lastName}`,
        }
      })
    });

    const result = await response.json();

    if (result.paymentTransaction && result.investment.status === 'CONFIRMED') {
      // Payment requires user action (3D Secure, etc.)
      if (result.requiresAction && result.actionUrl) {
        // Redirect user to Lemonway payment page
        window.location.href = result.actionUrl;
      } else {
        // Payment completed immediately
        toast.success('Investment confirmed!');
        router.push('/dashboard/investments');
      }
    }
  } catch (error) {
    toast.error('Investment failed: ' + error.message);
  }
};
```

### Payment Redirect URLs

Create these pages in your Next.js app:

#### `/src/app/payment/success/page.tsx`
```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract payment details from URL params
    const transactionId = searchParams.get('transactionId');
    const investmentId = searchParams.get('investmentId');
    
    if (transactionId) {
      // Verify payment status with your backend
      verifyPayment(transactionId, investmentId);
    }
  }, []);

  const verifyPayment = async (transactionId: string, investmentId: string) => {
    try {
      const response = await fetch(`/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, investmentId })
      });
      
      if (response.ok) {
        setTimeout(() => router.push('/dashboard/investments'), 3000);
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful! 🎉
        </h1>
        <p className="text-gray-600 mb-4">
          Your investment has been confirmed and funds are secured in escrow.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to your investments...
        </p>
      </div>
    </div>
  );
}
```

#### `/src/app/payment/error/page.tsx`
```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentError() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Payment failed';

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Payment Failed ❌
        </h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
```

## 💳 OpenPay Integration (Mexico)

For Mexican users, payments are processed through OpenPay:

### Environment Variables

```bash
# OpenPay Configuration (Mexico)
OPENPAY_API_KEY="your-openpay-api-key"
OPENPAY_MERCHANT_ID="your-merchant-id"
OPENPAY_SANDBOX="true"  # Set to "false" for production
```

### Supported Payment Methods

1. **Credit/Debit Cards** - Visa, MasterCard, American Express
2. **SPEI Bank Transfers** - Mexican interbank transfers
3. **OXXO Cash Payments** - Pay at OXXO convenience stores

### Example Payment Flow

```typescript
const mexicanPaymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'spei', name: 'Bank Transfer (SPEI)', icon: '🏦' },
  { id: 'oxxo', name: 'Pay at OXXO', icon: '🏪' }
];

const handleMexicanPayment = async (method: string) => {
  const response = await fetch('/api/investments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      projectId,
      amount,
      paymentMethod: method,
      paymentDetails: {
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`,
        currency: 'MXN'
      }
    })
  });
  
  // Handle response similar to Lemonway
};
```

## 🔄 Payment Webhooks

Set up webhook endpoints to handle payment status updates:

### `/src/app/api/webhooks/lemonway/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Verify webhook signature (implement based on Lemonway docs)
    
    // Update investment status based on webhook data
    if (payload.status === 'completed') {
      await prisma.investment.update({
        where: { paymentTransactionId: payload.transactionId },
        data: { 
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Lemonway webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

## 🧪 Testing

### Lemonway Sandbox
- Use test cards provided in Lemonway documentation
- Test 3D Secure flows with specific test cards
- Verify webhook delivery in sandbox environment

### OpenPay Sandbox
- Use OpenPay test cards for Mexico
- Test SPEI transfers with test bank accounts
- Verify OXXO payment reference generation

## 🚀 Production Checklist

- [ ] Set up production Lemonway account
- [ ] Configure OpenPay production credentials
- [ ] Set up webhook endpoints with proper SSL
- [ ] Test with real payment amounts (small values)
- [ ] Implement proper error handling and logging
- [ ] Set up monitoring for failed payments
- [ ] Configure currency conversion if needed

## 📊 Payment Analytics

Track these metrics for your crowdfunding platform:
- Payment success rates by method and region
- Average transaction amounts
- Time to payment completion
- Failed payment reasons
- Chargeback rates

## 🔐 Security Best Practices

1. **Never store card details** - Use payment processor tokens
2. **Validate all amounts** server-side
3. **Log all payment attempts** for auditing
4. **Use HTTPS** for all payment-related requests
5. **Implement rate limiting** on payment endpoints
6. **Verify webhook signatures** to prevent fraud