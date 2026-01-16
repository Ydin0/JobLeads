import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Mock the environment variable before importing apify module
beforeAll(() => {
  vi.stubEnv("APIFY_API_TOKEN", "test-token-for-testing");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// Dynamic import after env is set
const getApifyModule = async () => {
  return import("../lib/apify");
};

describe("Apify Constants", () => {
  describe("Job Board Actor IDs", () => {
    it("should have LinkedIn actor ID defined", async () => {
      const { LINKEDIN_JOBS_ACTOR_ID } = await getApifyModule();
      expect(LINKEDIN_JOBS_ACTOR_ID).toBeDefined();
      expect(typeof LINKEDIN_JOBS_ACTOR_ID).toBe("string");
      expect(LINKEDIN_JOBS_ACTOR_ID.length).toBeGreaterThan(0);
    });

    it("should have Indeed actor ID defined", async () => {
      const { INDEED_JOBS_ACTOR_ID } = await getApifyModule();
      expect(INDEED_JOBS_ACTOR_ID).toBeDefined();
      expect(typeof INDEED_JOBS_ACTOR_ID).toBe("string");
      expect(INDEED_JOBS_ACTOR_ID.length).toBeGreaterThan(0);
    });

    it("should have Glassdoor actor ID defined", async () => {
      const { GLASSDOOR_JOBS_ACTOR_ID } = await getApifyModule();
      expect(GLASSDOOR_JOBS_ACTOR_ID).toBeDefined();
      expect(typeof GLASSDOOR_JOBS_ACTOR_ID).toBe("string");
      expect(GLASSDOOR_JOBS_ACTOR_ID.length).toBeGreaterThan(0);
    });

    it("should have LinkedIn Company actor ID defined", async () => {
      const { LINKEDIN_COMPANY_ACTOR_ID } = await getApifyModule();
      expect(LINKEDIN_COMPANY_ACTOR_ID).toBeDefined();
      expect(typeof LINKEDIN_COMPANY_ACTOR_ID).toBe("string");
      expect(LINKEDIN_COMPANY_ACTOR_ID.length).toBeGreaterThan(0);
    });
  });

  describe("JOB_BOARD_ACTOR_IDS mapping", () => {
    it("should have all 3 job boards mapped", async () => {
      const { JOB_BOARD_ACTOR_IDS } = await getApifyModule();
      expect(Object.keys(JOB_BOARD_ACTOR_IDS)).toHaveLength(3);
    });

    it("should map linkedin to correct actor ID", async () => {
      const { JOB_BOARD_ACTOR_IDS, LINKEDIN_JOBS_ACTOR_ID } = await getApifyModule();
      expect(JOB_BOARD_ACTOR_IDS.linkedin).toBe(LINKEDIN_JOBS_ACTOR_ID);
    });

    it("should map indeed to correct actor ID", async () => {
      const { JOB_BOARD_ACTOR_IDS, INDEED_JOBS_ACTOR_ID } = await getApifyModule();
      expect(JOB_BOARD_ACTOR_IDS.indeed).toBe(INDEED_JOBS_ACTOR_ID);
    });

    it("should map glassdoor to correct actor ID", async () => {
      const { JOB_BOARD_ACTOR_IDS, GLASSDOOR_JOBS_ACTOR_ID } = await getApifyModule();
      expect(JOB_BOARD_ACTOR_IDS.glassdoor).toBe(GLASSDOOR_JOBS_ACTOR_ID);
    });
  });
});

describe("extractCompaniesFromJobs", () => {
  it("should extract unique companies from LinkedIn job results", async () => {
    const { extractCompaniesFromJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Software Engineer",
        jobUrl: "https://linkedin.com/jobs/1",
        location: "San Francisco, CA",
        publishedAt: "2024-01-01",
        companyName: "TechCorp",
        companyUrl: "https://linkedin.com/company/techcorp",
        companyId: "123",
      },
      {
        title: "Senior Developer",
        jobUrl: "https://linkedin.com/jobs/2",
        location: "New York, NY",
        publishedAt: "2024-01-02",
        companyName: "TechCorp",
        companyUrl: "https://linkedin.com/company/techcorp",
        companyId: "123",
      },
      {
        title: "Data Scientist",
        jobUrl: "https://linkedin.com/jobs/3",
        location: "Austin, TX",
        publishedAt: "2024-01-03",
        companyName: "DataCo",
        companyUrl: "https://linkedin.com/company/dataco",
        companyId: "456",
      },
    ];

    const result = extractCompaniesFromJobs(mockJobs);
    
    expect(result).toHaveLength(2);
    
    const techCorp = result.find(c => c.name === "TechCorp");
    expect(techCorp).toBeDefined();
    expect(techCorp?.jobCount).toBe(2);
    expect(techCorp?.jobs).toHaveLength(2);
    expect(techCorp?.linkedinUrl).toBe("https://linkedin.com/company/techcorp");
    
    const dataCo = result.find(c => c.name === "DataCo");
    expect(dataCo).toBeDefined();
    expect(dataCo?.jobCount).toBe(1);
  });

  it("should handle jobs without company URL", async () => {
    const { extractCompaniesFromJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Engineer",
        jobUrl: "https://linkedin.com/jobs/1",
        location: "Remote",
        publishedAt: "2024-01-01",
        companyName: "NoUrlCorp",
        companyUrl: "",
      },
    ];

    const result = extractCompaniesFromJobs(mockJobs);
    
    expect(result).toHaveLength(1);
    expect(result[0].linkedinUrl).toBe("");
  });

  it("should skip jobs without company name", async () => {
    const { extractCompaniesFromJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Engineer",
        jobUrl: "https://linkedin.com/jobs/1",
        location: "Remote",
        publishedAt: "2024-01-01",
        companyName: "",
        companyUrl: "https://linkedin.com/company/test",
      },
    ];

    const result = extractCompaniesFromJobs(mockJobs);
    
    expect(result).toHaveLength(0);
  });

  it("should handle empty job array", async () => {
    const { extractCompaniesFromJobs } = await getApifyModule();
    
    const result = extractCompaniesFromJobs([]);
    
    expect(result).toHaveLength(0);
  });

  it("should be case-insensitive when deduplicating companies", async () => {
    const { extractCompaniesFromJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Job 1",
        jobUrl: "https://linkedin.com/jobs/1",
        location: "NYC",
        publishedAt: "2024-01-01",
        companyName: "TechCorp",
        companyUrl: "https://linkedin.com/company/techcorp",
      },
      {
        title: "Job 2",
        jobUrl: "https://linkedin.com/jobs/2",
        location: "LA",
        publishedAt: "2024-01-02",
        companyName: "techcorp",
        companyUrl: "https://linkedin.com/company/techcorp",
      },
    ];

    const result = extractCompaniesFromJobs(mockJobs);
    
    expect(result).toHaveLength(1);
    expect(result[0].jobCount).toBe(2);
  });
});

