import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
const mockDb = {
  select: vi.fn(),
  query: {
    creditHistory: {
      findMany: vi.fn(),
    },
  },
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

describe("GET /api/credits/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({ userId: null, orgId: null } as never);

    const { GET } = await import("@/app/api/credits/history/route");

    const request = new Request("http://localhost:3000/api/credits/history");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return credit history for authenticated user", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    } as never);

    const mockHistory = [
      {
        id: "ch-1",
        creditType: "enrichment",
        transactionType: "phone_fetch",
        creditsUsed: 1,
        balanceAfter: 199,
        description: "Phone fetch for John Doe",
        searchId: null,
        companyId: null,
        metadata: { leadId: "lead-1", apolloId: "apollo-1", phoneFound: true },
        createdAt: new Date("2024-01-15"),
        userId: "user-123",
        userFirstName: "Test",
        userLastName: "User",
        userEmail: "test@example.com",
        userImageUrl: null,
        searchName: null,
      },
      {
        id: "ch-2",
        creditType: "icp",
        transactionType: "scraper_run",
        creditsUsed: 50,
        balanceAfter: 950,
        description: "Scraper run for Senior Java - found 50 companies",
        searchId: "search-1",
        companyId: null,
        metadata: { companiesReturned: 50 },
        createdAt: new Date("2024-01-14"),
        userId: "user-123",
        userFirstName: "Test",
        userLastName: "User",
        userEmail: "test@example.com",
        userImageUrl: null,
        searchName: "Senior Java Hire",
      },
    ];

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        leftJoin: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockReturnValueOnce({
                limit: vi.fn().mockResolvedValueOnce(mockHistory),
              }),
            }),
          }),
        }),
      }),
    });

    const { GET } = await import("@/app/api/credits/history/route");

    const request = new Request("http://localhost:3000/api/credits/history");
    const response = await GET(request);
    const data = await response.json();

    expect(data.history).toBeDefined();
    expect(Array.isArray(data.history)).toBe(true);
    expect(data.history).toHaveLength(2);
    expect(data.history[0].creditType).toBe("enrichment");
    expect(data.history[1].creditType).toBe("icp");
  });

  it("should filter by credit type when provided", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    } as never);

    const mockEnrichmentHistory = [
      {
        id: "ch-1",
        creditType: "enrichment",
        transactionType: "phone_fetch",
        creditsUsed: 1,
        balanceAfter: 199,
        description: "Phone fetch for John Doe",
        searchId: null,
        companyId: null,
        metadata: {},
        createdAt: new Date("2024-01-15"),
        userId: "user-123",
        userFirstName: "Test",
        userLastName: "User",
        userEmail: "test@example.com",
        userImageUrl: null,
        searchName: null,
      },
    ];

    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        leftJoin: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockReturnValueOnce({
                limit: vi.fn().mockResolvedValueOnce(mockEnrichmentHistory),
              }),
            }),
          }),
        }),
      }),
    });

    const { GET } = await import("@/app/api/credits/history/route");

    const request = new Request("http://localhost:3000/api/credits/history?type=enrichment");
    const response = await GET(request);
    const data = await response.json();

    expect(data.history).toHaveLength(1);
    expect(data.history[0].creditType).toBe("enrichment");
  });

  it("should respect limit parameter", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockResolvedValueOnce({
      userId: "user-123",
      orgId: "org-456",
    } as never);

    const limitMock = vi.fn().mockResolvedValueOnce([]);
    mockDb.select.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        leftJoin: vi.fn().mockReturnValueOnce({
          leftJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockReturnValueOnce({
                limit: limitMock,
              }),
            }),
          }),
        }),
      }),
    });

    const { GET } = await import("@/app/api/credits/history/route");

    const request = new Request("http://localhost:3000/api/credits/history?limit=10");
    await GET(request);

    expect(limitMock).toHaveBeenCalledWith(10);
  });
});
