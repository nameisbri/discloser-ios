/**
 * Share Links Tests
 *
 * Comprehensive tests for the share link expiry and view limit logic.
 * These tests validate the core business logic without requiring a database connection.
 */

import type { ShareLink, StatusShareLink } from '../../lib/types';
import {
  getLinkExpirationStatus,
  isLinkExpired,
  getExpirationLabel,
  formatViewCount,
} from '../../lib/utils/shareLinkStatus';

// ============================================
// UTILITY FUNCTIONS (extracted from components)
// ============================================

/**
 * Generates a share URL for an individual test result
 */
function getShareUrl(token: string, baseUrl = 'https://discloser.app'): string {
  return `${baseUrl}/share/${token}`;
}

/**
 * Generates a share URL for aggregated status
 */
function getStatusShareUrl(token: string, baseUrl = 'https://discloser.app'): string {
  return `${baseUrl}/status/${token}`;
}

/**
 * Checks if a share link is expired
 */
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

/**
 * Checks if a share link is over its view limit
 */
function isOverViewLimit(viewCount: number, maxViews: number | null): boolean {
  return maxViews !== null && viewCount >= maxViews;
}

/**
 * Checks if a share link is active (not expired and not over limit)
 */
function isLinkActive(link: { expires_at: string; view_count: number; max_views: number | null }): boolean {
  return !isExpired(link.expires_at) && !isOverViewLimit(link.view_count, link.max_views);
}

/**
 * Filters active links from a list
 */
function filterActiveLinks<T extends { expires_at: string; view_count: number; max_views: number | null }>(
  links: T[]
): T[] {
  return links.filter(isLinkActive);
}

/**
 * Formats expiry time for display
 */
function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

/**
 * Calculates expiry date from hours
 */
function calculateExpiryDate(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Simulates the database get_shared_result RPC function logic
 */
function simulateGetSharedResult(link: ShareLink | null): {
  is_valid: boolean;
  is_expired: boolean;
  is_over_limit: boolean;
} {
  if (!link) {
    return { is_valid: false, is_expired: false, is_over_limit: false };
  }

  if (isExpired(link.expires_at)) {
    return { is_valid: false, is_expired: true, is_over_limit: false };
  }

  if (isOverViewLimit(link.view_count, link.max_views)) {
    return { is_valid: false, is_expired: false, is_over_limit: true };
  }

  return { is_valid: true, is_expired: false, is_over_limit: false };
}

// ============================================
// TEST DATA FACTORIES
// ============================================

function createMockShareLink(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    id: 'test-link-id',
    test_result_id: 'test-result-id',
    user_id: 'test-user-id',
    token: 'abc123def456',
    expires_at: calculateExpiryDate(24), // 24 hours from now
    view_count: 0,
    max_views: null,
    show_name: false,
    display_name: null,
    created_at: new Date().toISOString(),
    note: null,
    label: null,
    ...overrides,
  };
}

function createMockStatusShareLink(overrides: Partial<StatusShareLink> = {}): StatusShareLink {
  return {
    id: 'test-status-link-id',
    user_id: 'test-user-id',
    token: 'status123token',
    label: null,
    expires_at: calculateExpiryDate(24),
    view_count: 0,
    max_views: null,
    show_name: false,
    display_name: null,
    status_snapshot: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================
// TESTS
// ============================================

describe('Share URL Generation', () => {
  test('generates correct share URL with default base', () => {
    const url = getShareUrl('abc123');
    expect(url).toBe('https://discloser.app/share/abc123');
  });

  test('generates correct share URL with custom base', () => {
    const url = getShareUrl('abc123', 'https://custom.domain');
    expect(url).toBe('https://custom.domain/share/abc123');
  });

  test('generates correct status share URL', () => {
    const url = getStatusShareUrl('status456');
    expect(url).toBe('https://discloser.app/status/status456');
  });

  test('handles tokens with special characters', () => {
    const url = getShareUrl('token-with-dashes_and_underscores');
    expect(url).toBe('https://discloser.app/share/token-with-dashes_and_underscores');
  });
});

describe('Expiry Validation', () => {
  test('link with future expiry is not expired', () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    expect(isExpired(futureDate)).toBe(false);
  });

  test('link with past expiry is expired', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    expect(isExpired(pastDate)).toBe(true);
  });

  test('link expiring exactly now is expired', () => {
    const now = new Date().toISOString();
    expect(isExpired(now)).toBe(true);
  });

  test('link expiring in 1 second is not expired', () => {
    const almostNow = new Date(Date.now() + 1000).toISOString();
    expect(isExpired(almostNow)).toBe(false);
  });

  test('link that expired 1 second ago is expired', () => {
    const justPast = new Date(Date.now() - 1000).toISOString();
    expect(isExpired(justPast)).toBe(true);
  });
});

