// KYC Service for Spain, EU, and Mexico markets

interface KYCDocument {
  type: 'passport' | 'id_card' | 'driving_license' | 'curp' | 'ine';
  front: string; // base64 or file path
  back?: string; // for cards with back side
  selfie?: string; // selfie verification
}

interface AddressProof {
  type: 'utility_bill' | 'bank_statement' | 'rental_agreement';
  document: string; // base64 or file path
  issueDate: string;
}

interface KYCData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  email: string;
  phone: string;
  
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  
  // Documents
  identityDocument: KYCDocument;
  addressProof: AddressProof;
  
  // Investment Profile
  investmentExperience: 'none' | 'limited' | 'experienced' | 'professional';
  estimatedNetWorth: number;
  sourceOfFunds: string;
  
  // Compliance
  pep: boolean; // Politically Exposed Person
  sanctionsCheck: boolean;
  taxResident: string[]; // Countries where tax resident
}

interface KYCResult {
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  confidence: number;
  verificationId: string;
  reasons?: string[];
  nextSteps?: string[];
}

// Different KYC providers based on region
class DIDitVerifier {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.clientId = process.env.DIDIT_CLIENT_ID || 'cAZsSyfcdX3IUOZlChrsjQ';
    this.clientSecret = process.env.DIDIT_CLIENT_SECRET || 'DyBZga1hQhLI6MV2dhmq5fYsn25n4FP8JkmXN0-fOno';
    this.baseUrl = process.env.DIDIT_BASE_URL || 'https://api.didit.id';
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      // Get new OAuth2 token
      const tokenResponse = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'verification:create verification:read'
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
      
      return this.accessToken!;
    } catch (error) {
      console.error('DIDit token error:', error);
      throw new Error('Failed to authenticate with DIDit');
    }
  }

  async verifyIdentity(kycData: KYCData): Promise<KYCResult> {
    try {
      const token = await this.getAccessToken();

      // Step 1: Create verification session
      const sessionResponse = await fetch(`${this.baseUrl}/v1/verifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'identity_verification',
          user: {
            first_name: kycData.firstName,
            last_name: kycData.lastName,
            date_of_birth: kycData.dateOfBirth,
            email: kycData.email,
            phone: kycData.phone,
            nationality: kycData.nationality,
            address: {
              street: kycData.address.street,
              city: kycData.address.city,
              state: kycData.address.state,
              postal_code: kycData.address.postalCode,
              country: kycData.address.country,
            }
          },
          documents: {
            identity_document: {
              type: kycData.identityDocument.type,
              front_image: kycData.identityDocument.front,
              back_image: kycData.identityDocument.back,
            },
            proof_of_address: {
              type: kycData.addressProof.type,
              image: kycData.addressProof.document,
            },
            selfie: kycData.identityDocument.selfie,
          },
          checks: {
            document_verification: true,
            facial_recognition: true,
            address_verification: true,
            pep_screening: true,
            sanctions_screening: true,
            adverse_media: true,
          }
        }),
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        throw new Error(error.message || 'Failed to create verification session');
      }

      const session = await sessionResponse.json();

      // Step 2: Process verification (this might be async in production)
      const verificationId = session.id;
      
      // Poll for verification result (in production, use webhooks)
      const result = await this.pollVerificationResult(verificationId, token);

      return {
        status: this.mapStatus(result.status),
        confidence: result.confidence_score || 0,
        verificationId: verificationId,
        reasons: result.rejection_reasons || [],
        nextSteps: result.next_steps || [],
      };

    } catch (error) {
      console.error('DIDit verification error:', error);
      throw new Error('Identity verification failed');
    }
  }

  private async pollVerificationResult(verificationId: string, token: string): Promise<any> {
    const maxAttempts = 30;
    const delayMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.baseUrl}/v1/verifications/${verificationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get verification status');
      }

      const result = await response.json();

      if (result.status !== 'processing' && result.status !== 'pending') {
        return result;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Verification timeout');
  }

  private mapStatus(status: string): 'pending' | 'approved' | 'rejected' | 'requires_review' {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'requires_review'> = {
      'processing': 'pending',
      'verified': 'approved',
      'failed': 'rejected',
      'manual_review': 'requires_review',
    };
    return statusMap[status] || 'pending';
  }
}

// Spain/EU specific verification using eIDAS
class EIDASVerifier {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.EIDAS_API_KEY!;
    this.baseUrl = process.env.EIDAS_BASE_URL || 'https://api.eidas-verification.eu/v1';
  }

  async verifyEUIdentity(kycData: KYCData): Promise<KYCResult> {
    try {
      // Specific verification for EU/Spain documents
      const payload = {
        document_type: kycData.identityDocument.type,
        document_country: kycData.address.country,
        personal_data: {
          first_name: kycData.firstName,
          last_name: kycData.lastName,
          date_of_birth: kycData.dateOfBirth,
        },
        document_images: {
          front: kycData.identityDocument.front,
          back: kycData.identityDocument.back,
          selfie: kycData.identityDocument.selfie,
        },
        address_verification: {
          document: kycData.addressProof.document,
          type: kycData.addressProof.type,
        }
      };

      const response = await fetch(`${this.baseUrl}/verify-eu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      return {
        status: result.verification_status,
        confidence: result.confidence_score,
        verificationId: result.reference_id,
        reasons: result.rejection_reasons,
      };

    } catch (error) {
      console.error('eIDAS verification error:', error);
      throw new Error('EU identity verification failed');
    }
  }
}

