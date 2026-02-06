import { trackResourceTap, getEventLog, clearEventLog } from "../../../lib/utils/analytics";

// Mock the logger to prevent console output in tests
jest.mock("../../../lib/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Analytics Utility", () => {
  beforeEach(() => {
    clearEventLog();
  });

  describe("trackResourceTap", () => {
    it("should record an event with resource_id, category, region, and timestamp", () => {
      trackResourceTap("catie", "learn-more", "national");

      const log = getEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].resource_id).toBe("catie");
      expect(log[0].category).toBe("learn-more");
      expect(log[0].region).toBe("national");
      expect(log[0].timestamp).toBeTruthy();
    });

    it("should produce a valid ISO timestamp", () => {
      trackResourceTap("catie", "learn-more", "national");

      const log = getEventLog();
      const parsed = new Date(log[0].timestamp);
      expect(parsed.getTime()).not.toBeNaN();
    });

    it("should accumulate multiple events", () => {
      trackResourceTap("catie", "learn-more", "national");
      trackResourceTap("hasslefreeclinic", "find-testing", "ON");
      trackResourceTap("sexual-health-infoline", "get-support", "ON");

      expect(getEventLog()).toHaveLength(3);
    });

    it("should not contain PII", () => {
      trackResourceTap("catie", "learn-more", "national");

      const log = getEventLog();
      const serialized = JSON.stringify(log[0]);
      const keys = Object.keys(log[0]);
      expect(keys).toEqual(["resource_id", "category", "region", "timestamp"]);
      expect(serialized).not.toContain("user");
      expect(serialized).not.toContain("email");
      expect(serialized).not.toContain("name");
    });

    it("should track region for national resources", () => {
      trackResourceTap("maple", "find-testing", "national");

      const log = getEventLog();
      expect(log[0].region).toBe("national");
    });

    it("should track region for provincial resources", () => {
      trackResourceTap("getcheckedonline", "find-testing", "ON");

      const log = getEventLog();
      expect(log[0].region).toBe("ON");
    });
  });

  describe("clearEventLog", () => {
    it("should clear all events", () => {
      trackResourceTap("catie", "learn-more", "national");
      trackResourceTap("hasslefreeclinic", "find-testing", "ON");
      expect(getEventLog()).toHaveLength(2);

      clearEventLog();
      expect(getEventLog()).toHaveLength(0);
    });
  });

  describe("getEventLog", () => {
    it("should return a copy, not the original array", () => {
      trackResourceTap("catie", "learn-more", "national");

      const log1 = getEventLog();
      const log2 = getEventLog();
      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });
  });
});
