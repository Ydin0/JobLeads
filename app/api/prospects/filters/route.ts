import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, employees } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

// Country code to name mapping
const CODE_TO_COUNTRY: Record<string, string> = {
  'US': 'United States', 'USA': 'United States',
  'GB': 'United Kingdom', 'UK': 'United Kingdom',
  'CA': 'Canada',
  'DE': 'Germany',
  'FR': 'France',
  'NL': 'Netherlands',
  'AU': 'Australia',
  'SG': 'Singapore',
  'JP': 'Japan',
  'IN': 'India',
  'BR': 'Brazil',
  'MX': 'Mexico',
  'ES': 'Spain',
  'IT': 'Italy',
  'CH': 'Switzerland',
  'SE': 'Sweden',
  'DK': 'Denmark',
  'NO': 'Norway',
  'FI': 'Finland',
  'IE': 'Ireland',
  'BE': 'Belgium',
  'AT': 'Austria',
  'PL': 'Poland',
  'PT': 'Portugal',
  'CZ': 'Czech Republic',
  'IL': 'Israel',
  'AE': 'United Arab Emirates', 'UAE': 'United Arab Emirates',
  'ZA': 'South Africa',
  'NZ': 'New Zealand',
  'KR': 'South Korea',
  'CN': 'China',
  'HK': 'Hong Kong',
  'TW': 'Taiwan',
  'ID': 'Indonesia',
  'PH': 'Philippines',
  'VN': 'Vietnam',
  'TH': 'Thailand',
  'MY': 'Malaysia',
  'AR': 'Argentina',
  'CO': 'Colombia',
  'CL': 'Chile',
  'PE': 'Peru',
  'EG': 'Egypt',
  'NG': 'Nigeria',
  'KE': 'Kenya',
  'SA': 'Saudi Arabia',
  'CR': 'Costa Rica',
};

// Extract country from location string (e.g., "Bristol, GB" -> "United Kingdom")
function extractCountryFromLocation(location: string): string | null {
  const parts = location.split(/[,\s]+/);
  const lastPart = parts[parts.length - 1]?.trim().toUpperCase();

  if (lastPart && CODE_TO_COUNTRY[lastPart]) {
    return CODE_TO_COUNTRY[lastPart];
  }

  // Check for full country names
  const locationUpper = location.toUpperCase();
  for (const country of Object.values(CODE_TO_COUNTRY)) {
    if (locationUpper.includes(country.toUpperCase())) {
      return country;
    }
  }

  return null;
}

// GET /api/prospects/filters - Get distinct filter options
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    // Get distinct job titles (top 50 most common)
    const jobTitlesResult = await db
      .select({
        jobTitle: employees.jobTitle,
        count: sql<number>`count(*)::int`,
      })
      .from(employees)
      .where(eq(employees.orgId, orgId))
      .groupBy(employees.jobTitle)
      .orderBy(sql`count(*) DESC`)
      .limit(50);

    const jobTitles = jobTitlesResult
      .filter((r) => r.jobTitle)
      .map((r) => r.jobTitle as string);

    // Get distinct industries (top 30)
    const industriesResult = await db
      .select({
        industry: companies.industry,
        count: sql<number>`count(*)::int`,
      })
      .from(companies)
      .where(eq(companies.orgId, orgId))
      .groupBy(companies.industry)
      .orderBy(sql`count(*) DESC`)
      .limit(30);

    const industries = industriesResult
      .filter((r) => r.industry)
      .map((r) => r.industry as string);

    // Get companies for filter dropdown (top 100 by employee count)
    const companiesResult = await db
      .select({
        id: companies.id,
        name: companies.name,
        employeeCount: sql<number>`(SELECT COUNT(*) FROM employees WHERE employees.company_id = ${companies.id})::int`,
      })
      .from(companies)
      .where(eq(companies.orgId, orgId))
      .orderBy(sql`(SELECT COUNT(*) FROM employees WHERE employees.company_id = ${companies.id}) DESC`)
      .limit(100);

    const companyOptions = companiesResult.map((c) => ({
      id: c.id,
      name: c.name,
    }));

    // Predefined options
    const seniorities = [
      'owner',
      'founder',
      'c_suite',
      'partner',
      'vp',
      'head',
      'director',
      'manager',
      'senior',
      'entry',
    ];

    const departments = [
      'engineering',
      'sales',
      'marketing',
      'hr',
      'finance',
      'operations',
      'design',
      'product',
      'customer_success',
      'legal',
      'other',
    ];

    const sizes = [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ];

    // Get distinct locations from companies to extract countries
    const locationsResult = await db
      .select({
        location: companies.location,
      })
      .from(companies)
      .where(eq(companies.orgId, orgId))
      .groupBy(companies.location);

    const extractedCountries = new Set<string>();
    for (const row of locationsResult) {
      if (row.location) {
        const country = extractCountryFromLocation(row.location);
        if (country) {
          extractedCountries.add(country);
        }
      }
    }

    return NextResponse.json({
      jobTitles,
      seniorities,
      departments,
      industries,
      sizes,
      countries: Array.from(extractedCountries).sort(),
      companies: companyOptions,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter options" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