// Mexico specific verification using CURP/INE
class MexicoVerifier {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MEXICO_KYC_API_KEY!;
    this.baseUrl = process.env.MEXICO_KYC_BASE_URL || 'https://api.verificacion-mexico.com/v1';
  }

  async verifyMexicanIdentity(kycData: KYCData): Promise<KYCResult> {
    try {
      const payload = {
        curp: this.extractCURP(kycData.identityDocument),
        ine_front: kycData.identityDocument.front,
        ine_back: kycData.identityDocument.back,
        selfie: kycData.identityDocument.selfie,
        personal_info: {
          nombre: kycData.firstName,
          apellidos: kycData.lastName,
          fecha_nacimiento: kycData.dateOfBirth,
        },
        domicilio: {
          calle: kycData.address.street,
          ciudad: kycData.address.city,
          estado: kycData.address.state,
          codigo_postal: kycData.address.postalCode,
        }
      };

      const response = await fetch(`${this.baseUrl}/verificar-identidad`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      return {
        status: this.mapStatus(result.estado),
        confidence: result.confianza,
        verificationId: result.id_verificacion,
        reasons: result.observaciones,
      };

    } catch (error) {
      console.error('Mexico verification error:', error);
      throw new Error('Mexican identity verification failed');
    }
  }

  private extractCURP(document: KYCDocument): string {
    // In real implementation, this would use OCR to extract CURP from INE
    // For now, return placeholder
    return 'EXTRACTED_CURP';
  }

  private mapStatus(estado: string): 'pending' | 'approved' | 'rejected' | 'requires_review' {
    const statusMap: Record<string, 'pending' | 'approved' | 'rejected' | 'requires_review'> = {
      'procesando': 'pending',
      'aprobado': 'approved',
      'rechazado': 'rejected',
      'revision_manual': 'requires_review',
    };
    return statusMap[estado] || 'pending';
  }
}

// Main KYC Service
export class KYCService {
  private didItVerifier: DIDitVerifier;
  private eidasVerifier: EIDASVerifier;
  private mexicoVerifier: MexicoVerifier;

  constructor() {
    this.didItVerifier = new DIDitVerifier();
    this.eidasVerifier = new EIDASVerifier();
    this.mexicoVerifier = new MexicoVerifier();
  }

  async performKYC(kycData: KYCData): Promise<KYCResult> {
    try {
      // Determine verification method based on country
      const country = kycData.address.country.toLowerCase();
      
      let result: KYCResult;

      if (country === 'mx' || country === 'mexico') {
        // Use Mexico-specific verification
        result = await this.mexicoVerifier.verifyMexicanIdentity(kycData);
      } else if (this.isEUCountry(country)) {
        // Use EU/eIDAS verification
        result = await this.eidasVerifier.verifyEUIdentity(kycData);
      } else {
        // Use general DIDit verification
        result = await this.didItVerifier.verifyIdentity(kycData);
      }

      // Additional compliance checks
      if (result.status === 'approved') {
        const complianceResult = await this.performComplianceChecks(kycData);
        if (!complianceResult.passed) {
          result.status = 'requires_review';
          result.reasons = [...(result.reasons || []), ...complianceResult.issues];
        }
      }

      return result;

    } catch (error) {
      console.error('KYC verification error:', error);
      return {
        status: 'rejected',
        confidence: 0,
        verificationId: 'ERROR',
        reasons: ['Verification system error'],
      };
    }
  }

  private isEUCountry(country: string): boolean {
    const euCountries = [
      'es', 'spain', 'fr', 'france', 'de', 'germany', 'it', 'italy',
      'pt', 'portugal', 'nl', 'netherlands', 'be', 'belgium', 'at', 'austria',
      'ie', 'ireland', 'fi', 'finland', 'se', 'sweden', 'dk', 'denmark',
      'pl', 'poland', 'cz', 'czech', 'hu', 'hungary', 'sk', 'slovakia',
      'si', 'slovenia', 'hr', 'croatia', 'bg', 'bulgaria', 'ro', 'romania',
      'ee', 'estonia', 'lv', 'latvia', 'lt', 'lithuania', 'lu', 'luxembourg',
      'mt', 'malta', 'cy', 'cyprus', 'gr', 'greece'
    ];
    return euCountries.includes(country);
  }

  private async performComplianceChecks(kycData: KYCData): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // PEP check
    if (kycData.pep) {
      issues.push('Politically Exposed Person requires additional review');
    }

    // Sanctions check
    if (!kycData.sanctionsCheck) {
      issues.push('Sanctions screening incomplete');
    }

    // Age verification (must be 18+)
    const birthDate = new Date(kycData.dateOfBirth);
    const age = (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      issues.push('Must be at least 18 years old to invest');
    }

    // Investment experience check for high-risk investments
    if (kycData.investmentExperience === 'none' && kycData.estimatedNetWorth < 10000) {
      issues.push('Limited investment experience requires additional suitability assessment');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  // Validate document quality before submission
  validateDocumentQuality(document: string): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Basic validation (in real implementation, use image analysis)
    if (!document || document.length < 1000) {
      issues.push('Document image quality too low');
    }

    // Check file size (should be reasonable)
    const sizeEstimate = (document.length * 3) / 4; // rough base64 to bytes
    if (sizeEstimate > 10 * 1024 * 1024) { // 10MB max
      issues.push('Document file size too large');
    }

    if (sizeEstimate < 50 * 1024) { // 50KB min
      issues.push('Document file size too small');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

export const kycService = new KYCService();