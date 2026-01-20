import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads, creditUsage, organizationMembers } from '@/lib/db/schema'
import { requireOrgAuth, checkMemberCredits } from '@/lib/auth'
import { eq, and, sql } from 'drizzle-orm'
import {
  bulkEnrichPeople,
  enrichPersonWithCache,
  getPhoneWithCache,
  storePhoneInCache,
} from '@/lib/apollo'

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

    // CHECK CACHE FIRST - This saves credits!
    console.log(`[Fetch Phone] Checking cache for Apollo ID: ${apolloId}`)
    const cachedPhone = await getPhoneWithCache(apolloId)
    if (cachedPhone) {
      console.log(`[Fetch Phone] CACHE HIT - Phone found in cache: ${cachedPhone}`)

      // Update lead with cached phone (no credits charged!)
      await db
        .update(leads)
        .set({
          phone: cachedPhone,
          metadata: {
            ...metadata,
            phonePending: false,
            phoneFound: true,
            phoneFetchedAt: new Date().toISOString(),
            phoneSource: 'cache',
          },
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      return NextResponse.json({
        success: true,
        phone: cachedPhone,
        message: 'Phone number found (from cache - no credits used)',
        creditsSaved: 1,
      })
    }

    console.log(`[Fetch Phone] Cache miss - will call Apollo API`)

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

      const [newCredits] = await db
        .insert(creditUsage)
        .values({
          orgId,
          enrichmentLimit: 200,
          icpLimit: 1000,
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

    // Try direct enrichment first using /people/match (returns phone immediately if available)
    let phone: string | null = null
    let companyPhone: string | null = lead.companyPhone || null // Keep existing company phone if any
    let phoneFromCache = false // Track if phone came from cache (don't charge credits)
    let apiCallMade = false // Track if any Apollo API call was made

    // Try to get phone via direct person match using LinkedIn URL or name
    // Uses caching to save credits on repeated lookups
    if (lead.linkedinUrl || (lead.firstName && lead.lastName)) {
      console.log('[Fetch Phone] Trying enrichment with cache via /people/match...')
      try {
        const enrichResult = await enrichPersonWithCache({
          linkedinUrl: lead.linkedinUrl || undefined,
          firstName: lead.firstName,
          lastName: lead.lastName,
        })

        // Track if API was called (for credit charging)
        if (!enrichResult.fromCache) {
          apiCallMade = true
          console.log(`[Fetch Phone] Apollo API called (will charge 1 credit)`)
        } else {
          console.log(`[Fetch Phone] Data from cache (${enrichResult.source}) - no credits used`)
        }

        if (enrichResult.person?.phone) {
          phone = enrichResult.person.phone
          phoneFromCache = enrichResult.fromCache
          console.log(`[Fetch Phone] Personal phone found via enrichment: ${phone} (from ${enrichResult.fromCache ? 'cache' : 'API'})`)
          // Store in cache for future lookups by apolloId
          if (apolloId) {
            await storePhoneInCache(apolloId, phone)
          }
        }
        // Capture company phone for storage (even if not returned to user)
        if (enrichResult.person?.companyPhone && !companyPhone) {
          companyPhone = enrichResult.person.companyPhone
          console.log(`[Fetch Phone] Company phone captured: ${companyPhone}`)
        }
      } catch (err) {
        console.log('[Fetch Phone] Direct enrichment failed, trying bulk_match...')
      }
    }

    // If direct enrichment didn't return phone, try bulk_match with webhook
    if (!phone) {
      const baseUrl = process.env.APOLLO_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      const webhookUrl = baseUrl
        ? baseUrl.includes('/api/webhooks/apollo/phones')
          ? baseUrl
          : `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/webhooks/apollo/phones`
        : undefined

      // Local development fallback - detect when webhooks won't work
      const isDevelopment = process.env.NODE_ENV === 'development'
      const isLocalWebhook = webhookUrl && (
        webhookUrl.includes('localhost') ||
        webhookUrl.includes('127.0.0.1') ||
        webhookUrl.includes('.ngrok') ||
        webhookUrl.includes('.localtunnel')
      )
      const webhookWontWork = isDevelopment && webhookUrl && !isLocalWebhook

      if (!webhookUrl) {
        console.log('[Fetch Phone] No webhook URL configured - cannot request phone reveal')
      } else if (webhookWontWork) {
        console.warn('[Fetch Phone] ⚠️  LOCAL DEV WARNING: Webhook URL points to production!')
        console.warn(`[Fetch Phone] Webhook URL: ${webhookUrl}`)
        console.warn('[Fetch Phone] Apollo will send phone data to production, not your local server.')
        console.warn('[Fetch Phone] To fix: Set APOLLO_WEBHOOK_URL to a tunnel URL (ngrok, localtunnel) in .env.local')
        console.warn('[Fetch Phone] Example: APOLLO_WEBHOOK_URL=https://your-subdomain.ngrok.io/api/webhooks/apollo/phones')

        // Still try the request - direct enrichment might have worked, or phone might be in response
        console.log(`[Fetch Phone] Attempting bulk_match anyway (phone may be returned directly)...`)
        const enrichedPeople = await bulkEnrichPeople({
          apolloIds: [apolloId],
          revealPhoneNumber: true,
          webhookUrl,
        })
        apiCallMade = true // bulk_match always calls Apollo API
        if (enrichedPeople[0]?.phone) {
          phone = enrichedPeople[0].phone
          console.log(`[Fetch Phone] Personal phone found via bulk_match: ${phone}`)
          // Cache for future lookups
          await storePhoneInCache(apolloId, phone)
        }
        // Capture company phone from bulk_match
        if (enrichedPeople[0]?.companyPhone && !companyPhone) {
          companyPhone = enrichedPeople[0].companyPhone
          console.log(`[Fetch Phone] Company phone captured from bulk_match: ${companyPhone}`)
        }
        // If no personal phone and webhook won't work locally, return warning
        if (!phone) {
          // Still store company phone if found before returning
          if (companyPhone && companyPhone !== lead.companyPhone) {
            await db
              .update(leads)
              .set({ companyPhone, updatedAt: new Date() })
              .where(eq(leads.id, leadId))
          }
          return NextResponse.json({
            success: false,
            phone: null,
            localDevWarning: true,
            message: 'Phone lookup requires webhook, but webhook URL points to production. Set APOLLO_WEBHOOK_URL to a tunnel URL (e.g., ngrok) in .env.local for local development.',
          }, { status: 200 })
        }
      } else {
        console.log(`[Fetch Phone] Trying bulk_match with webhook: ${webhookUrl}`)
        const enrichedPeople = await bulkEnrichPeople({
          apolloIds: [apolloId],
          revealPhoneNumber: true,
          webhookUrl,
        })
        apiCallMade = true // bulk_match always calls Apollo API
        if (enrichedPeople[0]?.phone) {
          phone = enrichedPeople[0].phone
          console.log(`[Fetch Phone] Personal phone found via bulk_match: ${phone}`)
          // Cache for future lookups
          await storePhoneInCache(apolloId, phone)
        }
        // Capture company phone from bulk_match
        if (enrichedPeople[0]?.companyPhone && !companyPhone) {
          companyPhone = enrichedPeople[0].companyPhone
          console.log(`[Fetch Phone] Company phone captured from bulk_match: ${companyPhone}`)
        }
      }
    }

    // Only return personal phone - but store both personal and company phone
    if (phone) {
      // Personal phone was found - update the lead with both phones
      await db
        .update(leads)
        .set({
          phone: phone, // Personal phone (displayed via Get Phone)
          ...(companyPhone && companyPhone !== lead.companyPhone ? { companyPhone } : {}), // Company phone (displayed on card)
          metadata: {
            ...metadata,
            phonePending: false,
            phoneFound: true,
            phoneFetchedAt: new Date().toISOString(),
            phoneSource: phoneFromCache ? 'cache' : 'api',
          },
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      // Only charge credits if Apollo API was actually called
      if (apiCallMade) {
        console.log(`[Fetch Phone] Charging 1 credit (API was called)`)
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
      } else {
        console.log(`[Fetch Phone] No credits charged (phone from cache)`)
      }

      console.log(`[Fetch Phone] Personal phone found: ${phone}`)

      return NextResponse.json({
        success: true,
        phone: phone,
        message: phoneFromCache ? 'Personal phone number found (from cache - no credits used)' : 'Personal phone number found',
        ...(phoneFromCache ? { creditsSaved: 1 } : {}),
      })
    } else {
      // Personal phone will be delivered via webhook - mark as pending
      // But store company phone if we found one
      await db
        .update(leads)
        .set({
          ...(companyPhone && companyPhone !== lead.companyPhone ? { companyPhone } : {}), // Store company phone if found
          metadata: {
            ...metadata,
            phonePending: true,
            phoneRequestedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      // Only charge credits if Apollo API was actually called
      if (apiCallMade) {
        console.log(`[Fetch Phone] Charging 1 credit (API was called for pending phone)`)
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
      }

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
