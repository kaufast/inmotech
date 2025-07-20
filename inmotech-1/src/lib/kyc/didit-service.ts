/**
 * Didit KYC Integration Service
 * Handles identity verification and compliance checks
 */

export interface DidItConfig {
  apiKey: string;
  apiSecret: string;
  environment: 'sandbox' | 'production';
  webhookSecret: string;
}

export interface KYCSessionRequest {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userPhone?: string;
  userDateOfBirth?: string;
  userNationality?: string;
  verificationType: 'basic' | 'enhanced' | 'corporate';
  documentTypes: string[];
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, any>;
}

export interface KYCSessionResponse {
  sessionId: string;
  verificationUrl: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  expiresAt: Date;
}

export interface KYCWebhookPayload {
  sessionId: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'rejected';
  verificationType: string;
  verificationData: {
    identity: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      nationality: string;
      documentType: string;
      documentNumber: string;
      documentExpiryDate?: string;
    };
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    riskScore: number;
    amlChecks: {
      sanctionsList: boolean;
      pepList: boolean;
      adverseMedia: boolean;
    };
    documentVerification: {
      authentic: boolean;
      readability: boolean;
      validity: boolean;
    };
    biometricVerification?: {
      faceMatch: boolean;
      livenessCheck: boolean;
    };
  };
  rejectionReason?: string;
  completedAt?: string;
  rawResponse: any;
}

// ==================== DIDIT SERVICE CLASS ====================

