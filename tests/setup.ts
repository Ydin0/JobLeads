/// <reference types="@testing-library/jest-dom" />
import { vi, beforeAll, afterEach, afterAll } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock environment variables
beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
  vi.stubEnv("APOLLO_API_KEY", "test-apollo-key");
  vi.stubEnv("APIFY_API_TOKEN", "test-apify-token");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-redis-token");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    })),
  },
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ userId: "test-user-id", orgId: "test-org-id" })),
  currentUser: vi.fn(() => Promise.resolve({ id: "test-user-id", emailAddresses: [{ emailAddress: "test@example.com" }] })),
}));
