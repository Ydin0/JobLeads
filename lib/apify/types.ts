// ============================================
// LinkedIn Jobs Scraper Types
// ============================================

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

// ============================================
// Indeed Jobs Scraper Types
// ============================================

export interface IndeedJobsInput {
  position?: string;
  country?: string; // Must be lowercase: "us", "uk", "ca", etc.
  location?: string;
  maxItems?: number;
  parseCompanyDetails?: boolean;
  saveOnlyUniqueItems?: boolean;
  followApplyRedirects?: boolean;
}

export interface IndeedJobResult {
  id?: string;
  positionName: string;
  company: string;
  location: string;
  description?: string;
  url: string;
  salary?: string;
  jobType?: string;
  postedAt?: string;
  scrapedAt?: string;
  companyInfo?: {
    companyName?: string;
    url?: string;
    ratings?: string;
    reviewsCount?: string;
  };
  externalApplyLink?: string;
}

// ============================================
// Glassdoor Jobs Scraper Types
// ============================================

export interface GlassdoorJobsInput {
  keyword?: string;
  location?: string;
  maxItems?: number;
  includeJobDescription?: boolean;
}

export interface GlassdoorJobResult {
  id?: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  description?: string;
  url: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  postedDate?: string;
  easyApply?: boolean;
  jobType?: string;
  companyRating?: number;
  companyLogo?: string;
  companyUrl?: string;
}

// ============================================
// LinkedIn Company Scraper Types
// ============================================

export interface LinkedInCompanyScraperInput {
  action: "get-companies";
  keywords: string[]; // LinkedIn URLs when isUrl is true
  isUrl: boolean;
  isName: boolean;
  limit: number;
}

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

// ============================================
// LinkedIn Company Employees Scraper Types
// ============================================

export interface LinkedInEmployeesInput {
  companyUrls?: string[];
  companyIds?: string[];
  maxEmployees?: number;
  startPage?: number;
  proxy?: {
    useApifyProxy: boolean;
    apifyProxyGroups?: string[];
  };
}

export interface LinkedInEmployeeResult {
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  profileUrl: string;
  profilePicture?: string;
  location?: string;
  connectionDegree?: string;
  companyName?: string;
  companyUrl?: string;
  title?: string;
  currentPositions?: {
    title?: string;
    companyName?: string;
    companyUrl?: string;
    startDate?: string;
    location?: string;
  }[];
}

// ============================================
// Company Employees Scraper Types
// ============================================

export interface CompanyEmployeesInput {
  companyName?: string;
  companyDomain?: string;
  companyLinkedInUrl?: string;
  maxResults?: number;
  includeContactInfo?: boolean;
}

export interface CompanyEmployeeResult {
  id?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  location?: string;
  companyName?: string;
  seniority?: string;
}

// ============================================
// Contact Details Scraper Types
// ============================================

export interface ContactDetailsInput {
  linkedinUrls?: string[];
  emails?: string[];
  domains?: string[];
  names?: { firstName: string; lastName: string; company?: string }[];
  enrichEmail?: boolean;
  enrichPhone?: boolean;
}

export interface ContactDetailsResult {
  id?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  linkedinUrl?: string;
  title?: string;
  company?: string;
  location?: string;
  socialProfiles?: {
    twitter?: string;
    facebook?: string;
    github?: string;
  };
}

// ============================================
// Unified/Normalized Types
// ============================================

export interface NormalizedJobResult {
  id?: string;
  title: string;
  jobUrl: string;
  location: string;
  publishedAt: string;
  companyName: string;
  companyUrl: string;
  companyId?: string;
  description?: string;
  contractType?: string;
  experienceLevel?: string;
  workType?: string;
  salary?: string;
  source: string; // Job board source (linkedin, indeed, etc.)
}

export interface UnifiedJobSearchInput {
  jobBoard: string;
  title: string;
  location: string;
  maxResults?: number;
  experienceLevel?: string;
}

export interface MultiJobBoardSearchInput {
  jobBoards: string[];
  query: string;
  location: string;
  country?: string;
  maxResults?: number;
}
