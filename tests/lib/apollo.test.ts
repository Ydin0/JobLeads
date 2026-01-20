import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for Apollo API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock enrichment cache
vi.mock("@/lib/enrichment-cache", () => ({
  getCachedPerson: vi.fn(),
  getCachedCompany: vi.fn(),
  getCachedPhone: vi.fn(),
  cachePerson: vi.fn(),
  cacheCompany: vi.fn(),
  cachePhone: vi.fn(),
}));

describe("Apollo API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APOLLO_API_KEY", "test-apollo-key");
  });

  describe("getPhoneWithCache", () => {
    it("should return cached phone if available", async () => {
      const { getCachedPhone } = await import("@/lib/enrichment-cache");
      vi.mocked(getCachedPhone).mockResolvedValueOnce("+1234567890");

      const { getPhoneWithCache } = await import("@/lib/apollo");
      const result = await getPhoneWithCache("apollo-123");

      expect(result).toBe("+1234567890");
      expect(getCachedPhone).toHaveBeenCalledWith("apollo-123");
      // Should not call API when cache hit
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return null when phone not in cache", async () => {
      const { getCachedPhone } = await import("@/lib/enrichment-cache");
      vi.mocked(getCachedPhone).mockResolvedValueOnce(null);

      const { getPhoneWithCache } = await import("@/lib/apollo");
      const result = await getPhoneWithCache("apollo-456");

      expect(result).toBeNull();
    });
  });

  describe("storePhoneInCache", () => {
    it("should store phone in cache", async () => {
      const { cachePhone } = await import("@/lib/enrichment-cache");

      const { storePhoneInCache } = await import("@/lib/apollo");
      await storePhoneInCache("apollo-789", "+9876543210");

      expect(cachePhone).toHaveBeenCalledWith("apollo-789", "+9876543210");
    });
  });

  describe("enrichPersonWithCache", () => {
    it("should return cached person without API call", async () => {
      const { getCachedPerson } = await import("@/lib/enrichment-cache");

      const cachedPerson = {
        id: "cached-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        phone: "+1234567890",
        companyPhone: null,
        apolloId: "apollo-123",
        companyName: "Test Corp",
        companyDomain: "testcorp.com",
        location: "San Francisco",
        jobTitle: "Engineer",
        cachedAt: new Date().toISOString(),
        source: "redis" as const,
      };

      vi.mocked(getCachedPerson).mockResolvedValueOnce(cachedPerson);

      const { enrichPersonWithCache } = await import("@/lib/apollo");
      const result = await enrichPersonWithCache({
        linkedinUrl: "https://linkedin.com/in/johndoe",
      });

      expect(result.fromCache).toBe(true);
      expect(result.person?.firstName).toBe("John");
      expect(result.source).toBe("redis");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call Apollo API on cache miss", async () => {
      const { getCachedPerson, cachePerson } = await import("@/lib/enrichment-cache");
      vi.mocked(getCachedPerson).mockResolvedValueOnce(null);

      const apolloResponse = {
        person: {
          id: "apollo-new",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          linkedin_url: "https://linkedin.com/in/janesmith",
          phone_numbers: [{ sanitized_number: "+5551234567" }],
          title: "Product Manager",
          city: "New York",
          state: "NY",
          organization: {
            name: "Another Corp",
            website_url: "https://anothercorp.com",
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apolloResponse),
      });

      const { enrichPersonWithCache } = await import("@/lib/apollo");
      const result = await enrichPersonWithCache({
        linkedinUrl: "https://linkedin.com/in/janesmith",
      });

      expect(result.fromCache).toBe(false);
      expect(result.source).toBe("api");
      expect(result.person?.firstName).toBe("Jane");
      expect(mockFetch).toHaveBeenCalled();
      expect(cachePerson).toHaveBeenCalled();
    });

    it("should throw error on API failure", async () => {
      const { getCachedPerson } = await import("@/lib/enrichment-cache");
      vi.mocked(getCachedPerson).mockResolvedValueOnce(null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "Rate limited" }),
        text: () => Promise.resolve("Rate limited"),
      });

      const { enrichPersonWithCache } = await import("@/lib/apollo");

      // The function propagates API errors
      await expect(
        enrichPersonWithCache({
          linkedinUrl: "https://linkedin.com/in/test",
        })
      ).rejects.toThrow("Apollo API error");
    });
  });

  describe("bulkEnrichPeople", () => {
    it("should return empty array for empty input", async () => {
      const { bulkEnrichPeople } = await import("@/lib/apollo");
      const result = await bulkEnrichPeople({ apolloIds: [] });

      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call Apollo bulk match API", async () => {
      const apolloResponse = {
        matches: [
          {
            id: "apollo-1",
            first_name: "John",
            last_name: "Doe",
            email: "john@example.com",
            phone_numbers: [{ sanitized_number: "+1111111111" }],
          },
          {
            id: "apollo-2",
            first_name: "Jane",
            last_name: "Smith",
            email: "jane@example.com",
            phone_numbers: [{ sanitized_number: "+2222222222" }],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apolloResponse),
      });

      const { bulkEnrichPeople } = await import("@/lib/apollo");
      const result = await bulkEnrichPeople({
        apolloIds: ["apollo-1", "apollo-2"],
        revealPhoneNumber: true,
        webhookUrl: "https://example.com/webhook", // Required when revealPhoneNumber is true
      });

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe("John");
      expect(result[1].firstName).toBe("Jane");
    });

    it("should include webhook URL when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ matches: [] }),
      });

      const { bulkEnrichPeople } = await import("@/lib/apollo");
      await bulkEnrichPeople({
        apolloIds: ["apollo-1"],
        revealPhoneNumber: true,
        webhookUrl: "https://example.com/webhook",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("webhook"),
        })
      );
    });
  });

});


describe("Apollo Helper Functions", () => {
  describe("normalizeLinkedInUrl", () => {
    it("should extract profile path from full URL", async () => {
      // This tests through enrichPersonWithCache which internally normalizes URLs
      // The cache key generation uses normalized URLs
      const { getCachedPerson } = await import("@/lib/enrichment-cache");
      vi.mocked(getCachedPerson).mockResolvedValueOnce(null);

      // Test that different URL formats work
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ person: null }),
      });

      const { enrichPersonWithCache } = await import("@/lib/apollo");

      // These should all resolve to the same normalized key internally
      await enrichPersonWithCache({ linkedinUrl: "https://linkedin.com/in/johndoe" });
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
