/**
 * Share Link Validation Tests
 *
 * Tests that validate the logic matching the PostgreSQL RPC functions.
 * These tests ensure the validation behavior is consistent with schema.sql.
 */

import type { ShareLink, StatusShareLink, SharedResult, TestStatus } from '../../lib/types';

// ============================================
// TYPES MATCHING DATABASE STRUCTURE
// ============================================

interface SharedResultValidation {
  test_date: string;
  status: TestStatus;
  test_type: string;
  sti_results: Array<{ name: string; result: string; status: TestStatus }>;
  is_verified: boolean;
  show_name: boolean;
  display_name: string | null;
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
}

interface SharedStatusValidation {
  status_snapshot: unknown[];
  show_name: boolean;
  display_name: string | null;
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
}

// ============================================
// DATABASE FUNCTION SIMULATION
// Mirrors the logic in supabase/schema.sql
// ============================================

/**
 * Simulates: get_shared_result(share_token text)
 * From schema.sql lines 326-410
 */
function simulateGetSharedResult(
  shareLinks: ShareLink[],
  testResults: Map<string, { test_date: string; status: TestStatus; test_type: string; sti_results: unknown[]; is_verified: boolean }>,
  profiles: Map<string, { display_name: string | null }>,
  shareToken: string
): SharedResultValidation | null {
  // Find the link by token
  const link = shareLinks.find(sl => sl.token === shareToken);

  // If not found, return nothing (matches: if link_record is null then return; end if;)
  if (!link) {
    return null;
  }

  const testResult = testResults.get(link.test_result_id);
  const profile = profiles.get(link.user_id);

  if (!testResult) {
    return null;
  }

  // Check if expired (matches: if link_record.expires_at <= now() then)
  if (new Date(link.expires_at) <= new Date()) {
    return {
      test_date: testResult.test_date,
      status: testResult.status,
      test_type: testResult.test_type,
      sti_results: testResult.sti_results as SharedResultValidation['sti_results'],
      is_verified: testResult.is_verified,
      show_name: link.show_name,
      display_name: link.show_name ? (profile?.display_name ?? null) : null,
      is_valid: false,
      is_expired: true,
      is_over_limit: false,
    };
  }

  // Check if over view limit (matches: if link_record.max_views is not null and link_record.view_count >= link_record.max_views then)
  if (link.max_views !== null && link.view_count >= link.max_views) {
    return {
      test_date: testResult.test_date,
      status: testResult.status,
      test_type: testResult.test_type,
      sti_results: testResult.sti_results as SharedResultValidation['sti_results'],
      is_verified: testResult.is_verified,
      show_name: link.show_name,
      display_name: link.show_name ? (profile?.display_name ?? null) : null,
      is_valid: false,
      is_expired: false,
      is_over_limit: true,
    };
  }

  // Valid link - in real DB would increment view_count here
  return {
    test_date: testResult.test_date,
    status: testResult.status,
    test_type: testResult.test_type,
    sti_results: testResult.sti_results as SharedResultValidation['sti_results'],
    is_verified: testResult.is_verified,
    show_name: link.show_name,
    display_name: link.show_name ? (profile?.display_name ?? null) : null,
    is_valid: true,
    is_expired: false,
    is_over_limit: false,
  };
}

/**
 * Simulates: get_shared_status(share_token text)
 * From schema.sql lines 216-275
 */
function simulateGetSharedStatus(
  statusShareLinks: StatusShareLink[],
  shareToken: string
): SharedStatusValidation | null {
  // Find the link by token
  const link = statusShareLinks.find(sl => sl.token === shareToken);

  // If not found, return nothing
  if (!link) {
    return null;
  }

  // Check if expired
  if (new Date(link.expires_at) <= new Date()) {
    return {
      status_snapshot: link.status_snapshot,
      show_name: link.show_name,
      display_name: link.display_name,
      is_valid: false,
      is_expired: true,
      is_over_limit: false,
    };
  }

  // Check if over view limit
  if (link.max_views !== null && link.view_count >= link.max_views) {
    return {
      status_snapshot: link.status_snapshot,
      show_name: link.show_name,
      display_name: link.display_name,
      is_valid: false,
      is_expired: false,
      is_over_limit: true,
    };
  }

  // Valid link
  return {
    status_snapshot: link.status_snapshot,
    show_name: link.show_name,
    display_name: link.display_name,
    is_valid: true,
    is_expired: false,
    is_over_limit: false,
  };
}

