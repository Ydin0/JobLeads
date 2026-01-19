import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrgAuth } from "@/lib/auth";
import { aiSuggestions, companies, leads, searches, jobs, creditUsage } from "@/lib/db/schema";
import { eq, and, sql, desc, isNotNull, count } from "drizzle-orm";
import {
  generateRuleBasedSuggestions,
  generateAISuggestions,
  generateContextHash,
  isCacheStale,
  type DashboardContext,
  type DashboardSuggestion,
} from "@/lib/ai-suggestions";

const RATE_LIMIT_PER_DAY = 5;
const CACHE_TTL_HOURS = 24;

/**
 * Build dashboard context from database
 */
async function buildDashboardContext(orgId: string): Promise<DashboardContext> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch all data in parallel
  const [
    companyStats,
    leadStats,
    icpStats,
    jobStats,
    credits,
  ] = await Promise.all([
    // Company stats
    db.select({
      total: count(),
      enriched: count(sql`CASE WHEN ${companies.isEnriched} = true THEN 1 END`),
      recentlyAdded: count(sql`CASE WHEN ${companies.createdAt} >= ${sevenDaysAgo} THEN 1 END`),
    })
      .from(companies)
      .where(eq(companies.orgId, orgId)),

    // Lead stats
    db.select({
      total: count(),
      recentlyAdded: count(sql`CASE WHEN ${leads.createdAt} >= ${sevenDaysAgo} THEN 1 END`),
      withEmail: count(sql`CASE WHEN ${leads.email} IS NOT NULL THEN 1 END`),
      withPhone: count(sql`CASE WHEN ${leads.phone} IS NOT NULL THEN 1 END`),
    })
      .from(leads)
      .where(eq(leads.orgId, orgId)),

    // ICP stats
    db.select({
      total: count(),
      active: count(sql`CASE WHEN ${searches.status} = 'active' THEN 1 END`),
      stale: count(sql`CASE WHEN ${searches.lastRunAt} < ${sevenDaysAgo} OR ${searches.lastRunAt} IS NULL THEN 1 END`),
    })
      .from(searches)
      .where(eq(searches.orgId, orgId)),

    // Job stats
    db.select({
      total: count(),
      recentJobs: count(sql`CASE WHEN ${jobs.createdAt} >= ${sevenDaysAgo} THEN 1 END`),
    })
      .from(jobs)
      .where(eq(jobs.orgId, orgId)),

    // Credits
    db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    }),
  ]);

  // Get top industries
  const topIndustries = await db
    .select({
      industry: companies.industry,
      count: count(),
    })
    .from(companies)
    .where(and(eq(companies.orgId, orgId), isNotNull(companies.industry)))
    .groupBy(companies.industry)
    .orderBy(desc(count()))
    .limit(5);

  // Get companies with high hiring activity
  const highHiringCompanies = await db
    .select({ count: count() })
    .from(companies)
    .where(
      and(
        eq(companies.orgId, orgId),
        sql`(${companies.metadata}->>'jobCount')::int >= 5`
      )
    );

  // Get lead status breakdown
  const leadsByStatus = await db
    .select({
      status: leads.status,
      count: count(),
    })
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .groupBy(leads.status);

  // Get top departments from jobs
  const topDepartments = await db
    .select({
      department: jobs.department,
      count: count(),
    })
    .from(jobs)
    .where(and(eq(jobs.orgId, orgId), isNotNull(jobs.department)))
    .groupBy(jobs.department)
    .orderBy(desc(count()))
    .limit(5);

  // Get top performing ICP
  const topIcp = await db.query.searches.findFirst({
    where: eq(searches.orgId, orgId),
    orderBy: desc(searches.resultsCount),
  });

  const companyData = companyStats[0] || { total: 0, enriched: 0, recentlyAdded: 0 };
  const leadData = leadStats[0] || { total: 0, recentlyAdded: 0, withEmail: 0, withPhone: 0 };
  const icpData = icpStats[0] || { total: 0, active: 0, stale: 0 };
  const jobData = jobStats[0] || { total: 0, recentJobs: 0 };

  return {
    companies: {
      total: Number(companyData.total),
      enriched: Number(companyData.enriched),
      unenriched: Number(companyData.total) - Number(companyData.enriched),
      topIndustries: topIndustries
        .filter(i => i.industry)
        .map(i => ({ industry: i.industry!, count: Number(i.count) })),
      recentlyAdded: Number(companyData.recentlyAdded),
      withHighHiringActivity: Number(highHiringCompanies[0]?.count || 0),
    },
    leads: {
      total: Number(leadData.total),
      byStatus: leadsByStatus.map(s => ({ status: s.status, count: Number(s.count) })),
      recentlyAdded: Number(leadData.recentlyAdded),
      withEmail: Number(leadData.withEmail),
      withPhone: Number(leadData.withPhone),
    },
    icps: {
      total: Number(icpData.total),
      active: Number(icpData.active),
      stale: Number(icpData.stale),
      topPerforming: topIcp ? { name: topIcp.name, resultsCount: topIcp.resultsCount || 0 } : undefined,
    },
    credits: {
      enrichmentRemaining: credits ? credits.enrichmentLimit - credits.enrichmentUsed : 200,
      enrichmentLimit: credits?.enrichmentLimit || 200,
      icpRemaining: credits ? credits.icpLimit - credits.icpUsed : 1000,
      icpLimit: credits?.icpLimit || 1000,
    },
    jobs: {
      total: Number(jobData.total),
      topDepartments: topDepartments
        .filter(d => d.department)
        .map(d => ({ department: d.department!, count: Number(d.count) })),
      recentJobs: Number(jobData.recentJobs),
    },
  };
}

