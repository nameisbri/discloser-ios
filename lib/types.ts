// Database types for Discloser

export type TestStatus = "negative" | "positive" | "pending" | "inconclusive";

export type ReminderFrequency = "monthly" | "quarterly" | "biannual" | "annual";

export type RiskLevel = "low" | "moderate" | "high";

// Known conditions (chronic STIs) - must match normalized names from testNormalizer
export const STATUS_STIS = ["HIV-1/2", "Herpes (HSV-1)", "Herpes (HSV-2)", "Hepatitis B", "Hepatitis C"] as const;
export type StatusSTI = (typeof STATUS_STIS)[number];

export interface KnownCondition {
  condition: string;
  added_at: string;
  notes?: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  alias: string | null;
  date_of_birth: string | null;
  pronouns: string | null;
  display_name: string | null;
  risk_level: RiskLevel | null;
  risk_assessed_at: string | null;
  known_conditions: KnownCondition[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface STIResult {
  name: string;
  result: string;
  status: TestStatus;
}

export interface TestResult {
  id: string;
  user_id: string;
  test_date: string;
  status: TestStatus;
  test_type: string;
  sti_results: STIResult[];
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  test_result_id: string;
  user_id: string;
  token: string;
  expires_at: string;
  view_count: number;
  max_views: number | null;
  show_name: boolean;
  display_name: string | null;
  created_at: string;
}

export interface StatusShareLink {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  view_count: number;
  max_views: number | null;
  show_name: boolean;
  display_name: string | null;
  status_snapshot: unknown[];
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  frequency: ReminderFrequency;
  next_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Input types for creating/updating records
export interface CreateTestResultInput {
  test_date: string;
  status?: TestStatus;
  test_type?: string;
  sti_results?: STIResult[];
  file_url?: string;
  file_name?: string;
  notes?: string;
  is_verified?: boolean;
}

export interface UpdateTestResultInput {
  test_date?: string;
  status?: TestStatus;
  test_type?: string;
  sti_results?: STIResult[];
  file_url?: string;
  file_name?: string;
  notes?: string;
  is_verified?: boolean;
}

export interface CreateShareLinkInput {
  test_result_id: string;
  expires_at: string;
  max_views?: number | null;
  show_name?: boolean;
  display_name?: string | null;
}

export interface CreateReminderInput {
  title: string;
  frequency: ReminderFrequency;
  next_date: string;
  is_active?: boolean;
}

export interface UpdateReminderInput {
  title?: string;
  frequency?: ReminderFrequency;
  next_date?: string;
  is_active?: boolean;
}

// Shared result response (from get_shared_result function)
export interface SharedResult {
  test_date: string;
  status: TestStatus;
  test_type: string;
  sti_results: STIResult[];
  is_verified: boolean;
  show_name: boolean;
  display_name: string | null;
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      test_results: {
        Row: TestResult;
        Insert: CreateTestResultInput & { user_id: string };
        Update: UpdateTestResultInput;
        Relationships: [];
      };
      share_links: {
        Row: ShareLink;
        Insert: CreateShareLinkInput & { user_id: string };
        Update: Partial<CreateShareLinkInput>;
        Relationships: [];
      };
      status_share_links: {
        Row: StatusShareLink;
        Insert: Omit<StatusShareLink, "id" | "created_at">;
        Update: Partial<Omit<StatusShareLink, "id" | "created_at">>;
        Relationships: [];
      };
      reminders: {
        Row: Reminder;
        Insert: CreateReminderInput & { user_id: string };
        Update: UpdateReminderInput;
        Relationships: [];
      };
      waitlist: {
        Row: { id: string; email: string; source: string | null; created_at: string };
        Insert: { email: string; source?: string | null };
        Update: { email?: string; source?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_shared_result: {
        Args: { share_token: string };
        Returns: SharedResult[];
      };
      increment_share_view: {
        Args: { share_token: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