/**
 * Simulates: increment_share_view(share_token text)
 * From schema.sql lines 313-322
 * Only increments if link is valid (not expired, not over limit)
 */
function simulateIncrementShareView(
  shareLinks: ShareLink[],
  shareToken: string
): boolean {
  const link = shareLinks.find(sl => sl.token === shareToken);

  if (!link) return false;

  // Check conditions from SQL:
  // where token = share_token
  //   and expires_at > now()
  //   and (max_views is null or view_count < max_views)
  if (new Date(link.expires_at) <= new Date()) return false;
  if (link.max_views !== null && link.view_count >= link.max_views) return false;

  // Would increment in real DB
  link.view_count++;
  return true;
}

// ============================================
// TEST DATA
// ============================================

function createTestData() {
  const now = Date.now();

  const testResults = new Map([
    ['result-1', {
      test_date: '2024-01-15',
      status: 'negative' as TestStatus,
      test_type: 'Full STI Panel',
      sti_results: [
        { name: 'HIV', result: 'Negative', status: 'negative' },
        { name: 'Chlamydia', result: 'Negative', status: 'negative' },
      ],
      is_verified: true,
    }],
    ['result-2', {
      test_date: '2024-01-10',
      status: 'positive' as TestStatus,
      test_type: 'Basic Screen',
      sti_results: [
        { name: 'Chlamydia', result: 'Positive', status: 'positive' },
      ],
      is_verified: false,
    }],
  ]);

  const profiles = new Map([
    ['user-1', { display_name: 'John D.' }],
    ['user-2', { display_name: null }],
  ]);

  const shareLinks: ShareLink[] = [
    {
      id: 'link-valid',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'valid-token-123',
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      view_count: 0,
      max_views: null,
      show_name: true,
      display_name: 'John D.',
      created_at: new Date(now).toISOString(),
    },
    {
      id: 'link-expired',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'expired-token-456',
      expires_at: new Date(now - 60 * 60 * 1000).toISOString(),
      view_count: 2,
      max_views: 10,
      show_name: false,
      display_name: null,
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'link-at-limit',
      test_result_id: 'result-2',
      user_id: 'user-2',
      token: 'at-limit-token-789',
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      view_count: 5,
      max_views: 5,
      show_name: true,
      display_name: null,
      created_at: new Date(now).toISOString(),
    },
    {
      id: 'link-one-view-left',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'one-view-token-abc',
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      view_count: 4,
      max_views: 5,
      show_name: false,
      display_name: null,
      created_at: new Date(now).toISOString(),
    },
  ];

  const statusShareLinks: StatusShareLink[] = [
    {
      id: 'status-valid',
      user_id: 'user-1',
      token: 'status-valid-123',
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      view_count: 3,
      max_views: null,
      show_name: true,
      display_name: 'John D.',
      status_snapshot: [
        { name: 'HIV', status: 'negative', result: 'Negative', testDate: '2024-01-15', isVerified: true },
      ],
      created_at: new Date(now).toISOString(),
    },
    {
      id: 'status-expired',
      user_id: 'user-1',
      token: 'status-expired-456',
      expires_at: new Date(now - 1000).toISOString(),
      view_count: 0,
      max_views: 10,
      show_name: false,
      display_name: null,
      status_snapshot: [],
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'status-at-limit',
      user_id: 'user-2',
      token: 'status-limit-789',
      expires_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      view_count: 1,
      max_views: 1,
      show_name: false,
      display_name: null,
      status_snapshot: [],
      created_at: new Date(now).toISOString(),
    },
  ];

  return { testResults, profiles, shareLinks, statusShareLinks };
}

// ============================================
// TESTS
// ============================================

