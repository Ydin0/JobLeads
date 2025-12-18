import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, leads, jobs } from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { generateOutreachPlaybook, type OutreachPlaybook } from '@/lib/openai'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/companies/[id]/outreach-playbook - Generate and cache outreach playbook
export async function POST(req: Request, { params }: RouteContext) {
    try {
        const { orgId } = await requireOrgAuth()
        const { id } = await params
        const { searchParams } = new URL(req.url)
        const regenerate = searchParams.get('regenerate') === 'true'

        // Get the company with leads and jobs
        const company = await db.query.companies.findFirst({
            where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
        })

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        // Get leads for this company
        const companyLeads = await db.query.leads.findMany({
            where: and(eq(leads.companyId, id), eq(leads.orgId, orgId)),
        })

        // Get jobs for this company
        const companyJobs = await db.query.jobs.findMany({
            where: and(eq(jobs.companyId, id), eq(jobs.orgId, orgId)),
        })

        // Check cache unless regenerating
        const metadata = (company.metadata as Record<string, unknown>) || {}
        if (!regenerate && metadata.outreachPlaybook) {
            console.log('[Outreach Playbook] Returning cached playbook for:', company.name)
            return NextResponse.json({
                playbook: metadata.outreachPlaybook as OutreachPlaybook,
                cached: true,
                generatedAt: metadata.outreachPlaybookGeneratedAt,
            })
        }

        console.log('[Outreach Playbook] Generating new playbook for:', company.name)

        // Generate new playbook
        const playbook = await generateOutreachPlaybook(
            {
                name: company.name,
                industry: company.industry,
                size: company.size,
                location: company.location,
                description: company.description,
                domain: company.domain,
            },
            companyLeads.map((l) => ({
                firstName: l.firstName,
                lastName: l.lastName,
                jobTitle: l.jobTitle,
            })),
            companyJobs.map((j) => ({
                title: j.title,
                department: j.department,
            }))
        )

        const generatedAt = new Date().toISOString()

        // Cache in metadata
        await db
            .update(companies)
            .set({
                metadata: {
                    ...metadata,
                    outreachPlaybook: playbook,
                    outreachPlaybookGeneratedAt: generatedAt,
                },
                updatedAt: new Date(),
            })
            .where(eq(companies.id, id))

        console.log('[Outreach Playbook] Generated and cached playbook for:', company.name)

        return NextResponse.json({
            playbook,
            cached: false,
            generatedAt,
        })
    } catch (error) {
        console.error('[Outreach Playbook] Error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate outreach playbook',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

// GET /api/companies/[id]/outreach-playbook - Get cached outreach playbook
export async function GET(req: Request, { params }: RouteContext) {
    try {
        const { orgId } = await requireOrgAuth()
        const { id } = await params

        const company = await db.query.companies.findFirst({
            where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
        })

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 })
        }

        const metadata = (company.metadata as Record<string, unknown>) || {}

        if (metadata.outreachPlaybook) {
            return NextResponse.json({
                playbook: metadata.outreachPlaybook as OutreachPlaybook,
                cached: true,
                generatedAt: metadata.outreachPlaybookGeneratedAt,
            })
        }

        return NextResponse.json({
            playbook: null,
            cached: false,
            generatedAt: null,
        })
    } catch (error) {
        console.error('[Outreach Playbook] Error fetching:', error)
        return NextResponse.json(
            { error: 'Failed to fetch outreach playbook' },
            { status: 500 }
        )
    }
}
