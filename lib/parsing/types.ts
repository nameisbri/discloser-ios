// Types for document parsing

export interface ParsedTest {
  name: string;
  result: string;
  status: 'negative' | 'positive' | 'pending' | 'inconclusive';
  notes?: string;
}

export interface ParsedDocument {
  collectionDate: string | null;
  testType: string;
  tests: ParsedTest[];
  notes?: string;
  rawText?: string;
  isVerified: boolean;
  verificationDetails?: {
    labName?: string;
    patientName?: string;
    hasHealthCard: boolean;
    hasAccessionNumber: boolean;
    nameMatched: boolean;
  };
  verificationResult?: VerificationResult;
  contentHash?: string;
  contentSimhash?: string;
}

export interface UserProfileForVerification {
  first_name: string | null;
  last_name: string | null;
}

export type VerificationLevel = 'high' | 'moderate' | 'low' | 'unverified' | 'no_signals';

export interface VerificationCheck {
  name: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  details?: string;
}

export interface VerificationResult {
  score: number;
  level: VerificationLevel;
  checks: VerificationCheck[];
  isVerified: boolean;
  /** True when the collection date is in the future (hard block — cannot save). */
  hasFutureDate: boolean;
  /** True when the collection date is suspiciously close to upload time (<2 hours). */
  isSuspiciouslyFast: boolean;
  /** True when the collection date is more than 2 years old. */
  isOlderThan2Years: boolean;
}

export interface LLMResponse {
  collection_date: string | null;
  specimen_source?: string;
  test_type?: string;
  tests: Array<{
    name: string;
    result: string;
    notes?: string;
  }>;
  notes?: string;
  // Verification fields
  lab_name?: string;
  patient_name?: string;
  health_card_present?: boolean;
  accession_number?: string;
}
