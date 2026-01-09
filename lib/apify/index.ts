// Apify Integration Module
// This module provides a unified interface for all Apify scrapers

// Client
export { apifyClient } from "./client";

// Constants
export {
  LINKEDIN_JOBS_ACTOR_ID,
  INDEED_JOBS_ACTOR_ID,
  GLASSDOOR_JOBS_ACTOR_ID,
  LINKEDIN_COMPANY_ACTOR_ID,
  LINKEDIN_EMPLOYEES_ACTOR_ID,
  COMPANY_EMPLOYEES_ACTOR_ID,
  CONTACT_DETAILS_ACTOR_ID,
  JOB_BOARD_ACTOR_IDS,
  INDEED_COUNTRY_CODES,
} from "./constants";

// Types
export type {
  LinkedInJobsInput,
  LinkedInJobResult,
  IndeedJobsInput,
  IndeedJobResult,
  GlassdoorJobsInput,
  GlassdoorJobResult,
  LinkedInCompanyScraperInput,
  LinkedInCompanyResult,
  LinkedInEmployeesInput,
  LinkedInEmployeeResult,
  CompanyEmployeesInput,
  CompanyEmployeeResult,
  ContactDetailsInput,
  ContactDetailsResult,
  NormalizedJobResult,
  UnifiedJobSearchInput,
  MultiJobBoardSearchInput,
} from "./types";

// Scrapers
export { runLinkedInJobsSearch } from "./scrapers/linkedin-jobs";
export { runIndeedJobsSearch } from "./scrapers/indeed-jobs";
export { runGlassdoorJobsSearch } from "./scrapers/glassdoor-jobs";
export { scrapeCompanyProfiles } from "./scrapers/linkedin-company";
export { runLinkedInEmployeesSearch } from "./scrapers/linkedin-employees";
export { runCompanyEmployeesSearch } from "./scrapers/company-employees";
export { runContactDetailsSearch } from "./scrapers/contact-details";

// Utils
export {
  normalizeLinkedInJob,
  normalizeIndeedJob,
  normalizeGlassdoorJob,
  normalizeJobs,
} from "./utils/normalizers";

export {
  extractCompaniesFromJobs,
  extractCompaniesFromNormalizedJobs,
} from "./utils/extractors";

export {
  runJobSearch,
  runMultiJobBoardSearch,
  type JobBoard,
} from "./utils/unified-search";
