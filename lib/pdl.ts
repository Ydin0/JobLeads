// People Data Labs API integration for company enrichment
import PDLJS from "peopledatalabs";

const PDL_API_KEY = process.env.PDL_API_KEY;

// Initialize PDL client
function getPDLClient() {
  if (!PDL_API_KEY) {
    throw new Error("PDL_API_KEY is not configured");
  }
  return new PDLJS({ apiKey: PDL_API_KEY });
}

// Types for PDL company response
export interface PDLCompanyResponse {
  status: number;
  name: string;
  display_name: string;
  size: string;
  employee_count: number;
  id: string;
  founded: number;
  industry: string;
  location: {
    name: string;
    locality: string;
    region: string;
    metro: string;
    country: string;
    continent: string;
    street_address: string;
    address_line_2: string;
    postal_code: string;
    geo: string;
  };
  linkedin_id: string;
  linkedin_url: string;
  facebook_url: string;
  twitter_url: string;
  website: string;
  ticker: string;
  type: string;
  summary: string;
  tags: string[];
  headline: string;
  alternative_names: string[];
  alternative_domains: string[];
  affiliated_profiles: string[];
  likelihood: number;
}

export interface EnrichedCompanyData {
  name: string;
  displayName: string;
  domain: string | null;
  website: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  logoUrl: string | null;
  industry: string | null;
  employeeCount: number | null;
  size: string | null;
  foundedYear: number | null;
  location: string | null;
  description: string | null;
  type: string | null;
  tags: string[];
}

/**
 * Enrich a company using People Data Labs
 * Can match by LinkedIn URL, website domain, or company name
 */
export async function enrichCompanyWithPDL(params: {
  linkedinUrl?: string;
  website?: string;
  name?: string;
}): Promise<EnrichedCompanyData | null> {
  const client = getPDLClient();

  const { linkedinUrl, website, name } = params;

  // Build query parameters - PDL accepts profile (LinkedIn URL), website, or name
  let queryParams: { profile?: string; website?: string; name?: string } = {};

  if (linkedinUrl) {
    queryParams = { profile: linkedinUrl };
  } else if (website) {
    // Extract domain from website URL
    let domain = website;
    try {
      const url = new URL(website.startsWith("http") ? website : `https://${website}`);
      domain = url.hostname.replace(/^www\./, "");
    } catch {
      // Use website as-is
    }
    queryParams = { website: domain };
  } else if (name) {
    queryParams = { name };
  } else {
    throw new Error("At least one of linkedinUrl, website, or name is required");
  }

  console.log("[PDL] Enriching company with params:", queryParams);

  try {
    // Cast to any to avoid strict type issues with the SDK
    const response = await client.company.enrichment(queryParams as Parameters<typeof client.company.enrichment>[0]);
    console.log("[PDL] Company enrichment response:", response);

    if (!response || response.status === 404) {
      console.log("[PDL] No company found");
      return null;
    }

    const company = response as PDLCompanyResponse;

    // Build location string
    const locationParts = [
      company.location?.locality,
      company.location?.region,
      company.location?.country,
    ].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : null;

    // Extract domain from website
    let domain: string | null = null;
    if (company.website) {
      try {
        const url = new URL(
          company.website.startsWith("http") ? company.website : `https://${company.website}`
        );
        domain = url.hostname.replace(/^www\./, "");
      } catch {
        domain = company.website;
      }
    }

    return {
      name: company.name,
      displayName: company.display_name || company.name,
      domain,
      website: company.website || null,
      linkedinUrl: company.linkedin_url || null,
      facebookUrl: company.facebook_url || null,
      twitterUrl: company.twitter_url || null,
      logoUrl: null, // PDL doesn't return logo URL directly
      industry: company.industry || null,
      employeeCount: company.employee_count || null,
      size: company.size || null,
      foundedYear: company.founded || null,
      location,
      description: company.summary || null,
      type: company.type || null,
      tags: company.tags || [],
    };
  } catch (error) {
    console.error("[PDL] Error enriching company:", error);
    throw error;
  }
}

/**
 * Search for a company by name to find its domain/details
 */
export async function searchCompanyWithPDL(name: string): Promise<EnrichedCompanyData | null> {
  return enrichCompanyWithPDL({ name });
}
