import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, employees } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { searchPeopleAtCompany, EnrichedPerson } from "@/lib/apollo";
import { enrichCompanyWithPDL } from "@/lib/pdl";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/companies/[id]/enrich - Enrich a company using PDL and find contacts using Apollo
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Get options from request body
    const body = await req.json().catch(() => ({}));
    const { findContacts = true, seniorities, departments } = body;

    // Get the company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    console.log("[Enrich Company] Enriching company:", company.name);

    let enrichedCompanyData = null;
    const contactsFound: EnrichedPerson[] = [];

    // Enrich company using People Data Labs
    // Try LinkedIn URL first, then website, then name
    try {
      enrichedCompanyData = await enrichCompanyWithPDL({
        linkedinUrl: company.linkedinUrl || undefined,
        website: company.websiteUrl || company.domain || undefined,
        name: company.name,
      });
      console.log("[Enrich Company] PDL enrichment result:", enrichedCompanyData);
    } catch (error) {
      console.error("[Enrich Company] Error enriching with PDL:", error);
    }

    // Update company with enriched data
    const updateData: Record<string, unknown> = {
      isEnriched: true,
      enrichedAt: new Date(),
      updatedAt: new Date(),
    };

    if (enrichedCompanyData) {
      if (enrichedCompanyData.domain) updateData.domain = enrichedCompanyData.domain;
      if (enrichedCompanyData.website) updateData.websiteUrl = enrichedCompanyData.website;
      if (enrichedCompanyData.linkedinUrl) updateData.linkedinUrl = enrichedCompanyData.linkedinUrl;
      if (enrichedCompanyData.industry) updateData.industry = enrichedCompanyData.industry;
      if (enrichedCompanyData.location) updateData.location = enrichedCompanyData.location;
      if (enrichedCompanyData.description) updateData.description = enrichedCompanyData.description;
      if (enrichedCompanyData.size) {
        updateData.size = enrichedCompanyData.size;
      } else if (enrichedCompanyData.employeeCount) {
        updateData.size = `${enrichedCompanyData.employeeCount} employees`;
      }
      updateData.metadata = {
        ...(company.metadata as Record<string, unknown> || {}),
        enrichmentSource: "pdl",
        foundedYear: enrichedCompanyData.foundedYear,
        companyType: enrichedCompanyData.type,
        tags: enrichedCompanyData.tags,
        facebookUrl: enrichedCompanyData.facebookUrl,
        twitterUrl: enrichedCompanyData.twitterUrl,
      };
    }

    const [updatedCompany] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();

    // Find contacts at this company if requested (using Apollo)
    if (findContacts) {
      try {
        const searchParams: {
          organizationName?: string;
          organizationDomain?: string;
          seniorities?: string[];
          departments?: string[];
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

        if (seniorities && seniorities.length > 0) {
          searchParams.seniorities = seniorities;
          console.log("[Enrich Company] Filtering by seniorities:", seniorities);
        }

        if (departments && departments.length > 0) {
          searchParams.departments = departments;
          console.log("[Enrich Company] Filtering by departments:", departments);
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