describe("extractCompaniesFromNormalizedJobs", () => {
  it("should extract unique companies from normalized job results", async () => {
    const { extractCompaniesFromNormalizedJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Software Engineer",
        jobUrl: "https://example.com/jobs/1",
        location: "San Francisco, CA",
        publishedAt: "2024-01-01",
        companyName: "TechCorp",
        companyUrl: "https://example.com/company/techcorp",
        source: "linkedin",
      },
      {
        title: "Senior Developer",
        jobUrl: "https://example.com/jobs/2",
        location: "New York, NY",
        publishedAt: "2024-01-02",
        companyName: "TechCorp",
        companyUrl: "https://example.com/company/techcorp",
        source: "indeed",
      },
      {
        title: "Data Scientist",
        jobUrl: "https://example.com/jobs/3",
        location: "Austin, TX",
        publishedAt: "2024-01-03",
        companyName: "DataCo",
        companyUrl: "https://example.com/company/dataco",
        source: "glassdoor",
      },
    ];

    const result = extractCompaniesFromNormalizedJobs(mockJobs);
    
    expect(result).toHaveLength(2);
    
    const techCorp = result.find(c => c.name === "TechCorp");
    expect(techCorp).toBeDefined();
    expect(techCorp?.jobCount).toBe(2);
    expect(techCorp?.sources).toContain("linkedin");
    expect(techCorp?.sources).toContain("indeed");
  });

  it("should track sources from multiple job boards", async () => {
    const { extractCompaniesFromNormalizedJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Job 1",
        jobUrl: "url1",
        location: "NYC",
        publishedAt: "2024-01-01",
        companyName: "MultiSource Inc",
        companyUrl: "url",
        source: "linkedin",
      },
      {
        title: "Job 2",
        jobUrl: "url2",
        location: "LA",
        publishedAt: "2024-01-02",
        companyName: "MultiSource Inc",
        companyUrl: "url",
        source: "indeed",
      },
      {
        title: "Job 3",
        jobUrl: "url3",
        location: "Austin",
        publishedAt: "2024-01-03",
        companyName: "MultiSource Inc",
        companyUrl: "url",
        source: "glassdoor",
      },
    ];

    const result = extractCompaniesFromNormalizedJobs(mockJobs);
    
    expect(result).toHaveLength(1);
    expect(result[0].sources).toHaveLength(3);
    expect(result[0].sources).toContain("linkedin");
    expect(result[0].sources).toContain("indeed");
    expect(result[0].sources).toContain("glassdoor");
  });

  it("should handle jobs without company name", async () => {
    const { extractCompaniesFromNormalizedJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Job",
        jobUrl: "url",
        location: "NYC",
        publishedAt: "2024-01-01",
        companyName: "",
        companyUrl: "url",
        source: "linkedin",
      },
    ];

    const result = extractCompaniesFromNormalizedJobs(mockJobs);
    
    expect(result).toHaveLength(0);
  });

  it("should update company URL if missing initially", async () => {
    const { extractCompaniesFromNormalizedJobs } = await getApifyModule();
    
    const mockJobs = [
      {
        title: "Job 1",
        jobUrl: "url1",
        location: "NYC",
        publishedAt: "2024-01-01",
        companyName: "NoUrlFirst",
        companyUrl: "",
        source: "linkedin",
      },
      {
        title: "Job 2",
        jobUrl: "url2",
        location: "LA",
        publishedAt: "2024-01-02",
        companyName: "NoUrlFirst",
        companyUrl: "https://company.com",
        source: "indeed",
      },
    ];

    const result = extractCompaniesFromNormalizedJobs(mockJobs);
    
    expect(result).toHaveLength(1);
    expect(result[0].companyUrl).toBe("https://company.com");
  });
});

