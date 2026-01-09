import type {
  LinkedInJobResult,
  NormalizedJobResult,
} from "../types";
import { apifyLogger as log } from "../../logger";

interface ExtractedCompanyFromLinkedIn {
  name: string;
  linkedinUrl: string;
  logoUrl?: string;
  linkedinId?: string;
  jobCount: number;
  jobs: LinkedInJobResult[];
}

interface ExtractedCompanyFromNormalizedJobs {
  name: string;
  companyUrl: string;
  companyId?: string;
  jobCount: number;
  jobs: NormalizedJobResult[];
  sources: string[];
}

/**
 * Extract unique companies from LinkedIn job results
 */
export function extractCompaniesFromJobs(
  jobs: LinkedInJobResult[]
): ExtractedCompanyFromLinkedIn[] {
  const companiesMap = new Map<string, ExtractedCompanyFromLinkedIn>();

  let companiesWithoutUrl = 0;

  for (const job of jobs) {
    // Skip jobs without company data
    if (!job.companyName) {
      log.debug(`Skipping job without company name: ${job.id || job.title}`);
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
  log.info(`Extracted ${companiesMap.size} unique companies from ${jobs.length} jobs`);
  log.debug(`Companies with LinkedIn URL: ${companiesWithUrl}, without URL: ${companiesWithoutUrl}`);

  return Array.from(companiesMap.values());
}

/**
 * Extract unique companies from normalized job results (works with any job board)
 */
export function extractCompaniesFromNormalizedJobs(
  jobs: NormalizedJobResult[]
): ExtractedCompanyFromNormalizedJobs[] {
  const companiesMap = new Map<
    string,
    {
      name: string;
      companyUrl: string;
      companyId?: string;
      jobCount: number;
      jobs: NormalizedJobResult[];
      sources: Set<string>;
    }
  >();

  let companiesWithoutUrl = 0;

  for (const job of jobs) {
    // Skip jobs without company data
    if (!job.companyName) {
      log.debug(`Skipping job without company name: ${job.id || job.title}`);
      continue;
    }

    const companyKey = job.companyName.toLowerCase().trim();
    const existing = companiesMap.get(companyKey);

    if (existing) {
      existing.jobCount++;
      existing.jobs.push(job);
      existing.sources.add(job.source);
      // Update URL if we have one now but didn't before
      if (!existing.companyUrl && job.companyUrl) {
        existing.companyUrl = job.companyUrl;
      }
      // Update company ID if we have one now
      if (!existing.companyId && job.companyId) {
        existing.companyId = job.companyId;
      }
    } else {
      if (!job.companyUrl) {
        companiesWithoutUrl++;
      }
      companiesMap.set(companyKey, {
        name: job.companyName,
        companyUrl: job.companyUrl || "",
        companyId: job.companyId,
        jobCount: 1,
        jobs: [job],
        sources: new Set([job.source]),
      });
    }
  }

  const result = Array.from(companiesMap.values()).map(c => ({
    ...c,
    sources: Array.from(c.sources),
  }));

  const companiesWithUrl = result.filter(c => c.companyUrl).length;
  log.info(`Extracted ${result.length} unique companies from ${jobs.length} normalized jobs`);
  log.debug(`Companies with URL: ${companiesWithUrl}, without URL: ${companiesWithoutUrl}`);

  return result;
}
