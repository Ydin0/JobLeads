import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, leads, jobs } from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { generateAIInsights, type AIInsights } from '@/lib/openai'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/companies/[id]/ai-insights - Generate and cache AI insights
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
        if (!regenerate && metadata.aiInsights) {
            console.log('[AI Insights] Returning cached insights for:', company.name)
            return NextResponse.json({
                insights: metadata.aiInsights as AIInsights,
                cached: true,
                generatedAt: metadata.aiInsightsGeneratedAt,
            })
        }

        console.log('[AI Insights] Generating new insights for:', company.name)

        // Generate new insights
        const insights = await generateAIInsights(
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
                    aiInsights: insights,
                    aiInsightsGeneratedAt: generatedAt,
                },
                updatedAt: new Date(),
            })
            .where(eq(companies.id, id))

        console.log('[AI Insights] Generated and cached insights for:', company.name)

        return NextResponse.json({
            insights,
            cached: false,
            generatedAt,
        })
    } catch (error) {
        console.error('[AI Insights] Error:', error)
        return NextResponse.json(
            {
                error: 'Failed to generate AI insights',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}

// GET /api/companies/[id]/ai-insights - Get cached AI insights
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

        if (metadata.aiInsights) {
            return NextResponse.json({
                insights: metadata.aiInsights as AIInsights,
                cached: true,
                generatedAt: metadata.aiInsightsGeneratedAt,
            })
        }

        return NextResponse.json({
            insights: null,
            cached: false,
            generatedAt: null,
        })
    } catch (error) {
        console.error('[AI Insights] Error fetching:', error)
        return NextResponse.json(
            { error: 'Failed to fetch AI insights' },
            { status: 500 }
        )
    }
}
