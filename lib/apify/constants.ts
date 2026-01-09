// ============================================
// Job Board Scraper Actor IDs
// ============================================

// LinkedIn Jobs Scraper Actor ID
export const LINKEDIN_JOBS_ACTOR_ID = "BHzefUZlZRKWxkTck";

// Indeed Scraper Actor ID
export const INDEED_SCRAPER_ACTOR_ID = "hMvNSpz3JnHgl5jkh";

// Indeed Jobs Scraper Actor ID (alternative)
export const INDEED_JOBS_ACTOR_ID = "TrtlecxAsNRbKl1na";

// Glassdoor Jobs Scraper Actor ID
export const GLASSDOOR_JOBS_ACTOR_ID = "Rm4QHNPPxMIOhHCas";

// ============================================
// Additional Scraper Actor IDs
// ============================================

// LinkedIn Companies & Profiles Bulk Scraper Actor ID
export const LINKEDIN_COMPANY_ACTOR_ID = "od6RadQV98FOARtrp";

// LinkedIn Company Employees Scraper Actor ID
export const LINKEDIN_EMPLOYEES_ACTOR_ID = "Vb6LZkh4EqRlR0Ka9";

// Company Employees Scraper Actor ID
export const COMPANY_EMPLOYEES_ACTOR_ID = "PVFd2eVwrFtNM5jqN";

// Contact Details Scraper Actor ID
export const CONTACT_DETAILS_ACTOR_ID = "9Sk4JJhEma9vBKqrg";

// Job board ID to Actor ID mapping
export const JOB_BOARD_ACTOR_IDS: Record<string, string> = {
  linkedin: LINKEDIN_JOBS_ACTOR_ID,
  indeed: INDEED_JOBS_ACTOR_ID,
  glassdoor: GLASSDOOR_JOBS_ACTOR_ID,
};

// Valid Indeed country codes (must be lowercase)
export const INDEED_COUNTRY_CODES = [
  "ar", "au", "at", "bh", "be", "br", "ca", "cl", "cn", "co", "cr", "cz", "dk",
  "ec", "eg", "fi", "fr", "de", "gr", "hk", "hu", "in", "id", "ie", "il", "it",
  "jp", "kw", "lu", "my", "mx", "ma", "nl", "nz", "ng", "no", "om", "pk", "pa",
  "pe", "ph", "pl", "pt", "qa", "ro", "sa", "sg", "za", "kr", "es", "se", "ch",
  "tw", "th", "tr", "ua", "ae", "uk", "us", "uy", "ve", "vn"
] as const;

export type IndeedCountryCode = typeof INDEED_COUNTRY_CODES[number];