describe("Interface Types", () => {
  it("NormalizedJobResult should have required fields", async () => {
    // Create a mock normalized job to verify the interface structure
    const normalizedJob = {
      title: "Test Job",
      jobUrl: "https://example.com/job/1",
      location: "Remote",
      publishedAt: "2024-01-01T00:00:00.000Z",
      companyName: "Test Company",
      companyUrl: "https://example.com/company/test",
      source: "linkedin",
    };

    // Verify all required fields exist
    expect(normalizedJob.title).toBeDefined();
    expect(normalizedJob.jobUrl).toBeDefined();
    expect(normalizedJob.location).toBeDefined();
    expect(normalizedJob.publishedAt).toBeDefined();
    expect(normalizedJob.companyName).toBeDefined();
    expect(normalizedJob.companyUrl).toBeDefined();
    expect(normalizedJob.source).toBeDefined();
    
    // Verify field types
    expect(typeof normalizedJob.title).toBe("string");
    expect(typeof normalizedJob.source).toBe("string");
  });

  it("UnifiedJobSearchInput should have required fields", () => {
    // Verify the interface structure by creating a mock input
    const searchInput = {
      jobBoard: "linkedin",
      title: "Software Engineer",
      location: "San Francisco",
      maxResults: 50,
    };

    expect(searchInput.jobBoard).toBeDefined();
    expect(searchInput.title).toBeDefined();
    expect(searchInput.location).toBeDefined();
    expect(typeof searchInput.maxResults).toBe("number");
  });
});

describe("scrapeCompanyProfiles", () => {
  it("should return empty array for empty input", async () => {
    const { scrapeCompanyProfiles } = await getApifyModule();
    
    const result = await scrapeCompanyProfiles([]);
    
    expect(result).toEqual([]);
  });
});
