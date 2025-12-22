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

// LinkedIn Company/Profile Scraper Actor ID
export const LINKEDIN_COMPANY_ACTOR_ID = "od6RadQV98FOARtrp";

// Types for LinkedIn Company Scraper
export interface LinkedInCompanyScraperInput {
  action: "get-companies";
  keywords: string[]; // LinkedIn URLs when isUrl is true
  isUrl: boolean;
  isName: boolean;
  limit: number;
}

// Response from LinkedIn Company Scraper
export interface LinkedInCompanyResult {
  urn: string; // "urn:li:fsd_company:106234599"
  url: string; // LinkedIn company URL
  name: string;
  avatar?: string; // Company logo URL
  tagline?: string;
  description?: string;
  industry?: string[]; // Array of industries
  websiteUrl?: string;
  headquarter?: {
    description?: string;
    country?: string;
    city?: string;
    postalCode?: string | null;
  };
  hashtag?: string[];
  employeeCount?: number;
  followerCount?: number;
}

// Clean LinkedIn URL by removing query parameters and normalizing to www.linkedin.com
function cleanLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query parameters
    parsed.search = "";
    // Normalize all country-specific subdomains to www.linkedin.com
    // e.g., uk.linkedin.com, ph.linkedin.com -> www.linkedin.com
    if (parsed.hostname.endsWith('.linkedin.com')) {
      parsed.hostname = 'www.linkedin.com';
    }
    // Ensure trailing slash is removed
    const cleanUrl = parsed.toString().replace(/\/$/, "");
    return cleanUrl;
  } catch {
    // If URL parsing fails, try basic normalization
    const cleanUrl = url.split("?")[0].replace(/\/$/, "").replace(/https?:\/\/[a-z]{2}\.linkedin\.com/i, 'https://www.linkedin.com');
    return cleanUrl;
  }
}

// Batch scrape company profiles by LinkedIn URLs
export async function scrapeCompanyProfiles(
  linkedinUrls: string[]
): Promise<LinkedInCompanyResult[]> {
  if (linkedinUrls.length === 0) {
    return [];
  }

  // Clean URLs before sending to Apify
  const cleanedUrls = linkedinUrls.map(cleanLinkedInUrl);
  console.log(`[Apify] Scraping ${cleanedUrls.length} company profiles...`);

  const input: LinkedInCompanyScraperInput = {
    action: "get-companies",
    keywords: cleanedUrls,
    isUrl: true,
    isName: false,
    limit: cleanedUrls.length,
  };

  console.log("[Apify] Running company scraper with input:", JSON.stringify(input, null, 2));

  const run = await apifyClient.actor(LINKEDIN_COMPANY_ACTOR_ID).call(input);
  console.log("[Apify] Company scraper completed. Run ID:", run.id, "Dataset ID:", run.defaultDatasetId);

  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
  console.log("[Apify] Fetched", items.length, "company profiles from dataset");

  return items as unknown as LinkedInCompanyResult[];
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

  let companiesWithoutUrl = 0;

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
      // Update URL if we have one now but didn't before
      if (!existing.linkedinUrl && job.companyUrl) {
        existing.linkedinUrl = job.companyUrl;
      }
    } else {
      if (!job.companyUrl) {
        companiesWithoutUrl++;
      }
      companiesMap.set(companyKey, {
        name: job.companyName,
        linkedinUrl: job.companyUrl || "",
        linkedinId: job.companyId,
        jobCount: 1,
        jobs: [job],
      });
    }
  }

  const companiesWithUrl = Array.from(companiesMap.values()).filter(c => c.linkedinUrl).length;
  console.log(`[Apify] Extracted ${companiesMap.size} unique companies from ${jobs.length} jobs`);
  console.log(`[Apify] Companies with LinkedIn URL: ${companiesWithUrl}, without URL: ${companiesWithoutUrl}`);

  return Array.from(companiesMap.values());
}