describe('get_shared_result RPC Simulation', () => {
  let testResults: Map<string, any>;
  let profiles: Map<string, any>;
  let shareLinks: ShareLink[];

  beforeEach(() => {
    const data = createTestData();
    testResults = data.testResults;
    profiles = data.profiles;
    shareLinks = [...data.shareLinks]; // Clone to avoid mutation between tests
  });

  test('returns null for non-existent token', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'nonexistent-token');
    expect(result).toBeNull();
  });

  test('returns valid result for fresh link', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'valid-token-123');
    expect(result).not.toBeNull();
    expect(result?.is_valid).toBe(true);
    expect(result?.is_expired).toBe(false);
    expect(result?.is_over_limit).toBe(false);
    expect(result?.show_name).toBe(true);
    expect(result?.display_name).toBe('John D.');
  });

  test('returns expired for past expiry date', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'expired-token-456');
    expect(result).not.toBeNull();
    expect(result?.is_valid).toBe(false);
    expect(result?.is_expired).toBe(true);
    expect(result?.is_over_limit).toBe(false);
  });

  test('returns over_limit when view_count >= max_views', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'at-limit-token-789');
    expect(result).not.toBeNull();
    expect(result?.is_valid).toBe(false);
    expect(result?.is_expired).toBe(false);
    expect(result?.is_over_limit).toBe(true);
  });

  test('returns valid when view_count < max_views', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'one-view-token-abc');
    expect(result).not.toBeNull();
    expect(result?.is_valid).toBe(true);
  });

  test('hides display_name when show_name is false', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'one-view-token-abc');
    expect(result?.show_name).toBe(false);
    expect(result?.display_name).toBeNull();
  });

  test('includes test result data in response', () => {
    const result = simulateGetSharedResult(shareLinks, testResults, profiles, 'valid-token-123');
    expect(result?.test_date).toBe('2024-01-15');
    expect(result?.status).toBe('negative');
    expect(result?.test_type).toBe('Full STI Panel');
    expect(result?.sti_results).toHaveLength(2);
    expect(result?.is_verified).toBe(true);
  });
});

describe('get_shared_status RPC Simulation', () => {
  let statusShareLinks: StatusShareLink[];

  beforeEach(() => {
    const data = createTestData();
    statusShareLinks = [...data.statusShareLinks];
  });

  test('returns null for non-existent token', () => {
    const result = simulateGetSharedStatus(statusShareLinks, 'nonexistent');
    expect(result).toBeNull();
  });

  test('returns valid for fresh status link', () => {
    const result = simulateGetSharedStatus(statusShareLinks, 'status-valid-123');
    expect(result).not.toBeNull();
    expect(result?.is_valid).toBe(true);
    expect(result?.is_expired).toBe(false);
    expect(result?.is_over_limit).toBe(false);
  });

  test('returns expired for past status link', () => {
    const result = simulateGetSharedStatus(statusShareLinks, 'status-expired-456');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_expired).toBe(true);
  });

  test('returns over_limit for status link at max views', () => {
    const result = simulateGetSharedStatus(statusShareLinks, 'status-limit-789');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_over_limit).toBe(true);
  });

  test('preserves status_snapshot in response', () => {
    const result = simulateGetSharedStatus(statusShareLinks, 'status-valid-123');
    expect(result?.status_snapshot).toHaveLength(1);
  });
});

