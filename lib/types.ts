// Database types for Discloser

export type TestStatus = "negative" | "positive" | "pending" | "inconclusive";

export type ReminderFrequency = "monthly" | "quarterly" | "biannual" | "annual";

export interface Profile {
  id: string;
  display_name: string | null;
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
  max_views?: number;
  show_name?: boolean;
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
}

// Supabase Database type helper
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      test_results: {
        Row: TestResult;
        Insert: CreateTestResultInput & { user_id: string };
        Update: UpdateTestResultInput;
      };
      share_links: {
        Row: ShareLink;
        Insert: CreateShareLinkInput & { user_id: string };
        Update: never;
      };
      reminders: {
        Row: Reminder;
        Insert: CreateReminderInput & { user_id: string };
        Update: UpdateReminderInput;
      };
    };
    Functions: {
      get_shared_result: {
        Args: { share_token: string };
        Returns: SharedResult[];
      };
      increment_share_view: {
        Args: { share_token: string };
        Returns: void;
      };
    };
  };
}
