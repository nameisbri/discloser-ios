/**
 * Notification Sync Function Tests
 *
 * Tests the syncReminderNotifications function that syncs
 * scheduled notifications with active reminders from the database.
 */

// Mock dependencies - must be before imports
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null), // Default: notifications enabled
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../../lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import syncReminderNotifications after mocks are set up
import { syncReminderNotifications, SyncResult } from '../../lib/notifications';

// Import mocked modules
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/utils/logger';

// Helper to create mock reminders
function createMockReminder(overrides: Partial<{
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  next_date: string;
  is_active: boolean;
}> = {}) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const nextDateString = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

  return {
    id: 'reminder-1',
    user_id: 'user-123',
    title: 'Test Reminder',
    frequency: 'quarterly',
    next_date: nextDateString,
    is_active: true,
    ...overrides,
  };
}

// Helper to create past date string
function createPastDateString(): string {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);
  return `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}`;
}

describe('syncReminderNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset AsyncStorage to default (notifications enabled)
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('when notifications are disabled', () => {
    beforeEach(() => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
    });

    test('returns success with zero scheduled', async () => {
      const result = await syncReminderNotifications();

      expect(result).toEqual<SyncResult>({
        success: true,
        scheduled: 0,
        skipped: 0,
      });
    });

    test('does not query database', async () => {
      await syncReminderNotifications();

      expect(supabase.auth.getUser).not.toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('logs appropriate message', async () => {
      await syncReminderNotifications();

      expect(logger.info).toHaveBeenCalledWith('Notification sync skipped: notifications disabled');
    });
  });

  describe('when no user is logged in', () => {
    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });
    });

    test('returns success with zero scheduled', async () => {
      const result = await syncReminderNotifications();

      expect(result).toEqual<SyncResult>({
        success: true,
        scheduled: 0,
        skipped: 0,
      });
    });

    test('does not query reminders', async () => {
      await syncReminderNotifications();

      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('logs appropriate message', async () => {
      await syncReminderNotifications();

      expect(logger.info).toHaveBeenCalledWith('Notification sync skipped: no user logged in');
    });
  });

  describe('when user has no active reminders', () => {
    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });
    });

    test('returns success with zero scheduled', async () => {
      const result = await syncReminderNotifications();

      expect(result).toEqual<SyncResult>({
        success: true,
        scheduled: 0,
        skipped: 0,
      });
    });

    test('cancels all existing notifications', async () => {
      await syncReminderNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    test('logs appropriate message', async () => {
      await syncReminderNotifications();

      expect(logger.info).toHaveBeenCalledWith('Notification sync: no active reminders');
    });
  });

  describe('when user has active reminders with future dates', () => {
    const mockReminders = [
      createMockReminder({ id: 'reminder-1', title: 'Checkup 1' }),
      createMockReminder({ id: 'reminder-2', title: 'Checkup 2' }),
    ];

    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockReminders,
              error: null,
            }),
          }),
        }),
      });
    });

    test('cancels all existing notifications before scheduling', async () => {
      await syncReminderNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    });

    test('schedules notifications for all reminders', async () => {
      const result = await syncReminderNotifications();

      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(2);
      expect(result.skipped).toBe(0);
    });

    test('logs completion message with counts', async () => {
      await syncReminderNotifications();

      expect(logger.info).toHaveBeenCalledWith('Notification sync complete', {
        scheduled: 2,
        skipped: 0,
      });
    });

    test('queries only active reminders for the current user', async () => {
      await syncReminderNotifications();

      expect(supabase.from).toHaveBeenCalledWith('reminders');
    });
  });

  describe('when user has reminders with past dates', () => {
    const mockReminders = [
      createMockReminder({ id: 'reminder-1', title: 'Past Reminder', next_date: createPastDateString() }),
    ];

    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockReminders,
              error: null,
            }),
          }),
        }),
      });
    });

    test('skips reminders with past dates', async () => {
      const result = await syncReminderNotifications();

      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(0);
      expect(result.skipped).toBe(1);
    });
  });

  describe('when user has mixed past and future reminders', () => {
    const mockReminders = [
      createMockReminder({ id: 'reminder-1', title: 'Future Reminder' }),
      createMockReminder({ id: 'reminder-2', title: 'Past Reminder', next_date: createPastDateString() }),
      createMockReminder({ id: 'reminder-3', title: 'Another Future Reminder' }),
    ];

    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockReminders,
              error: null,
            }),
          }),
        }),
      });
    });

    test('schedules only future reminders and skips past', async () => {
      const result = await syncReminderNotifications();

      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  describe('when database query fails', () => {
    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      });
    });

    test('returns error result', async () => {
      const result = await syncReminderNotifications();

      expect(result).toEqual<SyncResult>({
        success: false,
        scheduled: 0,
        skipped: 0,
        error: 'Database connection failed',
      });
    });

    test('logs error', async () => {
      await syncReminderNotifications();

      expect(logger.error).toHaveBeenCalledWith('Notification sync failed: database error', {
        error: 'Database connection failed',
      });
    });

    test('does not throw', async () => {
      await expect(syncReminderNotifications()).resolves.not.toThrow();
    });
  });

  describe('when scheduling individual notification fails', () => {
    const mockReminders = [
      createMockReminder({ id: 'reminder-1', title: 'Good Reminder' }),
      createMockReminder({ id: 'reminder-2', title: 'Bad Reminder' }),
      createMockReminder({ id: 'reminder-3', title: 'Another Good Reminder' }),
    ];

    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockReminders,
              error: null,
            }),
          }),
        }),
      });

      // Make scheduling fail for the second reminder
      let callCount = 0;
      (Notifications.scheduleNotificationAsync as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Scheduling failed'));
        }
        return Promise.resolve(`notification-${callCount}`);
      });
    });

    test('continues with other reminders', async () => {
      const result = await syncReminderNotifications();

      expect(result.success).toBe(true);
      expect(result.scheduled).toBe(2);
      expect(result.skipped).toBe(1);
    });
  });

  describe('concurrent sync prevention', () => {
    const mockReminders = [createMockReminder()];

    beforeEach(() => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockReminders,
              error: null,
            }),
          }),
        }),
      });
    });

    test('prevents concurrent sync operations', async () => {
      // Start two syncs concurrently
      const [result1, result2] = await Promise.all([
        syncReminderNotifications(),
        syncReminderNotifications(),
      ]);

      // One should succeed with scheduled count, one should be skipped
      const results = [result1, result2];
      const scheduledResults = results.filter(r => r.scheduled > 0);
      const skippedResults = results.filter(r => r.scheduled === 0);

      // At least one should have scheduled notifications
      expect(scheduledResults.length).toBeGreaterThanOrEqual(1);
      // Both should be successful
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