// GET /api/dashboard/suggestions - Get combined suggestions
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    // Build context
    const context = await buildDashboardContext(orgId);

    // Generate rule-based suggestions (always fresh)
    const ruleSuggestions = generateRuleBasedSuggestions(context);

    // Check for cached AI suggestions
    const cached = await db.query.aiSuggestions.findFirst({
      where: and(
        eq(aiSuggestions.orgId, orgId),
        eq(aiSuggestions.type, "dashboard")
      ),
    });

    const currentHash = generateContextHash(context);
    const isStale = isCacheStale(
      cached?.generatedAt || null,
      cached?.dataHash || null,
      currentHash,
      CACHE_TTL_HOURS
    );

    // Calculate refreshes remaining today
    let refreshesRemaining = RATE_LIMIT_PER_DAY;
    if (cached) {
      const resetAt = cached.refreshCountResetAt;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (resetAt && resetAt >= todayStart) {
        refreshesRemaining = Math.max(0, RATE_LIMIT_PER_DAY - cached.refreshCount);
      }
    }

    return NextResponse.json({
      rules: ruleSuggestions,
      ai: {
        suggestions: (cached?.suggestions || []) as DashboardSuggestion[],
        generatedAt: cached?.generatedAt?.toISOString() || null,
        isStale,
        refreshesRemaining,
      },
      context: {
        companiesTotal: context.companies.total,
        leadsTotal: context.leads.total,
        icpsTotal: context.icps.total,
      },
    });
  } catch (error) {
    console.error("[Dashboard Suggestions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST /api/dashboard/suggestions - Regenerate AI suggestions
export async function POST() {
  try {
    const { orgId } = await requireOrgAuth();

    // Check rate limit
    const cached = await db.query.aiSuggestions.findFirst({
      where: and(
        eq(aiSuggestions.orgId, orgId),
        eq(aiSuggestions.type, "dashboard")
      ),
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentRefreshCount = 0;
    if (cached?.refreshCountResetAt && cached.refreshCountResetAt >= todayStart) {
      currentRefreshCount = cached.refreshCount;
    }

    if (currentRefreshCount >= RATE_LIMIT_PER_DAY) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `You've used all ${RATE_LIMIT_PER_DAY} AI refreshes for today. Try again tomorrow.`,
          refreshesRemaining: 0,
        },
        { status: 429 }
      );
    }

    // Build context and generate AI suggestions
    const context = await buildDashboardContext(orgId);
    const aiSuggestionsList = await generateAISuggestions(context);
    const currentHash = generateContextHash(context);

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

    // Upsert cache
    if (cached) {
      await db
        .update(aiSuggestions)
        .set({
          suggestions: aiSuggestionsList,
          dataHash: currentHash,
          generatedAt: now,
          expiresAt,
          refreshCount: currentRefreshCount + 1,
          refreshCountResetAt: todayStart,
          updatedAt: now,
        })
        .where(eq(aiSuggestions.id, cached.id));
    } else {
      await db.insert(aiSuggestions).values({
        orgId,
        type: "dashboard",
        suggestions: aiSuggestionsList,
        dataHash: currentHash,
        generatedAt: now,
        expiresAt,
        refreshCount: 1,
        refreshCountResetAt: todayStart,
      });
    }

    // Also return rule-based suggestions
    const ruleSuggestions = generateRuleBasedSuggestions(context);

    return NextResponse.json({
      rules: ruleSuggestions,
      ai: {
        suggestions: aiSuggestionsList,
        generatedAt: now.toISOString(),
        isStale: false,
        refreshesRemaining: RATE_LIMIT_PER_DAY - (currentRefreshCount + 1),
      },
      context: {
        companiesTotal: context.companies.total,
        leadsTotal: context.leads.total,
        icpsTotal: context.icps.total,
      },
    });
  } catch (error) {
    console.error("[Dashboard Suggestions] Error regenerating:", error);
    return NextResponse.json(
      { error: "Failed to regenerate suggestions" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