describe('View Limit Validation', () => {
  test('null max_views means unlimited (never over limit)', () => {
    expect(isOverViewLimit(0, null)).toBe(false);
    expect(isOverViewLimit(100, null)).toBe(false);
    expect(isOverViewLimit(1000000, null)).toBe(false);
  });

  test('view_count < max_views is not over limit', () => {
    expect(isOverViewLimit(0, 5)).toBe(false);
    expect(isOverViewLimit(4, 5)).toBe(false);
  });

  test('view_count === max_views is over limit', () => {
    expect(isOverViewLimit(5, 5)).toBe(true);
    expect(isOverViewLimit(1, 1)).toBe(true);
  });

  test('view_count > max_views is over limit', () => {
    expect(isOverViewLimit(6, 5)).toBe(true);
    expect(isOverViewLimit(10, 5)).toBe(true);
  });

  test('boundary: max_views of 1 with 0 views is not over limit', () => {
    expect(isOverViewLimit(0, 1)).toBe(false);
  });

  test('boundary: max_views of 1 with 1 view is over limit', () => {
    expect(isOverViewLimit(1, 1)).toBe(true);
  });
});

describe('Link Active Status', () => {
  test('fresh link with no views is active', () => {
    const link = createMockShareLink();
    expect(isLinkActive(link)).toBe(true);
  });

  test('expired link is not active', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 3600000).toISOString(),
    });
    expect(isLinkActive(link)).toBe(false);
  });

  test('link at max views is not active', () => {
    const link = createMockShareLink({
      view_count: 5,
      max_views: 5,
    });
    expect(isLinkActive(link)).toBe(false);
  });

  test('link with unlimited views and valid expiry is active', () => {
    const link = createMockShareLink({
      view_count: 1000,
      max_views: null,
    });
    expect(isLinkActive(link)).toBe(true);
  });

  test('expired link with remaining views is not active', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 3600000).toISOString(),
      view_count: 0,
      max_views: 10,
    });
    expect(isLinkActive(link)).toBe(false);
  });

  test('valid link with views approaching limit is active', () => {
    const link = createMockShareLink({
      view_count: 4,
      max_views: 5,
    });
    expect(isLinkActive(link)).toBe(true);
  });
});

describe('Filter Active Links', () => {
  test('filters out expired links', () => {
    const links = [
      createMockShareLink({ id: '1', expires_at: calculateExpiryDate(24) }),
      createMockShareLink({ id: '2', expires_at: new Date(Date.now() - 3600000).toISOString() }),
      createMockShareLink({ id: '3', expires_at: calculateExpiryDate(48) }),
    ];

    const active = filterActiveLinks(links);
    expect(active).toHaveLength(2);
    expect(active.map(l => l.id)).toEqual(['1', '3']);
  });

  test('filters out over-limit links', () => {
    const links = [
      createMockShareLink({ id: '1', view_count: 0, max_views: 5 }),
      createMockShareLink({ id: '2', view_count: 5, max_views: 5 }),
      createMockShareLink({ id: '3', view_count: 3, max_views: 5 }),
    ];

    const active = filterActiveLinks(links);
    expect(active).toHaveLength(2);
    expect(active.map(l => l.id)).toEqual(['1', '3']);
  });

  test('returns empty array when all links are inactive', () => {
    const links = [
      createMockShareLink({ expires_at: new Date(Date.now() - 3600000).toISOString() }),
      createMockShareLink({ view_count: 10, max_views: 5 }),
    ];

    const active = filterActiveLinks(links);
    expect(active).toHaveLength(0);
  });

  test('returns all links when none are expired or over limit', () => {
    const links = [
      createMockShareLink({ id: '1' }),
      createMockShareLink({ id: '2' }),
      createMockShareLink({ id: '3' }),
    ];

    const active = filterActiveLinks(links);
    expect(active).toHaveLength(3);
  });

  test('handles empty array', () => {
    const active = filterActiveLinks([]);
    expect(active).toHaveLength(0);
  });

  test('works with status share links', () => {
    const links = [
      createMockStatusShareLink({ id: '1' }),
      createMockStatusShareLink({ id: '2', expires_at: new Date(Date.now() - 1000).toISOString() }),
    ];

    const active = filterActiveLinks(links);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('1');
  });
});

