// Types for document parsing

export interface ParsedTest {
  name: string;
  result: string;
  status: 'negative' | 'positive' | 'pending';
  notes?: string;
}

export interface ParsedDocument {
  collectionDate: string | null;
  testType: string;
  tests: ParsedTest[];
  rawText?: string;
}

export interface LLMResponse {
  collection_date: string | null;
  specimen_source?: string;
  tests: Array<{
    name: string;
    result: string;
    notes?: string;
  }>;
}