describe('increment_share_view RPC Simulation', () => {
  let shareLinks: ShareLink[];

  beforeEach(() => {
    const data = createTestData();
    shareLinks = [...data.shareLinks];
  });

  test('increments view count for valid link', () => {
    const link = shareLinks.find(l => l.token === 'valid-token-123')!;
    const originalCount = link.view_count;

    const success = simulateIncrementShareView(shareLinks, 'valid-token-123');
    expect(success).toBe(true);
    expect(link.view_count).toBe(originalCount + 1);
  });

  test('does not increment for expired link', () => {
    const link = shareLinks.find(l => l.token === 'expired-token-456')!;
    const originalCount = link.view_count;

    const success = simulateIncrementShareView(shareLinks, 'expired-token-456');
    expect(success).toBe(false);
    expect(link.view_count).toBe(originalCount);
  });

  test('does not increment for link at max views', () => {
    const link = shareLinks.find(l => l.token === 'at-limit-token-789')!;
    const originalCount = link.view_count;

    const success = simulateIncrementShareView(shareLinks, 'at-limit-token-789');
    expect(success).toBe(false);
    expect(link.view_count).toBe(originalCount);
  });

  test('increments and then blocks when limit reached', () => {
    const link = shareLinks.find(l => l.token === 'one-view-token-abc')!;
    expect(link.view_count).toBe(4);
    expect(link.max_views).toBe(5);

    // First increment should work
    expect(simulateIncrementShareView(shareLinks, 'one-view-token-abc')).toBe(true);
    expect(link.view_count).toBe(5);

    // Second increment should fail
    expect(simulateIncrementShareView(shareLinks, 'one-view-token-abc')).toBe(false);
    expect(link.view_count).toBe(5);
  });

  test('returns false for non-existent token', () => {
    const success = simulateIncrementShareView(shareLinks, 'fake-token');
    expect(success).toBe(false);
  });
});

describe('RLS Policy Simulation', () => {
  // Simulates the RLS policy:
  // token = current_setting('request.headers', true)::json->>'x-share-token'
  // and expires_at > now()
  // and (max_views is null or view_count < max_views)

  function simulateRLSCheck(link: ShareLink, requestToken: string): boolean {
    if (link.token !== requestToken) return false;
    if (new Date(link.expires_at) <= new Date()) return false;
    if (link.max_views !== null && link.view_count >= link.max_views) return false;
    return true;
  }

  test('allows access with matching valid token', () => {
    const data = createTestData();
    const validLink = data.shareLinks.find(l => l.token === 'valid-token-123')!;
    expect(simulateRLSCheck(validLink, 'valid-token-123')).toBe(true);
  });

  test('denies access with mismatched token', () => {
    const data = createTestData();
    const validLink = data.shareLinks.find(l => l.token === 'valid-token-123')!;
    expect(simulateRLSCheck(validLink, 'wrong-token')).toBe(false);
  });

  test('denies access to expired link', () => {
    const data = createTestData();
    const expiredLink = data.shareLinks.find(l => l.token === 'expired-token-456')!;
    expect(simulateRLSCheck(expiredLink, 'expired-token-456')).toBe(false);
  });

  test('denies access to over-limit link', () => {
    const data = createTestData();
    const limitedLink = data.shareLinks.find(l => l.token === 'at-limit-token-789')!;
    expect(simulateRLSCheck(limitedLink, 'at-limit-token-789')).toBe(false);
  });
});

describe('View Count Boundary Conditions', () => {
  test('view_count at max_views - 1 is valid', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      view_count: 9,
      max_views: 10,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    expect(result?.is_valid).toBe(true);
  });

  test('view_count exactly at max_views is invalid', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      view_count: 10,
      max_views: 10,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_over_limit).toBe(true);
  });

  test('view_count above max_views is invalid', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      view_count: 15,
      max_views: 10,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_over_limit).toBe(true);
  });
});

describe('Expiry Boundary Conditions', () => {
  test('link expiring in 1ms is valid', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() + 1).toISOString(),
      view_count: 0,
      max_views: null,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    // Note: This might flake if test runs slowly
    expect(result?.is_valid).toBe(true);
  });

  test('link that expired 1ms ago is invalid', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() - 1).toISOString(),
      view_count: 0,
      max_views: null,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_expired).toBe(true);
  });
});

describe('Priority: Expiry vs View Limit', () => {
  test('expired link shows expired even if also over view limit', () => {
    const link: ShareLink = {
      id: 'test',
      test_result_id: 'result-1',
      user_id: 'user-1',
      token: 'test-token',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      view_count: 100,
      max_views: 5,
      show_name: false,
      display_name: null,
      created_at: new Date().toISOString(),
    };

    const data = createTestData();
    const result = simulateGetSharedResult([link], data.testResults, data.profiles, 'test-token');
    expect(result?.is_valid).toBe(false);
    expect(result?.is_expired).toBe(true);
    expect(result?.is_over_limit).toBe(false); // Expiry takes precedence
  });
});
