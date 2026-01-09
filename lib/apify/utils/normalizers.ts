import type {
  LinkedInJobResult,
  IndeedJobResult,
  GlassdoorJobResult,
  NormalizedJobResult,
} from "../types";
import { apifyLogger as log } from "../../logger";

/**
 * Normalize LinkedIn job to common format
 */
export function normalizeLinkedInJob(job: LinkedInJobResult): NormalizedJobResult {
  return {
    id: job.id,
    source: "linkedin",
    title: job.title || "",
    companyName: job.companyName || "",
    companyUrl: job.companyUrl || "",
    companyId: job.companyId,
    location: job.location || "",
    description: job.description || "",
    publishedAt: job.publishedAt || job.postedTime || new Date().toISOString(),
    salary: job.salary,
    jobUrl: job.jobUrl || "",
    contractType: job.contractType,
    experienceLevel: job.experienceLevel,
    workType: job.workType,
  };
}

/**
 * Normalize Indeed job to common format
 */
export function normalizeIndeedJob(job: IndeedJobResult): NormalizedJobResult {
  return {
    id: job.id,
    source: "indeed",
    title: job.positionName || "",
    companyName: job.company || "",
    companyUrl: job.companyInfo?.url || "",
    location: job.location || "",
    description: job.description || "",
    publishedAt: job.postedAt || job.scrapedAt || new Date().toISOString(),
    salary: job.salary,
    jobUrl: job.url || "",
    contractType: job.jobType,
  };
}

/**
 * Normalize Glassdoor job to common format
 */
export function normalizeGlassdoorJob(job: GlassdoorJobResult): NormalizedJobResult {
  return {
    id: job.id,
    source: "glassdoor",
    title: job.title || "",
    companyName: job.company || "",
    companyUrl: job.companyUrl || "",
    companyId: job.companyId,
    location: job.location || "",
    description: job.description || "",
    publishedAt: job.postedDate || new Date().toISOString(),
    salary: job.salary || (job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : undefined),
    jobUrl: job.url || "",
    contractType: job.jobType,
  };
}

/**
 * Normalize jobs from any supported source
 */
export function normalizeJobs(
  jobs: (LinkedInJobResult | IndeedJobResult | GlassdoorJobResult)[],
  source: "linkedin" | "indeed" | "glassdoor"
): NormalizedJobResult[] {
  log.info(`Normalizing ${jobs.length} jobs from ${source}`);

  switch (source) {
    case "linkedin":
      return (jobs as LinkedInJobResult[]).map(normalizeLinkedInJob);
    case "indeed":
      return (jobs as IndeedJobResult[]).map(normalizeIndeedJob);
    case "glassdoor":
      return (jobs as GlassdoorJobResult[]).map(normalizeGlassdoorJob);
    default:
      log.warn(`Unknown job source: ${source}`);
      return [];
  }
}
