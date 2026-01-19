// Apollo.io API integration for contact and company enrichment

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
const APOLLO_BASE_URL = "https://api.apollo.io/api/v1";

// Types for Apollo API responses
export interface ApolloPersonResponse {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    linkedin_url: string;
    title: string;
    email_status: string;
    email: string;
    phone_numbers: Array<{
      raw_number: string;
      sanitized_number: string;
      type: string;
      position: number;
      status: string;
    }>;
    organization_id: string;
    organization: {
      id: string;
      name: string;
      website_url: string;
      linkedin_url: string;
      primary_domain: string;
      logo_url: string;
    };
    city: string;
    state: string;
    country: string;
    departments: string[];
    subdepartments: string[];
    seniority: string;
    functions: string[];
    employment_history: Array<{
      id: string;
      organization_name: string;
      title: string;
      start_date: string;
      end_date: string | null;
      current: boolean;
    }>;
  } | null;
}

export interface ApolloOrganizationResponse {
  organization: {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string;
    primary_domain: string;
    logo_url: string;
    industry: string;
    estimated_num_employees: number;
    phone: string;
    founded_year: number;
    city: string;
    state: string;
    country: string;
    short_description: string;
    annual_revenue: number;
    annual_revenue_printed: string;
    total_funding: number;
    total_funding_printed: string;
    technologies: string[];
    keywords: string[];
    seo_description: string;
  } | null;
}

export interface EnrichedPerson {
  apolloId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  companyPhone: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  location: string | null;
  seniority: string | null;
  departments: string[];
  company: {
    name: string;
    website: string | null;
    linkedinUrl: string | null;
    logoUrl: string | null;
  } | null;
}

export interface EnrichedCompany {
  name: string;
  domain: string | null;
  website: string | null;
  linkedinUrl: string | null;
  logoUrl: string | null;
  industry: string | null;
  employeeCount: number | null;
  phone: string | null;
  foundedYear: number | null;
  location: string | null;
  description: string | null;
  annualRevenue: string | null;
  totalFunding: string | null;
  technologies: string[];
  keywords: string[];
}

/**
 * Enrich a person/contact using Apollo's People Match API
 * Can match by LinkedIn URL, email, or name + company
 */
export async function enrichPerson(params: {
  linkedinUrl?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}): Promise<EnrichedPerson | null> {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  const { linkedinUrl, email, firstName, lastName, organizationName } = params;

  // Build request body based on available params
  const requestBody: Record<string, string> = {};

  if (linkedinUrl) {
    requestBody.linkedin_url = linkedinUrl;
  }
  if (email) {
    requestBody.email = email;
  }
  if (firstName) {
    requestBody.first_name = firstName;
  }
  if (lastName) {
    requestBody.last_name = lastName;
  }
  if (organizationName) {
    requestBody.organization_name = organizationName;
  }

  console.log("[Apollo] Enriching person:", requestBody);

  try {
    const response = await fetch(`${APOLLO_BASE_URL}/people/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Apollo] API error:", response.status, errorText);
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    const data: ApolloPersonResponse = await response.json();
    console.log("[Apollo] Person response:", data);

    if (!data.person) {
      console.log("[Apollo] No person found");
      return null;
    }

    const person = data.person;

    // Extract primary phone number
    const primaryPhone = person.phone_numbers?.find(p => p.status === "verified")?.sanitized_number
      || person.phone_numbers?.[0]?.sanitized_number
      || null;

    // Build location string
    const locationParts = [person.city, person.state, person.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : null;

    // Extract company phone as fallback
    const companyPhone = (person.organization as { phone?: string })?.phone || null;

    return {
      apolloId: person.id || null,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email || null,
      phone: primaryPhone,
      companyPhone,
      jobTitle: person.title || null,
      linkedinUrl: person.linkedin_url || null,
      location,
      seniority: person.seniority || null,
      departments: person.departments || [],
      company: person.organization ? {
        name: person.organization.name,
        website: person.organization.website_url || null,
        linkedinUrl: person.organization.linkedin_url || null,
        logoUrl: person.organization.logo_url || null,
      } : null,
    };
  } catch (error) {
    console.error("[Apollo] Error enriching person:", error);
    throw error;
  }
}

/**
 * Search for an organization by name to find its domain
 * Use this when you don't have a domain but need to find it
 */
export async function searchOrganization(name: string): Promise<{ domain: string; name: string } | null> {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  console.log("[Apollo] Searching organization by name:", name);

  try {
    const response = await fetch(`${APOLLO_BASE_URL}/mixed_companies/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        q_organization_name: name,
        per_page: 1,
        page: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Apollo] API error:", response.status, errorText);
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("[Apollo] Organization search response:", data);

    const org = data.organizations?.[0] || data.accounts?.[0];
    if (!org) {
      console.log("[Apollo] No organization found for:", name);
      return null;
    }

    const domain = org.primary_domain || org.domain;
    if (!domain) {
      console.log("[Apollo] Organization found but no domain:", org.name);
      return null;
    }

    return {
      domain,
      name: org.name,
    };
  } catch (error) {
    console.error("[Apollo] Error searching organization:", error);
    throw error;
  }
}

