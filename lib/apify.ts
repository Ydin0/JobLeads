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
  id: string;
  title: string;
  url: string;
  referenceId: string;
  posterId: string;
  company: {
    name: string;
    url: string;
    logo?: string;
    id?: string;
  };
  location: string;
  type?: string;
  publishedAt: string;
  salary?: string;
  applicationsCount?: string;
  description?: string;
  descriptionHtml?: string;
  skills?: string[];
  industries?: string[];
  seniorityLevel?: string;
  employmentType?: string;
  jobFunctions?: string[];
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

  // Run the Actor and wait for it to finish
  const run = await apifyClient.actor(LINKEDIN_JOBS_ACTOR_ID).call(defaultInput);

  // Fetch results from the run's dataset
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  return items as LinkedInJobResult[];
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
    const companyKey = job.company.name.toLowerCase();
    const existing = companiesMap.get(companyKey);

    if (existing) {
      existing.jobCount++;
      existing.jobs.push(job);
    } else {
      companiesMap.set(companyKey, {
        name: job.company.name,
        linkedinUrl: job.company.url,
        logoUrl: job.company.logo,
        linkedinId: job.company.id,
        jobCount: 1,
        jobs: [job],
      });
    }
  }

  return Array.from(companiesMap.values());
}
