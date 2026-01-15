import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads, creditUsage, organizationMembers } from '@/lib/db/schema'
import { requireOrgAuth, checkMemberCredits } from '@/lib/auth'
import { eq, and, sql } from 'drizzle-orm'
import { bulkEnrichPeople } from '@/lib/apollo'
import { PLANS } from '@/lib/plans'

// POST /api/leads/[id]/fetch-phone - Fetch phone number for a specific lead
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, userId } = await requireOrgAuth()
    const { id: leadId } = await params

    // Get the lead
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, leadId), eq(leads.orgId, orgId)),
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if lead already has a phone
    if (lead.phone) {
      return NextResponse.json({
        success: true,
        phone: lead.phone,
        message: 'Lead already has a phone number',
      })
    }

    // Get Apollo ID from metadata
    const metadata = lead.metadata as Record<string, unknown> | null
    const apolloId = metadata?.apolloId as string | undefined

    if (!apolloId) {
      return NextResponse.json(
        { error: 'Lead does not have an Apollo ID for phone lookup' },
        { status: 400 }
      )
    }

    // Check member-level limits first
    const memberCheck = await checkMemberCredits(userId, orgId, 'enrichment', 1)
    if (!memberCheck.allowed) {
      return NextResponse.json(
        {
          error: memberCheck.reason,
          remaining: memberCheck.remaining,
          limitType: 'member',
        },
        { status: 402 }
      )
    }

    // Get or create org credit usage record
    let credits = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    })

    if (!credits) {
      const now = new Date()
      const cycleEnd = new Date(now)
      cycleEnd.setMonth(cycleEnd.getMonth() + 1)

      // Use plan-based defaults
      const enrichmentLimit = PLANS.free.enrichmentLimit
      const icpLimit = PLANS.free.icpLimit

      const [newCredits] = await db
        .insert(creditUsage)
        .values({
          orgId,
          enrichmentLimit,
          icpLimit,
          enrichmentUsed: 0,
          icpUsed: 0,
          billingCycleStart: now,
          billingCycleEnd: cycleEnd,
          planId: 'free',
        })
        .returning()

      credits = newCredits
    }

    // Check org-level credits
    const creditsRemaining = credits.enrichmentLimit - credits.enrichmentUsed
    if (creditsRemaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits for phone lookup', remaining: creditsRemaining },
        { status: 402 }
      )
    }

    console.log(`[Fetch Phone] Looking up phone for lead ${leadId} (Apollo ID: ${apolloId})`)

    // Get the webhook URL for phone enrichment (required by Apollo for phone reveal)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    const webhookUrl = baseUrl
      ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/webhooks/apollo/phones`
      : undefined

    if (!webhookUrl) {
      return NextResponse.json(
        { 
          error: 'Phone lookup not available', 
          details: 'NEXT_PUBLIC_APP_URL environment variable must be configured for phone lookups. Apollo requires a webhook URL to deliver phone numbers.' 
        },
        { status: 503 }
      )
    }

    // Call Apollo to get phone number
    const enrichedPeople = await bulkEnrichPeople({
      apolloIds: [apolloId],
      revealPhoneNumber: true,
      webhookUrl,
    })

    const enrichedPerson = enrichedPeople[0]

    if (enrichedPerson?.phone) {
      // Phone was returned immediately - update the lead
      await db
        .update(leads)
        .set({
          phone: enrichedPerson.phone,
          metadata: {
            ...metadata,
            phonePending: false,
            phoneFound: true,
            phoneFetchedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      // Update org and member credits
      await db
        .update(creditUsage)
        .set({
          enrichmentUsed: sql`${creditUsage.enrichmentUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(creditUsage.orgId, orgId))

      await db
        .update(organizationMembers)
        .set({
          enrichmentUsed: sql`${organizationMembers.enrichmentUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))

      console.log(`[Fetch Phone] Phone found immediately: ${enrichedPerson.phone}`)

      return NextResponse.json({
        success: true,
        phone: enrichedPerson.phone,
        message: 'Phone number found',
      })
    } else {
      // Phone will be delivered via webhook - mark as pending
      await db
        .update(leads)
        .set({
          metadata: {
            ...metadata,
            phonePending: true,
            phoneRequestedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      // Update org and member credits (charged regardless of immediate result)
      await db
        .update(creditUsage)
        .set({
          enrichmentUsed: sql`${creditUsage.enrichmentUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(creditUsage.orgId, orgId))

      await db
        .update(organizationMembers)
        .set({
          enrichmentUsed: sql`${organizationMembers.enrichmentUsed} + 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))

      console.log(`[Fetch Phone] Phone will be delivered via webhook`)

      return NextResponse.json({
        success: true,
        phone: null,
        pending: true,
        message: 'Phone lookup initiated. Will be delivered shortly.',
      })
    }
  } catch (error) {
    console.error('[Fetch Phone] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch phone number',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
