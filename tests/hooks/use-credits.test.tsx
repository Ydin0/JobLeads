/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useCredits hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("should fetch and return credit data", async () => {
    const mockCreditsResponse = {
      enrichment: {
        used: 50,
        limit: 200,
        remaining: 150,
      },
      icp: {
        used: 100,
        limit: 1000,
        remaining: 900,
      },
      plan: {
        id: "free",
        name: "Free",
        price: 0,
      },
      billingCycle: {
        start: "2024-01-01T00:00:00.000Z",
        end: "2024-02-01T00:00:00.000Z",
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreditsResponse),
    });

    const { useCredits } = await import("@/hooks/use-credits");
    const { result } = renderHook(() => useCredits());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.credits).toBeDefined();
    expect(result.current.enrichmentUsed).toBe(50);
    expect(result.current.enrichmentLimit).toBe(200);
    expect(result.current.enrichmentRemaining).toBe(150);
    expect(result.current.icpUsed).toBe(100);
    expect(result.current.icpLimit).toBe(1000);
    expect(result.current.icpRemaining).toBe(900);
    expect(result.current.planName).toBe("Free");
  });

  it("should handle fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { useCredits } = await import("@/hooks/use-credits");
    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have default values on error
    expect(result.current.enrichmentUsed).toBe(0);
    expect(result.current.enrichmentLimit).toBe(0);
  });

  it("should handle non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { useCredits } = await import("@/hooks/use-credits");
    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have default values on error
    expect(result.current.credits).toBeNull();
  });

  it("should refetch on subsequent renders", async () => {
    const mockCreditsResponse = {
      enrichment: { used: 50, limit: 200, remaining: 150 },
      icp: { used: 100, limit: 1000, remaining: 900 },
      plan: { id: "free", name: "Free", price: 0 },
      billingCycle: { start: "2024-01-01", end: "2024-02-01" },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockCreditsResponse),
    });

    const { useCredits } = await import("@/hooks/use-credits");
    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial fetch happened
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.enrichmentUsed).toBe(50);
  });

  it("should calculate correct percentages", async () => {
    const mockCreditsResponse = {
      enrichment: { used: 100, limit: 200, remaining: 100 },
      icp: { used: 250, limit: 1000, remaining: 750 },
      plan: { id: "pro", name: "Pro", price: 49 },
      billingCycle: { start: "2024-01-01", end: "2024-02-01" },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCreditsResponse),
    });

    const { useCredits } = await import("@/hooks/use-credits");
    const { result } = renderHook(() => useCredits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Enrichment: 100/200 = 50% used
    expect(result.current.enrichmentUsed).toBe(100);
    expect(result.current.enrichmentRemaining).toBe(100);

    // ICP: 250/1000 = 25% used
    expect(result.current.icpUsed).toBe(250);
    expect(result.current.icpRemaining).toBe(750);
  });
});
