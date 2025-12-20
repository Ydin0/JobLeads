import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, employees } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { searchPeopleAtCompany, EnrichedPerson } from "@/lib/apollo";
import { enrichCompaniesInBatch, EnrichedCompanyData } from "@/lib/company-enrichment";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/companies/[id]/enrich - Enrich a company using LinkedIn scraper and find contacts using Apollo
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Get options from request body
    const body = await req.json().catch(() => ({}));
    const { findContacts = true } = body;

    // Get the company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    console.log("[Enrich Company] Enriching company:", company.name);

    let enrichedCompanyData: EnrichedCompanyData | null = null;
    const contactsFound: EnrichedPerson[] = [];

    // Enrich company using LinkedIn scraper (requires LinkedIn URL)
    if (company.linkedinUrl) {
      try {
        const [result] = await enrichCompaniesInBatch([
          {
            companyId: id,
            name: company.name,
            linkedinUrl: company.linkedinUrl,
          },
        ]);

        if (result.success && result.enrichedData) {
          enrichedCompanyData = result.enrichedData;
          console.log("[Enrich Company] LinkedIn enrichment result:", enrichedCompanyData);
        } else {
          console.log("[Enrich Company] LinkedIn enrichment failed:", result.error);
        }
      } catch (error) {
        console.error("[Enrich Company] Error enriching with LinkedIn scraper:", error);
      }
    } else {
      console.log("[Enrich Company] No LinkedIn URL available, skipping enrichment");
    }

    // Get the updated company (enrichment service already updated it if successful)
    const [updatedCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1);

    // Find contacts at this company if requested (using Apollo)
    if (findContacts) {
      try {
        const searchParams: {
          organizationName?: string;
          organizationDomain?: string;
          seniorities?: string[];
        } = {};

        // Use domain from PDL enrichment, or existing company data
        const domain = enrichedCompanyData?.domain || company.domain;
        if (domain) {
          searchParams.organizationDomain = domain;
          console.log("[Enrich Company] Searching contacts with domain:", domain);
        } else {
          searchParams.organizationName = company.name;
          console.log("[Enrich Company] No domain available, searching contacts by name:", company.name);
        }

        const people = await searchPeopleAtCompany(searchParams);
        console.log("[Enrich Company] Found", people.length, "contacts from Apollo");

        // Create employees from found contacts
        for (const person of people) {
          try {
            await db.insert(employees).values({
              orgId,
              companyId: id,
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              phone: person.phone,
              jobTitle: person.jobTitle,
              linkedinUrl: person.linkedinUrl,
              location: person.location,
              seniority: person.seniority,
              department: person.departments?.[0] || null,
              apolloId: person.apolloId,
              isShortlisted: false,
              metadata: {
                source: "apollo_enrichment",
                departments: person.departments,
                enrichedAt: new Date().toISOString(),
              },
            }).onConflictDoNothing();
            contactsFound.push(person);
          } catch (err) {
            console.error("[Enrich Company] Error creating employee:", err);
          }
        }
      } catch (error) {
        console.error("[Enrich Company] Error searching for contacts:", error);
      }
    }

    console.log("[Enrich Company] Company enriched successfully with", contactsFound.length, "employees");

    return NextResponse.json({
      success: true,
      company: updatedCompany,
      enrichedData: enrichedCompanyData,
      employeesFound: contactsFound.length,
    });
  } catch (error) {
    console.error("Error enriching company:", error);
    return NextResponse.json(
      {
        error: "Failed to enrich company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