export class DidItKYCService {
  private config: DidItConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      apiKey: process.env.DIDIT_API_KEY!,
      apiSecret: process.env.DIDIT_API_SECRET!,
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'sandbox' | 'production',
      webhookSecret: process.env.DIDIT_WEBHOOK_SECRET!
    };

    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.didit.me/v1'
      : 'https://sandbox-api.didit.me/v1';
  }

  // ==================== SESSION MANAGEMENT ====================

  async createVerificationSession(request: KYCSessionRequest): Promise<KYCSessionResponse> {
    try {
      const payload = {
        user_id: request.userId,
        user_email: request.userEmail,
        user_first_name: request.userFirstName,
        user_last_name: request.userLastName,
        user_phone: request.userPhone,
        user_date_of_birth: request.userDateOfBirth,
        user_nationality: request.userNationality,
        verification_type: request.verificationType,
        document_types: request.documentTypes,
        redirect_url: request.redirectUrl,
        webhook_url: request.webhookUrl,
        metadata: request.metadata || {},
        settings: {
          collect_address: true,
          perform_aml_checks: true,
          enable_biometric_verification: request.verificationType === 'enhanced',
          document_verification_level: request.verificationType === 'basic' ? 'standard' : 'enhanced'
        }
      };

      const response = await this.makeRequest('POST', '/verification/sessions', payload);

      return {
        sessionId: response.session_id,
        verificationUrl: response.verification_url,
        status: 'pending',
        expiresAt: new Date(response.expires_at)
      };

    } catch (error) {
      console.error('Failed to create Didit verification session:', error);
      throw new Error('Failed to create KYC verification session');
    }
  }

  async getVerificationSession(sessionId: string): Promise<KYCWebhookPayload | null> {
    try {
      const response = await this.makeRequest('GET', `/verification/sessions/${sessionId}`);
      
      return this.mapDiditResponseToWebhookPayload(response);

    } catch (error) {
      console.error('Failed to get Didit verification session:', error);
      return null;
    }
  }

  async cancelVerificationSession(sessionId: string): Promise<boolean> {
    try {
      await this.makeRequest('POST', `/verification/sessions/${sessionId}/cancel`);
      return true;

    } catch (error) {
      console.error('Failed to cancel Didit verification session:', error);
      return false;
    }
  }

  // ==================== WEBHOOK PROCESSING ====================

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
      
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  }

  processWebhookPayload(payload: any): KYCWebhookPayload {
    return this.mapDiditResponseToWebhookPayload(payload);
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  async uploadDocument(sessionId: string, documentType: string, file: File): Promise<{success: boolean, documentId?: string}> {
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/verification/sessions/${sessionId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Secret': this.config.apiSecret
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        documentId: result.document_id
      };

    } catch (error) {
      console.error('Failed to upload document to Didit:', error);
      return { success: false };
    }
  }

  async getDocumentStatus(sessionId: string, documentId: string): Promise<{
    status: 'pending' | 'processing' | 'verified' | 'rejected';
    verificationResults?: any;
  } | null> {
    try {
      const response = await this.makeRequest('GET', `/verification/sessions/${sessionId}/documents/${documentId}`);
      
      return {
        status: response.status,
        verificationResults: response.verification_results
      };

    } catch (error) {
      console.error('Failed to get document status from Didit:', error);
      return null;
    }
  }

  // ==================== AML & COMPLIANCE ====================

  async performAMLCheck(userId: string, personalData: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
  }): Promise<{
    riskScore: number;
    sanctionsList: boolean;
    pepList: boolean;
    adverseMedia: boolean;
    details: any;
  }> {
    try {
      const payload = {
        user_id: userId,
        first_name: personalData.firstName,
        last_name: personalData.lastName,
        date_of_birth: personalData.dateOfBirth,
        nationality: personalData.nationality
      };

      const response = await this.makeRequest('POST', '/compliance/aml-check', payload);

      return {
        riskScore: response.risk_score,
        sanctionsList: response.sanctions_match,
        pepList: response.pep_match,
        adverseMedia: response.adverse_media_match,
        details: response
      };

    } catch (error) {
      console.error('Failed to perform AML check:', error);
      throw new Error('AML check failed');
    }
  }

  // ==================== UTILITY METHODS ====================

  private async makeRequest(method: string, endpoint: string, payload?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-API-Secret': this.config.apiSecret,
      'Content-Type': 'application/json',
      'User-Agent': 'InmoTech-RealEstate/1.0'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Didit API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Didit API error: ${response.status}`);
    }

    return response.json();
  }

  private mapDiditResponseToWebhookPayload(response: any): KYCWebhookPayload {
    return {
      sessionId: response.session_id,
      userId: response.user_id,
      status: this.mapDiditStatus(response.status),
      verificationType: response.verification_type,
      verificationData: {
        identity: {
          firstName: response.identity?.first_name || '',
          lastName: response.identity?.last_name || '',
          dateOfBirth: response.identity?.date_of_birth || '',
          nationality: response.identity?.nationality || '',
          documentType: response.identity?.document_type || '',
          documentNumber: response.identity?.document_number || '',
          documentExpiryDate: response.identity?.document_expiry_date
        },
        address: response.address ? {
          street: response.address.street,
          city: response.address.city,
          postalCode: response.address.postal_code,
          country: response.address.country
        } : undefined,
        riskScore: response.risk_assessment?.risk_score || 0,
        amlChecks: {
          sanctionsList: response.aml_checks?.sanctions_match || false,
          pepList: response.aml_checks?.pep_match || false,
          adverseMedia: response.aml_checks?.adverse_media_match || false
        },
        documentVerification: {
          authentic: response.document_verification?.authentic || false,
          readability: response.document_verification?.readable || false,
          validity: response.document_verification?.valid || false
        },
        biometricVerification: response.biometric_verification ? {
          faceMatch: response.biometric_verification.face_match,
          livenessCheck: response.biometric_verification.liveness_check
        } : undefined
      },
      rejectionReason: response.rejection_reason,
      completedAt: response.completed_at,
      rawResponse: response
    };
  }

  private mapDiditStatus(diditStatus: string): 'pending' | 'in_progress' | 'completed' | 'failed' | 'rejected' {
    switch (diditStatus?.toLowerCase()) {
      case 'pending':
      case 'created':
        return 'pending';
      case 'in_progress':
      case 'processing':
      case 'documents_uploaded':
        return 'in_progress';
      case 'completed':
      case 'verified':
      case 'approved':
        return 'completed';
      case 'rejected':
      case 'declined':
        return 'rejected';
      case 'failed':
      case 'error':
      case 'expired':
      default:
        return 'failed';
    }
  }

  // ==================== MOCK IMPLEMENTATION ====================

  async createMockSession(request: KYCSessionRequest): Promise<KYCSessionResponse> {
    // Mock implementation for development/testing
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      sessionId,
      verificationUrl: `${process.env.FRONTEND_URL}/kyc/mock?session=${sessionId}`,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  createMockWebhookPayload(sessionId: string, userId: string, status: 'completed' | 'rejected' = 'completed'): KYCWebhookPayload {
    return {
      sessionId,
      userId,
      status,
      verificationType: 'enhanced',
      verificationData: {
        identity: {
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          nationality: 'ES',
          documentType: 'passport',
          documentNumber: 'P123456789',
          documentExpiryDate: '2030-01-01'
        },
        address: {
          street: 'Calle Example 123',
          city: 'Madrid',
          postalCode: '28001',
          country: 'ES'
        },
        riskScore: status === 'completed' ? 10 : 85,
        amlChecks: {
          sanctionsList: false,
          pepList: false,
          adverseMedia: false
        },
        documentVerification: {
          authentic: status === 'completed',
          readability: true,
          validity: status === 'completed'
        },
        biometricVerification: {
          faceMatch: status === 'completed',
          livenessCheck: status === 'completed'
        }
      },
      rejectionReason: status === 'rejected' ? 'Document verification failed' : undefined,
      completedAt: new Date().toISOString(),
      rawResponse: {}
    };
  }
}

// ==================== SINGLETON INSTANCE ====================

export const diditKYCService = new DidItKYCService();