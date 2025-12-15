import { ApifyClient } from "apify-client";

if (!process.env.APIFY_API_TOKEN) {
  throw new Error("APIFY_API_TOKEN environment variable is not set");
}

export const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// LinkedIn Jobs Scraper Actor ID
export const LINKEDIN_JOBS_ACTOR_ID = "BHzefUZlZRKWxkTck";

// Input types for LinkedIn Jobs Scraper
export interface LinkedInJobsInput {
  title?: string;
  location?: string;
  companyName?: string[];
  companyId?: string[];
  publishedAt?: string;
  rows?: number;
  proxy?: {
    useApifyProxy: boolean;
    apifyProxyGroups?: string[];
  };
}

// Output types from LinkedIn Jobs Scraper
export interface LinkedInJobResult {
  id?: string;
  title: string;
  jobUrl: string;
  location: string;
  postedTime?: string;
  publishedAt: string;
  companyName: string;
  companyUrl: string;
  companyId?: string;
  description?: string;
  applicationsCount?: string;
  contractType?: string;
  experienceLevel?: string;
  workType?: string;
  sector?: string;
  salary?: string;
  posterFullName?: string;
  posterProfileUrl?: string;
  applyUrl?: string;
  applyType?: string;
  benefits?: string;
}

// Run LinkedIn Jobs search
export async function runLinkedInJobsSearch(
  input: LinkedInJobsInput
): Promise<LinkedInJobResult[]> {
  const defaultInput: LinkedInJobsInput = {
    rows: 50,
    proxy: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
    ...input,
  };

  console.log("[Apify] Running actor with input:", JSON.stringify(defaultInput, null, 2));
  console.log("[Apify] Actor ID:", LINKEDIN_JOBS_ACTOR_ID);

  // Run the Actor and wait for it to finish
  const run = await apifyClient.actor(LINKEDIN_JOBS_ACTOR_ID).call(defaultInput);
  console.log("[Apify] Actor run completed. Run ID:", run.id, "Dataset ID:", run.defaultDatasetId);

  // Fetch results from the run's dataset
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  console.log("[Apify] Fetched", items.length, "items from dataset");

  return items as unknown as LinkedInJobResult[];
}

// Extract unique companies from job results
export function extractCompaniesFromJobs(jobs: LinkedInJobResult[]) {
  const companiesMap = new Map<
    string,
    {
      name: string;
      linkedinUrl: string;
      logoUrl?: string;
      linkedinId?: string;
      jobCount: number;
      jobs: LinkedInJobResult[];
    }
  >();

  for (const job of jobs) {
    // Skip jobs without company data
    if (!job.companyName) {
      console.log("[Apify] Skipping job without company name:", job.id || job.title);
      continue;
    }

    const companyKey = job.companyName.toLowerCase();
    const existing = companiesMap.get(companyKey);

    if (existing) {
      existing.jobCount++;
      existing.jobs.push(job);
    } else {
      companiesMap.set(companyKey, {
        name: job.companyName,
        linkedinUrl: job.companyUrl || "",
        linkedinId: job.companyId,
        jobCount: 1,
        jobs: [job],
      });
    }
  }

  console.log("[Apify] Extracted", companiesMap.size, "unique companies from", jobs.length, "jobs");
  return Array.from(companiesMap.values());
}