describe('Format Expiry Display', () => {
  test('shows "Expired" for past dates', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    expect(formatExpiry(pastDate)).toBe('Expired');
  });

  test('shows hours for < 24 hours', () => {
    const in12Hours = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const result = formatExpiry(in12Hours);
    expect(result).toMatch(/^\d+h left$/);
    expect(parseInt(result)).toBeLessThanOrEqual(12);
  });

  test('shows days for >= 24 hours', () => {
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatExpiry(in3Days);
    expect(result).toMatch(/^\d+d left$/);
  });

  test('shows 0h for about to expire', () => {
    const in30Mins = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = formatExpiry(in30Mins);
    expect(result).toBe('0h left');
  });
});

describe('Calculate Expiry Date', () => {
  test('calculates 1 hour expiry', () => {
    const before = Date.now();
    const expiry = calculateExpiryDate(1);
    const after = Date.now();

    const expiryTime = new Date(expiry).getTime();
    expect(expiryTime).toBeGreaterThanOrEqual(before + 3600000 - 100);
    expect(expiryTime).toBeLessThanOrEqual(after + 3600000 + 100);
  });

  test('calculates 24 hour expiry', () => {
    const expiry = calculateExpiryDate(24);
    const diff = new Date(expiry).getTime() - Date.now();
    expect(Math.abs(diff - 24 * 60 * 60 * 1000)).toBeLessThan(1000);
  });

  test('calculates 7 day (168 hour) expiry', () => {
    const expiry = calculateExpiryDate(168);
    const diff = new Date(expiry).getTime() - Date.now();
    expect(Math.abs(diff - 7 * 24 * 60 * 60 * 1000)).toBeLessThan(1000);
  });

  test('calculates 30 day (720 hour) expiry', () => {
    const expiry = calculateExpiryDate(720);
    const diff = new Date(expiry).getTime() - Date.now();
    expect(Math.abs(diff - 30 * 24 * 60 * 60 * 1000)).toBeLessThan(1000);
  });
});

describe('Simulate Database RPC (get_shared_result logic)', () => {
  test('returns invalid for null link', () => {
    const result = simulateGetSharedResult(null);
    expect(result.is_valid).toBe(false);
    expect(result.is_expired).toBe(false);
    expect(result.is_over_limit).toBe(false);
  });

  test('returns valid for fresh link', () => {
    const link = createMockShareLink();
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(true);
    expect(result.is_expired).toBe(false);
    expect(result.is_over_limit).toBe(false);
  });

  test('returns expired for past expiry', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(false);
    expect(result.is_expired).toBe(true);
    expect(result.is_over_limit).toBe(false);
  });

  test('returns over_limit when at max views', () => {
    const link = createMockShareLink({
      view_count: 5,
      max_views: 5,
    });
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(false);
    expect(result.is_expired).toBe(false);
    expect(result.is_over_limit).toBe(true);
  });

  test('expired takes precedence over view limit', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 1000).toISOString(),
      view_count: 10,
      max_views: 5,
    });
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(false);
    expect(result.is_expired).toBe(true);
    expect(result.is_over_limit).toBe(false);
  });

  test('unlimited views with valid expiry is valid', () => {
    const link = createMockShareLink({
      view_count: 999,
      max_views: null,
    });
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(true);
  });

  test('one view remaining is valid', () => {
    const link = createMockShareLink({
      view_count: 4,
      max_views: 5,
    });
    const result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(true);
  });
});

