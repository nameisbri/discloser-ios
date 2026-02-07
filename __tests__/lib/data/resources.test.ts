import {
  resources,
  RESOURCE_CATEGORIES,
  RESOURCE_REGIONS,
  getResourcesByCategory,
  getResourcesByCategoryAndRegion,
} from "../../../lib/data/resources";
import type { ResourceCategory } from "../../../lib/types";

describe("Resources Data", () => {
  describe("Data integrity", () => {
    it("should have resources for every category", () => {
      for (const cat of RESOURCE_CATEGORIES) {
        const items = resources.filter((r) => r.category === cat.key);
        expect(items.length).toBeGreaterThan(0);
      }
    });

    it("should have unique IDs across all resources", () => {
      const ids = resources.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required fields on every resource", () => {
      for (const resource of resources) {
        expect(resource.id).toBeTruthy();
        expect(resource.title).toBeTruthy();
        expect(resource.description).toBeTruthy();
        expect(resource.category).toBeTruthy();
        expect(resource.region).toBeTruthy();
        expect(typeof resource.priority).toBe("number");
      }
    });

    it("should have a url or phone for every resource", () => {
      for (const resource of resources) {
        const hasContact = resource.url !== null || resource.phone !== null;
        expect(hasContact).toBe(true);
      }
    });

    it("should have valid URL format for resources with urls", () => {
      const urlResources = resources.filter((r) => r.url !== null);
      for (const resource of urlResources) {
        expect(resource.url).toMatch(/^https?:\/\//);
      }
    });

    it("should have valid phone format for resources with phones", () => {
      const phoneResources = resources.filter((r) => r.phone !== null);
      for (const resource of phoneResources) {
        expect(resource.phone).toMatch(/^[\d\s\-+()]+$/);
      }
    });

    it("should only use known region values", () => {
      const validRegions = RESOURCE_REGIONS.map((r) => r.key);
      for (const resource of resources) {
        expect(validRegions).toContain(resource.region);
      }
    });

    it("should have 16 total resources", () => {
      expect(resources).toHaveLength(16);
    });
  });

  describe("RESOURCE_CATEGORIES", () => {
    it("should have three categories", () => {
      expect(RESOURCE_CATEGORIES).toHaveLength(3);
    });

    it("should include find-testing, learn-more, get-support", () => {
      const keys = RESOURCE_CATEGORIES.map((c) => c.key);
      expect(keys).toContain("find-testing");
      expect(keys).toContain("learn-more");
      expect(keys).toContain("get-support");
    });

    it("should have labels for every category", () => {
      for (const cat of RESOURCE_CATEGORIES) {
        expect(cat.label).toBeTruthy();
      }
    });
  });

  describe("RESOURCE_REGIONS", () => {
    it("should have two regions", () => {
      expect(RESOURCE_REGIONS).toHaveLength(2);
    });

    it("should include national and ON", () => {
      const keys = RESOURCE_REGIONS.map((r) => r.key);
      expect(keys).toContain("national");
      expect(keys).toContain("ON");
    });

    it("should list national before ON", () => {
      expect(RESOURCE_REGIONS[0].key).toBe("national");
      expect(RESOURCE_REGIONS[1].key).toBe("ON");
    });

    it("should have labels for every region", () => {
      for (const region of RESOURCE_REGIONS) {
        expect(region.label).toBeTruthy();
      }
    });
  });

  describe("getResourcesByCategory", () => {
    it("should return only resources of the specified category", () => {
      const testing = getResourcesByCategory("find-testing");
      for (const resource of testing) {
        expect(resource.category).toBe("find-testing");
      }
    });

    it("should return resources sorted by priority", () => {
      const categories: ResourceCategory[] = ["find-testing", "learn-more", "get-support"];
      for (const cat of categories) {
        const items = getResourcesByCategory(cat);
        for (let i = 1; i < items.length; i++) {
          expect(items[i].priority).toBeGreaterThanOrEqual(items[i - 1].priority);
        }
      }
    });

    it("should return 6 find-testing resources (3 national + 3 ON)", () => {
      expect(getResourcesByCategory("find-testing")).toHaveLength(6);
    });

    it("should return 6 learn-more resources (5 national + 1 ON)", () => {
      expect(getResourcesByCategory("learn-more")).toHaveLength(6);
    });

    it("should return 4 get-support resources (3 national + 1 ON)", () => {
      expect(getResourcesByCategory("get-support")).toHaveLength(4);
    });
  });

  describe("getResourcesByCategoryAndRegion", () => {
    it("should return only resources matching both category and region", () => {
      const items = getResourcesByCategoryAndRegion("find-testing", "national");
      for (const resource of items) {
        expect(resource.category).toBe("find-testing");
        expect(resource.region).toBe("national");
      }
    });

    it("should return resources sorted by priority", () => {
      const items = getResourcesByCategoryAndRegion("learn-more", "national");
      for (let i = 1; i < items.length; i++) {
        expect(items[i].priority).toBeGreaterThanOrEqual(items[i - 1].priority);
      }
    });

    it("should return 3 national find-testing resources", () => {
      expect(getResourcesByCategoryAndRegion("find-testing", "national")).toHaveLength(3);
    });

    it("should return 3 ON find-testing resources", () => {
      expect(getResourcesByCategoryAndRegion("find-testing", "ON")).toHaveLength(3);
    });

    it("should return 5 national learn-more resources", () => {
      expect(getResourcesByCategoryAndRegion("learn-more", "national")).toHaveLength(5);
    });

    it("should return 1 ON learn-more resource", () => {
      expect(getResourcesByCategoryAndRegion("learn-more", "ON")).toHaveLength(1);
    });

    it("should return 3 national get-support resources", () => {
      expect(getResourcesByCategoryAndRegion("get-support", "national")).toHaveLength(3);
    });

    it("should return 1 ON get-support resource", () => {
      expect(getResourcesByCategoryAndRegion("get-support", "ON")).toHaveLength(1);
    });

    it("should return empty array for non-existent region", () => {
      expect(getResourcesByCategoryAndRegion("find-testing", "BC")).toHaveLength(0);
    });
  });

  describe("CATIE consolidation", () => {
    it("should have CATIE as a national learn-more resource", () => {
      const catie = resources.find((r) => r.id === "catie");
      expect(catie).toBeDefined();
      expect(catie!.region).toBe("national");
      expect(catie!.category).toBe("learn-more");
    });

    it("should have CATIE Find a Service as a national find-testing resource", () => {
      const catieFindService = resources.find((r) => r.id === "catie-find-service");
      expect(catieFindService).toBeDefined();
      expect(catieFindService!.region).toBe("national");
      expect(catieFindService!.category).toBe("find-testing");
    });

    it("should not have duplicate CATIE entries in Ontario", () => {
      const ontarioCatie = resources.filter(
        (r) => r.region === "ON" && r.id.startsWith("catie"),
      );
      expect(ontarioCatie).toHaveLength(0);
    });
  });
});
