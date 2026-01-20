import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Upstash Redis
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => mockRedis),
}));

describe("Redis Cache Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to get fresh imports
    vi.resetModules();
  });

  describe("CACHE_KEYS", () => {
    it("should have all required cache key prefixes", async () => {
      const { CACHE_KEYS } = await import("@/lib/redis");

      expect(CACHE_KEYS).toHaveProperty("PERSON");
      expect(CACHE_KEYS).toHaveProperty("COMPANY");
      expect(CACHE_KEYS).toHaveProperty("PHONE");
      expect(CACHE_KEYS.PERSON).toContain("person");
      expect(CACHE_KEYS.COMPANY).toContain("company");
      expect(CACHE_KEYS.PHONE).toContain("phone");
    });
  });

  describe("CACHE_TTL", () => {
    it("should have appropriate TTL values", async () => {
      const { CACHE_TTL } = await import("@/lib/redis");

      // Person cache: 7 days
      expect(CACHE_TTL.PERSON).toBe(60 * 60 * 24 * 7);

      // Company cache: 30 days
      expect(CACHE_TTL.COMPANY).toBe(60 * 60 * 24 * 30);

      // Phone cache: 90 days (phones don't change often)
      expect(CACHE_TTL.PHONE).toBe(60 * 60 * 24 * 90);
    });
  });

  describe("cacheGet", () => {
    it("should return cached value when exists", async () => {
      mockRedis.get.mockResolvedValueOnce({ name: "Test", value: 123 });

      const { cacheGet } = await import("@/lib/redis");
      const result = await cacheGet<{ name: string; value: number }>("test-key");

      expect(result).toEqual({ name: "Test", value: 123 });
      expect(mockRedis.get).toHaveBeenCalledWith("test-key");
    });

    it("should return null when key does not exist", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const { cacheGet } = await import("@/lib/redis");
      const result = await cacheGet("nonexistent-key");

      expect(result).toBeNull();
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.get.mockRejectedValueOnce(new Error("Redis connection error"));

      const { cacheGet } = await import("@/lib/redis");
      const result = await cacheGet("error-key");

      expect(result).toBeNull();
    });
  });

  describe("cacheSet", () => {
    it("should store value with TTL", async () => {
      mockRedis.set.mockResolvedValueOnce("OK");

      const { cacheSet } = await import("@/lib/redis");
      await cacheSet("test-key", { data: "test" }, 3600);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "test-key",
        { data: "test" },
        { ex: 3600 }
      );
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.set.mockRejectedValueOnce(new Error("Redis write error"));

      const { cacheSet } = await import("@/lib/redis");

      // Should not throw
      await expect(cacheSet("error-key", "value", 3600)).resolves.not.toThrow();
    });
  });

});