describe('Expiry Options Constants', () => {
  const EXPIRY_OPTIONS = [
    { label: '1 hour', hours: 1 },
    { label: '24 hours', hours: 24 },
    { label: '7 days', hours: 168 },
    { label: '30 days', hours: 720 },
  ];

  test('all expiry options generate valid future dates', () => {
    for (const option of EXPIRY_OPTIONS) {
      const expiry = calculateExpiryDate(option.hours);
      expect(isExpired(expiry)).toBe(false);
    }
  });

  test('expiry hours calculations are correct', () => {
    expect(EXPIRY_OPTIONS[2].hours).toBe(7 * 24); // 7 days
    expect(EXPIRY_OPTIONS[3].hours).toBe(30 * 24); // 30 days
  });
});

describe('View Limit Options Constants', () => {
  const VIEW_LIMIT_OPTIONS = [
    { label: 'Unlimited', value: null },
    { label: '1 view', value: 1 },
    { label: '5 views', value: 5 },
    { label: '10 views', value: 10 },
  ];

  test('unlimited option has null value', () => {
    expect(VIEW_LIMIT_OPTIONS[0].value).toBeNull();
  });

  test('view limit options are correctly ordered', () => {
    const numericValues = VIEW_LIMIT_OPTIONS.slice(1).map(o => o.value);
    for (let i = 1; i < numericValues.length; i++) {
      expect(numericValues[i]).toBeGreaterThan(numericValues[i - 1] as number);
    }
  });
});

