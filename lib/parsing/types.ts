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
}

export interface UserProfileForVerification {
  first_name: string | null;
  last_name: string | null;
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
