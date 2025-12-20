// AI-powered dashboard suggestions generator
// Combines rule-based instant suggestions with LLM-generated insights

import { createHash } from 'crypto'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-5-mini'

// Suggestion types
export interface DashboardSuggestion {
  type: 'action' | 'insight' | 'tip' | 'warning'
  priority: 'high' | 'normal'
  title: string
  description: string
  action?: { label: string; href: string }
  aiGenerated: boolean
}

// Context for generating suggestions
export interface DashboardContext {
  companies: {
    total: number
    enriched: number
    unenriched: number
    topIndustries: { industry: string; count: number }[]
    recentlyAdded: number // last 7 days
    withHighHiringActivity: number // companies with 5+ jobs
  }
  leads: {
    total: number
    byStatus: { status: string; count: number }[]
    recentlyAdded: number // last 7 days
    withEmail: number
    withPhone: number
  }
  icps: {
    total: number
    active: number
    stale: number // lastRunAt > 7 days
    topPerforming?: { name: string; resultsCount: number }
  }
  credits: {
    enrichmentRemaining: number
    enrichmentLimit: number
    icpRemaining: number
    icpLimit: number
  }
  jobs: {
    total: number
    topDepartments: { department: string; count: number }[]
    recentJobs: number // last 7 days
  }
}

// System prompt for AI suggestions
const DASHBOARD_SUGGESTIONS_PROMPT = `You are an AI sales intelligence assistant helping users prioritize their lead generation activities. Based on the provided dashboard data, generate 2-4 actionable insights that will help the user:

1. Focus on the highest-value opportunities
2. Optimize their ICP strategy
3. Act on timing signals (recent hires, growth patterns)
4. Improve their pipeline efficiency

Output JSON matching this exact structure:
{
  "suggestions": [
    {
      "type": "action" | "insight" | "tip",
      "priority": "high" | "normal",
      "title": "Brief, actionable title (max 50 chars)",
      "description": "Specific, data-backed insight with numbers from the data provided (1-2 sentences)",
      "actionLabel": "Button label if applicable (e.g., 'View companies', 'Run ICP')",
      "actionHref": "Dashboard path (e.g., '/dashboard/companies', '/dashboard/icps/new')"
    }
  ]
}

Guidelines:
- Reference specific numbers from the data
- Prioritize insights about timing (recent activity, growth signals)
- Suggest specific actions based on the user's current state
- Don't repeat obvious things like "you have X companies"
- Focus on WHAT TO DO NEXT, not just what exists
- If data shows strong hiring signals, highlight urgency
- If pipeline is thin, suggest expansion strategies`

/**
 * Generate rule-based suggestions (instant, no API call)
 */
export function generateRuleBasedSuggestions(context: DashboardContext): DashboardSuggestion[] {
  const suggestions: DashboardSuggestion[] = []

  // Credit warnings (highest priority)
  if (context.credits.enrichmentRemaining < 20) {
    suggestions.push({
      type: 'warning',
      priority: 'high',
      title: 'Low enrichment credits',
      description: `Only ${context.credits.enrichmentRemaining} enrichment credits remaining. Upgrade to continue enriching contacts.`,
      action: { label: 'Upgrade plan', href: '/dashboard/settings' },
      aiGenerated: false,
    })
  }

  if (context.credits.icpRemaining < 100) {
    suggestions.push({
      type: 'warning',
      priority: 'high',
      title: 'Low ICP credits',
      description: `Only ${context.credits.icpRemaining} ICP credits remaining. Upgrade to find more companies.`,
      action: { label: 'Upgrade plan', href: '/dashboard/settings' },
      aiGenerated: false,
    })
  }

  // No ICPs created yet
  if (context.icps.total === 0) {
    suggestions.push({
      type: 'action',
      priority: 'high',
      title: 'Create your first ICP',
      description: 'Define your ideal customer profile to start finding companies that match your target market.',
      action: { label: 'Create ICP', href: '/dashboard/icps/new' },
      aiGenerated: false,
    })
  }

  // Unenriched companies available
  if (context.companies.unenriched > 5 && context.credits.enrichmentRemaining > 10) {
    suggestions.push({
      type: 'action',
      priority: 'high',
      title: `Enrich ${context.companies.unenriched} companies`,
      description: `${context.companies.unenriched} companies have hiring signals but no contact data yet. Enrich to find decision-makers.`,
      action: { label: 'View companies', href: '/dashboard/companies' },
      aiGenerated: false,
    })
  }

  // Stale ICPs
  if (context.icps.stale > 0) {
    suggestions.push({
      type: 'tip',
      priority: 'normal',
      title: `${context.icps.stale} ICP${context.icps.stale > 1 ? 's' : ''} need refresh`,
      description: `Some ICPs haven't been run in over 7 days. Re-run to catch new companies.`,
      action: { label: 'View ICPs', href: '/dashboard/icps' },
      aiGenerated: false,
    })
  }

  // Low lead count
  if (context.leads.total > 0 && context.leads.total < 20) {
    suggestions.push({
      type: 'tip',
      priority: 'normal',
      title: 'Build your contact pipeline',
      description: `You have ${context.leads.total} contacts. Aim for 50+ contacts per ICP for effective outreach.`,
      action: { label: 'Find contacts', href: '/dashboard/people' },
      aiGenerated: false,
    })
  }

  // Low enrichment percentage
  if (context.companies.total > 10) {
    const enrichedPercent = Math.round((context.companies.enriched / context.companies.total) * 100)
    if (enrichedPercent < 30) {
      suggestions.push({
        type: 'insight',
        priority: 'normal',
        title: `Only ${enrichedPercent}% of companies enriched`,
        description: 'Enriching more companies reveals decision-maker contacts and increases outreach opportunities.',
        action: { label: 'Enrich companies', href: '/dashboard/companies' },
        aiGenerated: false,
      })
    }
  }

  // Sort by priority
  return suggestions.sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1))
}

