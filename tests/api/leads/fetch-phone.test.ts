import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
const mockDb = {
  query: {
    leads: {
      findFirst: vi.fn(),
    },
    creditUsage: {
      findFirst: vi.fn(),
    },
  },
  update: vi.fn(),
  insert: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  requireOrgAuth: vi.fn(),
  checkMemberCredits: vi.fn(),
}));

// Mock Apollo functions
vi.mock("@/lib/apollo", () => ({
  bulkEnrichPeople: vi.fn(),
  enrichPersonWithCache: vi.fn(),
  getPhoneWithCache: vi.fn(),
  storePhoneInCache: vi.fn(),
}));

describe("POST /api/leads/[id]/fetch-phone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 404 when lead not found", async () => {
    const { requireOrgAuth } = await import("@/lib/auth");
    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Lead not found");
  });

  it("should return existing phone if lead already has one", async () => {
    const { requireOrgAuth } = await import("@/lib/auth");
    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: "+1234567890",
      firstName: "John",
      lastName: "Doe",
      metadata: { apolloId: "apollo-123" },
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.phone).toBe("+1234567890");
    expect(data.message).toBe("Lead already has a phone number");
  });

  it("should return 400 when lead has no Apollo ID", async () => {
    const { requireOrgAuth } = await import("@/lib/auth");
    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: null,
      firstName: "John",
      lastName: "Doe",
      metadata: {}, // No apolloId
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Lead does not have an Apollo ID for phone lookup");
  });

  it("should return cached phone without charging credits", async () => {
    const { requireOrgAuth } = await import("@/lib/auth");
    const { getPhoneWithCache } = await import("@/lib/apollo");

    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: null,
      firstName: "John",
      lastName: "Doe",
      metadata: { apolloId: "apollo-123" },
    });

    vi.mocked(getPhoneWithCache).mockResolvedValueOnce("+9876543210");

    mockDb.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValueOnce({
        where: vi.fn().mockResolvedValueOnce(undefined),
      }),
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.phone).toBe("+9876543210");
    expect(data.creditsSaved).toBe(1);
    expect(data.message).toContain("cache");
  });

  it("should return 402 when member has no credits", async () => {
    const { requireOrgAuth, checkMemberCredits } = await import("@/lib/auth");
    const { getPhoneWithCache } = await import("@/lib/apollo");

    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: null,
      firstName: "John",
      lastName: "Doe",
      metadata: { apolloId: "apollo-123" },
    });

    vi.mocked(getPhoneWithCache).mockResolvedValueOnce(null); // Cache miss
    vi.mocked(checkMemberCredits).mockResolvedValueOnce({
      allowed: false,
      reason: "Member enrichment limit exceeded",
      remaining: 0,
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(response.status).toBe(402);
    expect(data.error).toBe("Member enrichment limit exceeded");
    expect(data.limitType).toBe("member");
  });

  it("should return 402 when org has no credits", async () => {
    const { requireOrgAuth, checkMemberCredits } = await import("@/lib/auth");
    const { getPhoneWithCache } = await import("@/lib/apollo");

    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: null,
      firstName: "John",
      lastName: "Doe",
      metadata: { apolloId: "apollo-123" },
    });

    vi.mocked(getPhoneWithCache).mockResolvedValueOnce(null); // Cache miss
    vi.mocked(checkMemberCredits).mockResolvedValueOnce({
      allowed: true,
      remaining: 10,
    });

    mockDb.query.creditUsage.findFirst.mockResolvedValueOnce({
      orgId: "org-456",
      enrichmentLimit: 200,
      enrichmentUsed: 200, // All credits used
      icpLimit: 1000,
      icpUsed: 0,
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(response.status).toBe(402);
    expect(data.error).toBe("Insufficient credits for phone lookup");
    expect(data.remaining).toBe(0);
  });

  it("should fetch phone via enrichment and charge credits", async () => {
    const { requireOrgAuth, checkMemberCredits } = await import("@/lib/auth");
    const { getPhoneWithCache, enrichPersonWithCache, storePhoneInCache } = await import("@/lib/apollo");

    vi.mocked(requireOrgAuth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    });

    mockDb.query.leads.findFirst.mockResolvedValueOnce({
      id: "lead-123",
      orgId: "org-456",
      phone: null,
      companyPhone: null,
      firstName: "John",
      lastName: "Doe",
      linkedinUrl: "https://linkedin.com/in/johndoe",
      metadata: { apolloId: "apollo-123" },
    });

    vi.mocked(getPhoneWithCache).mockResolvedValueOnce(null); // Cache miss
    vi.mocked(checkMemberCredits).mockResolvedValueOnce({
      allowed: true,
      remaining: 100,
    });

    mockDb.query.creditUsage.findFirst.mockResolvedValueOnce({
      orgId: "org-456",
      enrichmentLimit: 200,
      enrichmentUsed: 50,
      icpLimit: 1000,
      icpUsed: 0,
    });

    vi.mocked(enrichPersonWithCache).mockResolvedValueOnce({
      person: {
        apolloId: "apollo-123",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "+5551234567",
        companyPhone: null,
        linkedinUrl: "https://linkedin.com/in/johndoe",
        jobTitle: "Engineer",
        location: "San Francisco",
        seniority: "senior",
        departments: ["engineering"],
        company: null,
      },
      fromCache: false, // API was called
      source: "api",
    });

    vi.mocked(storePhoneInCache).mockResolvedValueOnce(undefined);

    // Mock all the DB update operations
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            enrichmentLimit: 200,
            enrichmentUsed: 51,
          }]),
        }),
      }),
    });

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const { POST } = await import("@/app/api/leads/[id]/fetch-phone/route");

    const request = new Request("http://localhost:3000/api/leads/lead-123/fetch-phone", {
      method: "POST",
    });
    const response = await POST(request, { params: Promise.resolve({ id: "lead-123" }) });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.phone).toBe("+5551234567");
    // Should have called storePhoneInCache
    expect(storePhoneInCache).toHaveBeenCalledWith("apollo-123", "+5551234567");
  });
});
