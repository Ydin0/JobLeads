import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      globalEmployees: {
        findFirst: vi.fn(),
      },
      globalCompanies: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => Promise.resolve()),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: "test-id" }])),
        })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => Promise.resolve([{ count: 10 }])),
    })),
  },
}));

// Mock Redis
vi.mock("@/lib/redis", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(() => Promise.resolve()),
  CACHE_KEYS: {
    PERSON: "person:",
    COMPANY: "company:",
    PHONE: "phone:",
  },
  CACHE_TTL: {
    PERSON: 604800,
    COMPANY: 2592000,
    PHONE: 7776000,
  },
}));

describe("Enrichment Cache Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCachedPerson", () => {
    it("should return cached person from Redis if available", async () => {
      const { cacheGet } = await import("@/lib/redis");
      const { getCachedPerson } = await import("@/lib/enrichment-cache");

      const mockPerson = {
        id: "test-id",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        phone: "+1234567890",
        companyPhone: null,
        apolloId: "apollo-123",
        companyName: "Test Corp",
        companyDomain: "testcorp.com",
        location: "San Francisco, CA",
        jobTitle: "Software Engineer",
        cachedAt: new Date().toISOString(),
        source: "redis" as const,
      };

      vi.mocked(cacheGet).mockResolvedValueOnce(mockPerson);

      const result = await getCachedPerson({ linkedinUrl: "https://linkedin.com/in/johndoe" });

      expect(result).toBeDefined();
      expect(result?.firstName).toBe("John");
      expect(result?.source).toBe("redis");
      expect(cacheGet).toHaveBeenCalledTimes(1);
    });

    it("should return cached person from DB if not in Redis", async () => {
      const { cacheGet, cacheSet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { getCachedPerson } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(db.query.globalEmployees.findFirst).mockResolvedValueOnce({
        id: "db-id",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        linkedinUrl: "https://linkedin.com/in/janesmith",
        phone: "+0987654321",
        apolloId: "apollo-456",
        companyName: "Another Corp",
        companyDomain: "anothercorp.com",
        location: "New York, NY",
        jobTitle: "Product Manager",
        fetchedAt: new Date(),
        seniority: "senior",
        department: "engineering",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await getCachedPerson({ email: "jane@example.com" });

      expect(result).toBeDefined();
      expect(result?.firstName).toBe("Jane");
      expect(result?.source).toBe("db");
      expect(cacheSet).toHaveBeenCalled(); // Should populate Redis
    });

    it("should return null if person not found anywhere", async () => {
      const { cacheGet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { getCachedPerson } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(db.query.globalEmployees.findFirst).mockResolvedValueOnce(null);

      const result = await getCachedPerson({ linkedinUrl: "https://linkedin.com/in/notfound" });

      expect(result).toBeNull();
    });

    it("should return null if no lookup params provided", async () => {
      const { getCachedPerson } = await import("@/lib/enrichment-cache");

      const result = await getCachedPerson({});

      expect(result).toBeNull();
    });
  });

  describe("getCachedCompany", () => {
    it("should return cached company from Redis if available", async () => {
      const { cacheGet } = await import("@/lib/redis");
      const { getCachedCompany } = await import("@/lib/enrichment-cache");

      const mockCompany = {
        id: "company-id",
        name: "Test Corp",
        domain: "testcorp.com",
        linkedinUrl: "https://linkedin.com/company/testcorp",
        industry: "Technology",
        size: "100-500",
        location: "San Francisco, CA",
        description: "A test company",
        logoUrl: "https://example.com/logo.png",
        cachedAt: new Date().toISOString(),
        source: "redis" as const,
      };

      vi.mocked(cacheGet).mockResolvedValueOnce(mockCompany);

      const result = await getCachedCompany("testcorp.com");

      expect(result).toBeDefined();
      expect(result?.name).toBe("Test Corp");
      expect(result?.source).toBe("redis");
    });

    it("should return cached company from DB if not in Redis", async () => {
      const { cacheGet, cacheSet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { getCachedCompany } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(db.query.globalCompanies.findFirst).mockResolvedValueOnce({
        id: "db-company-id",
        name: "DB Corp",
        domain: "dbcorp.com",
        linkedinUrl: "https://linkedin.com/company/dbcorp",
        industry: "Finance",
        employeesCount: 200,
        location: "Boston, MA",
        description: "A database company",
        logoUrl: "https://example.com/dblogo.png",
        updatedAt: new Date(),
        createdAt: new Date(),
        enrichmentSource: "apollo",
        metadata: {},
      });

      const result = await getCachedCompany("dbcorp.com");

      expect(result).toBeDefined();
      expect(result?.name).toBe("DB Corp");
      expect(result?.source).toBe("db");
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe("getCachedPhone", () => {
    it("should return cached phone from Redis if available", async () => {
      const { cacheGet } = await import("@/lib/redis");
      const { getCachedPhone } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce("+1234567890");

      const result = await getCachedPhone("apollo-123");

      expect(result).toBe("+1234567890");
    });

    it("should return phone from DB if not in Redis", async () => {
      const { cacheGet, cacheSet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { getCachedPhone } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(db.query.globalEmployees.findFirst).mockResolvedValueOnce({
        phone: "+0987654321",
        firstName: "Test",
        lastName: "User",
      });

      const result = await getCachedPhone("apollo-456");

      expect(result).toBe("+0987654321");
      expect(cacheSet).toHaveBeenCalled();
    });

    it("should return null if phone not found", async () => {
      const { cacheGet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { getCachedPhone } = await import("@/lib/enrichment-cache");

      vi.mocked(cacheGet).mockResolvedValueOnce(null);
      vi.mocked(db.query.globalEmployees.findFirst).mockResolvedValueOnce(null);

      const result = await getCachedPhone("apollo-notfound");

      expect(result).toBeNull();
    });
  });

  describe("cachePhone", () => {
    it("should store phone in both Redis and DB", async () => {
      const { cacheSet } = await import("@/lib/redis");
      const { db } = await import("@/lib/db");
      const { cachePhone } = await import("@/lib/enrichment-cache");

      await cachePhone("apollo-789", "+1112223333");

      expect(cacheSet).toHaveBeenCalledWith(
        expect.stringContaining("phone:apollo-789"),
        "+1112223333",
        expect.any(Number)
      );
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe("getCacheStats", () => {
    it("should return cache statistics", async () => {
      const { getCacheStats } = await import("@/lib/enrichment-cache");

      const stats = await getCacheStats();

      expect(stats).toHaveProperty("globalEmployeesCount");
      expect(stats).toHaveProperty("globalCompaniesCount");
    });
  });
});