describe('Edge Cases', () => {
  test('handles very long token strings', () => {
    const longToken = 'a'.repeat(1000);
    const url = getShareUrl(longToken);
    expect(url).toContain(longToken);
  });

  test('handles empty token string', () => {
    const url = getShareUrl('');
    expect(url).toBe('https://discloser.app/share/');
  });

  test('handles view count of 0 with max_views of 0', () => {
    expect(isOverViewLimit(0, 0)).toBe(true);
  });

  test('handles negative view counts gracefully', () => {
    expect(isOverViewLimit(-1, 5)).toBe(false);
  });

  test('handles very large view counts', () => {
    expect(isOverViewLimit(Number.MAX_SAFE_INTEGER, null)).toBe(false);
    expect(isOverViewLimit(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  test('handles far future expiry dates', () => {
    const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(isExpired(farFuture)).toBe(false);
  });

  test('handles epoch date (1970)', () => {
    const epoch = new Date(0).toISOString();
    expect(isExpired(epoch)).toBe(true);
  });
});

describe('Integration: Complete Share Link Lifecycle', () => {
  test('simulates creating and using a 1-view link', () => {
    // Create link with 1 view limit
    const link = createMockShareLink({
      max_views: 1,
      view_count: 0,
    });

    // First access - should be valid
    let result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(true);

    // Simulate view count increment
    link.view_count = 1;

    // Second access - should be over limit
    result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(false);
    expect(result.is_over_limit).toBe(true);
  });

  test('simulates link expiring during use', () => {
    // Create link that expires in the "past" to simulate expiry
    const link = createMockShareLink({
      expires_at: new Date(Date.now() + 100).toISOString(), // expires very soon
    });

    // Access should be valid initially
    let result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(true);

    // Simulate time passing by setting past expiry
    link.expires_at = new Date(Date.now() - 1000).toISOString();

    // Access should now be expired
    result = simulateGetSharedResult(link);
    expect(result.is_valid).toBe(false);
    expect(result.is_expired).toBe(true);
  });

  test('simulates multiple links with different states', () => {
    const links = [
      createMockShareLink({ id: 'active-unlimited' }),
      createMockShareLink({ id: 'active-limited', max_views: 5, view_count: 2 }),
      createMockShareLink({ id: 'at-limit', max_views: 3, view_count: 3 }),
      createMockShareLink({ id: 'expired', expires_at: new Date(Date.now() - 1000).toISOString() }),
      createMockShareLink({ id: 'active-1-view', max_views: 1, view_count: 0 }),
    ];

    const active = filterActiveLinks(links);
    expect(active.map(l => l.id)).toEqual([
      'active-unlimited',
      'active-limited',
      'active-1-view'
    ]);
  });
});

// ============================================
// SHARED UTILITY TESTS (shareLinkStatus.ts)
// ============================================

describe('getLinkExpirationStatus', () => {
  test('returns "active" for fresh link with future expiry and no view limit', () => {
    const link = createMockShareLink();
    expect(getLinkExpirationStatus(link)).toBe('active');
  });

  test('returns "active" for link with views below limit', () => {
    const link = createMockShareLink({ view_count: 3, max_views: 5 });
    expect(getLinkExpirationStatus(link)).toBe('active');
  });

  test('returns "active" for link with unlimited views', () => {
    const link = createMockShareLink({ view_count: 999, max_views: null });
    expect(getLinkExpirationStatus(link)).toBe('active');
  });

  test('returns "time_expired" for link with past expires_at', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 3600000).toISOString(),
    });
    expect(getLinkExpirationStatus(link)).toBe('time_expired');
  });

  test('returns "time_expired" for link expiring exactly now', () => {
    const link = createMockShareLink({
      expires_at: new Date().toISOString(),
    });
    expect(getLinkExpirationStatus(link)).toBe('time_expired');
  });

  test('returns "views_exhausted" for link at max views', () => {
    const link = createMockShareLink({ view_count: 5, max_views: 5 });
    expect(getLinkExpirationStatus(link)).toBe('views_exhausted');
  });

  test('returns "views_exhausted" for link over max views', () => {
    const link = createMockShareLink({ view_count: 10, max_views: 5 });
    expect(getLinkExpirationStatus(link)).toBe('views_exhausted');
  });

  test('time_expired takes precedence over views_exhausted', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 1000).toISOString(),
      view_count: 10,
      max_views: 5,
    });
    expect(getLinkExpirationStatus(link)).toBe('time_expired');
  });

  test('works with StatusShareLink', () => {
    const link = createMockStatusShareLink({
      expires_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(getLinkExpirationStatus(link)).toBe('time_expired');
  });

  test('null max_views never triggers views_exhausted', () => {
    const link = createMockShareLink({ view_count: Number.MAX_SAFE_INTEGER, max_views: null });
    expect(getLinkExpirationStatus(link)).toBe('active');
  });
});

describe('isLinkExpired', () => {
  test('returns false for active link', () => {
    const link = createMockShareLink();
    expect(isLinkExpired(link)).toBe(false);
  });

  test('returns true for time-expired link', () => {
    const link = createMockShareLink({
      expires_at: new Date(Date.now() - 3600000).toISOString(),
    });
    expect(isLinkExpired(link)).toBe(true);
  });

  test('returns true for views-exhausted link', () => {
    const link = createMockShareLink({ view_count: 1, max_views: 1 });
    expect(isLinkExpired(link)).toBe(true);
  });
});

describe('getExpirationLabel', () => {
  test('returns "Expired" for time_expired', () => {
    expect(getExpirationLabel('time_expired')).toBe('Expired');
  });

  test('returns "Max views reached" for views_exhausted', () => {
    expect(getExpirationLabel('views_exhausted')).toBe('Max views reached');
  });

  test('returns empty string for active', () => {
    expect(getExpirationLabel('active')).toBe('');
  });
});

describe('formatViewCount', () => {
  test('formats with max views', () => {
    expect(formatViewCount(1, 1)).toBe('Viewed 1/1 time');
    expect(formatViewCount(3, 5)).toBe('Viewed 3/5 times');
    expect(formatViewCount(0, 10)).toBe('Viewed 0/10 times');
  });

  test('formats without max views (unlimited)', () => {
    expect(formatViewCount(0, null)).toBe('Viewed 0 times');
    expect(formatViewCount(1, null)).toBe('Viewed 1 time');
    expect(formatViewCount(5, null)).toBe('Viewed 5 times');
  });
});