/**
 * Build user prompt for AI suggestions
 */
function buildSuggestionsPrompt(context: DashboardContext): string {
  const sections: string[] = []

  // Companies overview
  sections.push(`## Companies (${context.companies.total} total)
- Enriched: ${context.companies.enriched} (${context.companies.total > 0 ? Math.round((context.companies.enriched / context.companies.total) * 100) : 0}%)
- Unenriched: ${context.companies.unenriched}
- Recently added (7d): ${context.companies.recentlyAdded}
- High hiring activity (5+ jobs): ${context.companies.withHighHiringActivity}
${context.companies.topIndustries.length > 0 ? `- Top industries: ${context.companies.topIndustries.slice(0, 3).map(i => `${i.industry} (${i.count})`).join(', ')}` : ''}`)

  // Leads overview
  sections.push(`## Leads (${context.leads.total} total)
- Recently added (7d): ${context.leads.recentlyAdded}
- With email: ${context.leads.withEmail}
- With phone: ${context.leads.withPhone}
${context.leads.byStatus.length > 0 ? `- By status: ${context.leads.byStatus.map(s => `${s.status} (${s.count})`).join(', ')}` : ''}`)

  // ICPs overview
  sections.push(`## ICPs (${context.icps.total} total)
- Active: ${context.icps.active}
- Stale (>7d): ${context.icps.stale}
${context.icps.topPerforming ? `- Top performing: "${context.icps.topPerforming.name}" with ${context.icps.topPerforming.resultsCount} companies` : ''}`)

  // Jobs/Hiring activity
  sections.push(`## Hiring Signals (${context.jobs.total} jobs tracked)
- Recent jobs (7d): ${context.jobs.recentJobs}
${context.jobs.topDepartments.length > 0 ? `- Hot departments: ${context.jobs.topDepartments.slice(0, 3).map(d => `${d.department} (${d.count})`).join(', ')}` : ''}`)

  // Credits
  sections.push(`## Credits
- Enrichment: ${context.credits.enrichmentRemaining}/${context.credits.enrichmentLimit} remaining
- ICP: ${context.credits.icpRemaining}/${context.credits.icpLimit} remaining`)

  return sections.join('\n\n')
}

/**
 * Call OpenAI API for AI suggestions
 */
async function callOpenAI(userPrompt: string): Promise<DashboardSuggestion[]> {
  if (!OPENAI_API_KEY) {
    console.log('[AI Suggestions] OpenAI API key not configured, skipping AI generation')
    return []
  }

  try {
    console.log('[AI Suggestions] Generating AI insights...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: DASHBOARD_SUGGESTIONS_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AI Suggestions] API error:', response.status, errorText)
      return []
    }

    const data = await response.json()
    console.log('[AI Suggestions] Response data:', JSON.stringify(data, null, 2))

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error('[AI Suggestions] No content in response. Full response:', JSON.stringify(data))
      return []
    }

    console.log('[AI Suggestions] Content:', content)

    const parsed = JSON.parse(content)
    const suggestions = parsed.suggestions || []

    // Map to our format and mark as AI-generated
    return suggestions.map((s: {
      type?: string
      priority?: string
      title?: string
      description?: string
      actionLabel?: string
      actionHref?: string
    }) => ({
      type: s.type || 'insight',
      priority: s.priority || 'normal',
      title: s.title || 'Insight',
      description: s.description || '',
      action: s.actionLabel && s.actionHref
        ? { label: s.actionLabel, href: s.actionHref }
        : undefined,
      aiGenerated: true,
    })) as DashboardSuggestion[]
  } catch (error) {
    console.error('[AI Suggestions] Error generating AI suggestions:', error)
    return []
  }
}

/**
 * Generate AI-powered suggestions (calls OpenAI)
 */
export async function generateAISuggestions(context: DashboardContext): Promise<DashboardSuggestion[]> {
  const userPrompt = buildSuggestionsPrompt(context)
  return callOpenAI(userPrompt)
}

/**
 * Generate a hash of the context for staleness detection
 */
export function generateContextHash(context: DashboardContext): string {
  // Create a simplified version for hashing (significant changes only)
  const hashInput = {
    companyCount: Math.floor(context.companies.total / 10) * 10, // Round to nearest 10
    leadCount: Math.floor(context.leads.total / 10) * 10,
    icpCount: context.icps.total,
    enrichedPercent: Math.floor((context.companies.enriched / Math.max(context.companies.total, 1)) * 10) * 10,
  }

  return createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex')
    .substring(0, 16)
}

/**
 * Check if cached suggestions are stale
 */
export function isCacheStale(
  generatedAt: Date | null,
  cachedHash: string | null,
  currentHash: string,
  ttlHours: number = 24
): boolean {
  // No cache exists
  if (!generatedAt) return true

  // Hash mismatch (data changed significantly)
  if (cachedHash !== currentHash) return true

  // TTL expired
  const now = new Date()
  const age = now.getTime() - new Date(generatedAt).getTime()
  const ttlMs = ttlHours * 60 * 60 * 1000

  return age > ttlMs
}