/**
 * Enrich a company/organization using Apollo's Organization Enrichment API
 * Matches by domain
 */
export async function enrichOrganization(domain: string): Promise<EnrichedCompany | null> {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  console.log("[Apollo] Enriching organization:", domain);

  try {
    const response = await fetch(`${APOLLO_BASE_URL}/organizations/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_API_KEY,
      },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Apollo] API error:", response.status, errorText);
      throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
    }

    const data: ApolloOrganizationResponse = await response.json();
    console.log("[Apollo] Organization response:", data);

    if (!data.organization) {
      console.log("[Apollo] No organization found");
      return null;
    }

    const org = data.organization;

    // Build location string
    const locationParts = [org.city, org.state, org.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : null;

    return {
      name: org.name,
      domain: org.primary_domain || null,
      website: org.website_url || null,
      linkedinUrl: org.linkedin_url || null,
      logoUrl: org.logo_url || null,
      industry: org.industry || null,
      employeeCount: org.estimated_num_employees || null,
      phone: org.phone || null,
      foundedYear: org.founded_year || null,
      location,
      description: org.short_description || org.seo_description || null,
      annualRevenue: org.annual_revenue_printed || null,
      totalFunding: org.total_funding_printed || null,
      technologies: org.technologies || [],
      keywords: org.keywords || [],
    };
  } catch (error) {
    console.error("[Apollo] Error enriching organization:", error);
    throw error;
  }
}

/**
 * Search for people at a company - fetches employees by paginating through results
 * @param maxPages - Maximum number of pages to fetch (default 10, max 100 people per page = 1000 people)
 * @param fetchAll - If true, ignores maxPages and fetches ALL employees (use for global caching)
 */
export async function searchPeopleAtCompany(params: {
  organizationName?: string;
  organizationDomain?: string;
  titles?: string[];
  seniorities?: string[];
  limit?: number; // Deprecated - we now fetch all
  maxPages?: number;
  fetchAll?: boolean;
}): Promise<EnrichedPerson[]> {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  const { organizationName, organizationDomain, titles, seniorities, maxPages = 10, fetchAll = false } = params;
  const perPage = 100; // Max allowed by Apollo API

  const baseRequestBody: Record<string, unknown> = {};

  // Use domain list if available (preferred), otherwise fall back to org name
  if (organizationDomain) {
    baseRequestBody.q_organization_domains_list = [organizationDomain];
  } else if (organizationName) {
    // Fallback to organization name if no domain available
    baseRequestBody.q_organization_name = organizationName;
  }
  if (titles && titles.length > 0) {
    baseRequestBody.person_titles = titles;
  }
  if (seniorities && seniorities.length > 0) {
    baseRequestBody.person_seniorities = seniorities;
  }

  // Note: api_search returns obfuscated data - last_name_obfuscated instead of last_name
  interface SearchPerson {
    id: string;
    first_name: string;
    last_name?: string;
    last_name_obfuscated?: string;
    title?: string;
    email?: string;
    linkedin_url?: string;
    city?: string;
    state?: string;
    country?: string;
    seniority?: string;
    departments?: string[];
    phone_numbers?: Array<{ sanitized_number: string; status: string }>;
    organization?: {
      name: string;
      website_url?: string;
      linkedin_url?: string;
      logo_url?: string;
      phone?: string;
    };
  }

  const mapPerson = (person: SearchPerson): EnrichedPerson | null => {
    if (!person) return null;

    const primaryPhone = person.phone_numbers?.find(p => p.status === "verified")?.sanitized_number
      || person.phone_numbers?.[0]?.sanitized_number
      || null;

    const locationParts = [person.city, person.state, person.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : null;

    // Use last_name if available, otherwise use obfuscated or "Unknown"
    const lastName = person.last_name || person.last_name_obfuscated || "Unknown";

    return {
      apolloId: person.id || null,
      firstName: person.first_name,
      lastName,
      email: person.email || null,
      phone: primaryPhone,
      companyPhone: person.organization?.phone || null,
      jobTitle: person.title || null,
      linkedinUrl: person.linkedin_url || null,
      location,
      seniority: person.seniority || null,
      departments: person.departments || [],
      company: person.organization ? {
        name: person.organization.name,
        website: person.organization.website_url || null,
        linkedinUrl: person.organization.linkedin_url || null,
        logoUrl: person.organization.logo_url || null,
      } : null,
    };
  };

  const allPeople: EnrichedPerson[] = [];
  let currentPage = 1;
  let totalEntries = 0;
  let hasMore = true;

  const effectiveMaxPages = fetchAll ? Infinity : maxPages;
  console.log(`[Apollo] Starting paginated search (fetchAll: ${fetchAll}, maxPages: ${fetchAll ? 'unlimited' : maxPages})...`);

  try {
    while (hasMore && currentPage <= effectiveMaxPages) {
      const requestBody = {
        ...baseRequestBody,
        per_page: perPage,
        page: currentPage,
      };

      console.log(`[Apollo] Fetching page ${currentPage}...`);

      const response = await fetch(`${APOLLO_BASE_URL}/mixed_people/api_search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": APOLLO_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Apollo] API error:", response.status, errorText);
        throw new Error(`Apollo API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (currentPage === 1) {
        totalEntries = data.pagination?.total_entries || data.total_entries || 0;
        console.log(`[Apollo] Total employees available: ${totalEntries}`);
      }

      const pagePeople = (data.people || [])
        .map(mapPerson)
        .filter((p: EnrichedPerson | null): p is EnrichedPerson => p !== null);

      allPeople.push(...pagePeople);
      console.log(`[Apollo] Page ${currentPage}: fetched ${pagePeople.length} employees (total so far: ${allPeople.length})`);

      // Check if we have more pages
      const totalPages = Math.ceil(totalEntries / perPage);
      hasMore = currentPage < totalPages && pagePeople.length > 0;
      currentPage++;

      // Small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`[Apollo] Finished fetching. Total employees retrieved: ${allPeople.length} of ${totalEntries}`);
    return allPeople;
  } catch (error) {
    console.error("[Apollo] Error searching people:", error);
    throw error;
  }
}

/**
 * Bulk enrich people using Apollo's People Bulk Match API
 * Uses Apollo person IDs for more accurate matching
 * Apollo has a limit of 10 people per request, so we batch automatically
 * @param apolloIds - Array of Apollo person IDs to enrich
 * @param revealPhoneNumber - Whether to reveal phone numbers (costs additional credits)
 * @param webhookUrl - Required if revealPhoneNumber is true. Apollo sends phone data asynchronously to this URL.
 * @returns Array of enriched person data (phone numbers delivered separately via webhook if requested)
 */
export async function bulkEnrichPeople(params: {
  apolloIds: string[];
  revealPhoneNumber?: boolean;
  webhookUrl?: string;
}): Promise<EnrichedPerson[]> {
  if (!APOLLO_API_KEY) {
    throw new Error("APOLLO_API_KEY is not configured");
  }

  const { apolloIds, revealPhoneNumber = false, webhookUrl } = params;

  if (apolloIds.length === 0) {
    return [];
  }

  // If revealing phone numbers, webhook URL is required by Apollo
  if (revealPhoneNumber && !webhookUrl) {
    throw new Error("webhookUrl is required when revealPhoneNumber is true");
  }

  // Apollo has a limit of 10 people per bulk_match request
  const BATCH_SIZE = 10;
  const CONCURRENT_BATCHES = 5; // Process 5 batches in parallel

  // Response contains matches array with full person data
  interface BulkMatchPerson {
    id: string;
    first_name: string;
    last_name: string;
    title?: string;
    email?: string;
    email_status?: string;
    linkedin_url?: string;
    city?: string;
    state?: string;
    country?: string;
    seniority?: string;
    departments?: string[];
    phone_numbers?: Array<{
      raw_number: string;
      sanitized_number: string;
      type: string;
      status: string;
    }>;
    organization?: {
      id: string;
      name: string;
      website_url?: string;
      linkedin_url?: string;
      logo_url?: string;
      phone?: string;
    };
  }

  const mapPerson = (person: BulkMatchPerson | null): EnrichedPerson | null => {
    if (!person) return null;

    const primaryPhone = person.phone_numbers?.find(p => p.status === "verified")?.sanitized_number
      || person.phone_numbers?.[0]?.sanitized_number
      || null;

    const locationParts = [person.city, person.state, person.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : null;

    return {
      apolloId: person.id || null,
      firstName: person.first_name,
      lastName: person.last_name,
      email: person.email || null,
      phone: primaryPhone,
      companyPhone: person.organization?.phone || null,
      jobTitle: person.title || null,
      linkedinUrl: person.linkedin_url || null,
      location,
      seniority: person.seniority || null,
      departments: person.departments || [],
      company: person.organization ? {
        name: person.organization.name,
        website: person.organization.website_url || null,
        linkedinUrl: person.organization.linkedin_url || null,
        logoUrl: person.organization.logo_url || null,
      } : null,
    };
  };

  // Split into batches
  const batches: string[][] = [];
  for (let i = 0; i < apolloIds.length; i += BATCH_SIZE) {
    batches.push(apolloIds.slice(i, i + BATCH_SIZE));
  }

  console.log(`[Apollo] Processing ${batches.length} batches (${CONCURRENT_BATCHES} concurrent), reveal_phone: ${revealPhoneNumber}`);

  const processBatch = async (batchIds: string[], batchNumber: number): Promise<EnrichedPerson[]> => {
    const details = batchIds.map(id => ({ id }));
    const requestBody: Record<string, unknown> = { details };

    if (revealPhoneNumber) {
      requestBody.reveal_phone_number = true;
      requestBody.webhook_url = webhookUrl;
    }

    try {
      const response = await fetch(`${APOLLO_BASE_URL}/people/bulk_match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": APOLLO_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Apollo] Batch ${batchNumber} API error:`, response.status, errorText);
        return [];
      }

      const data = await response.json();
      const results = (data.matches || []).map(mapPerson).filter(Boolean) as EnrichedPerson[];
      console.log(`[Apollo] Batch ${batchNumber}/${batches.length} enriched ${results.length} people`);
      return results;
    } catch (error) {
      console.error(`[Apollo] Error in batch ${batchNumber}:`, error);
      return [];
    }
  };

  // Process batches with concurrency limit
  const allEnrichedPeople: EnrichedPerson[] = [];
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const concurrentBatches = batches.slice(i, i + CONCURRENT_BATCHES);
    const results = await Promise.all(
      concurrentBatches.map((batch, idx) => processBatch(batch, i + idx + 1))
    );
    allEnrichedPeople.push(...results.flat());
  }

  console.log(`[Apollo] Total enriched: ${allEnrichedPeople.length} of ${apolloIds.length} people`);
  return allEnrichedPeople;
}
