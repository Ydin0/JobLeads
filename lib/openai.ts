// OpenAI API integration for AI-generated sales insights and outreach content

import type { AIInsights, OutreachPlaybook } from './mock-ai-content'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-5-mini'

// Re-export types for convenience
export type { AIInsights, OutreachPlaybook }

// ICP generation types
export interface ICPSuggestion {
    name: string
    departments: string[]
    jobTitles: string[]
    techStack: string[]
    minJobs: number
    decisionMakers: string[]
    reasoning: string
    suggestedScrapers: {
        jobTitle: string
        locations: string[]
    }[]
}

// Input types for AI generation
export interface CompanyContext {
    name: string
    industry?: string | null
    size?: string | null
    location?: string | null
    description?: string | null
    domain?: string | null
}

export interface LeadContext {
    firstName: string
    lastName: string
    jobTitle?: string | null
}

export interface JobContext {
    title: string
    department?: string | null
}

// System prompts for AI generation
const INSIGHTS_SYSTEM_PROMPT = `You are an expert B2B sales intelligence analyst specializing in identifying actionable insights for sales teams. Analyze the provided company data and generate insights that help sales representatives:

1. Understand the company's current state and priorities
2. Identify the best decision-makers to contact
3. Recognize timing signals that indicate readiness to buy
4. Understand competitive positioning

Output your analysis as JSON matching this exact structure:
{
  "companyFacts": ["string array of 3-5 key facts about the company based on the data provided"],
  "decisionMakerInsights": ["string array analyzing each contact's likely role, influence, and how to approach them"],
  "timingSignals": ["string array of 2-4 timing-related insights based on hiring activity and company context"],
  "competitiveIntel": "single paragraph about competitive positioning and recommended approach angle"
}

Be specific, actionable, and reference the actual data provided. Avoid generic statements. If data is limited, make reasonable inferences based on industry and company size.`

const PLAYBOOK_SYSTEM_PROMPT = `You are an expert B2B sales copywriter who creates personalized, high-converting outreach content. Based on the provided company and contact data, generate a complete outreach playbook.

Guidelines:
- Be conversational but professional
- Reference specific company details (hiring activity, industry, size)
- Include natural pauses and response handling in call scripts
- Keep emails concise (under 150 words for initial)
- Address common objections authentically
- Make the content feel personalized, not templated

Output as JSON matching this exact structure:
{
  "coldCallScript": "full script with [PAUSE] markers for responses and branching paths for different responses",
  "emailTemplates": {
    "initial": "Subject: [compelling subject line]\\n\\n[email body - concise, value-focused]",
    "followUp": "Subject: Re: [reference previous]\\n\\n[shorter follow-up]",
    "breakup": "Subject: [closing subject]\\n\\n[final attempt with clear CTA or graceful exit]"
  },
  "objectionHandlers": [
    {"objection": "We're not interested right now", "response": "response that acknowledges and pivots"},
    {"objection": "Send me some information", "response": "response that qualifies before sending"},
    {"objection": "We don't have budget", "response": "response that explores timing and value"},
    {"objection": "We're using a competitor", "response": "response that opens door to comparison"},
    {"objection": "I'm not the right person", "response": "response that gets referral"}
  ]
}

Use these placeholders in content: [Your Name], [Your Company], [Your Solution's Key Benefit]`

/**
 * Call OpenAI API with JSON response format
 */
async function callOpenAI<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured')
    }

    console.log('[OpenAI] Generating content...')

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                response_format: { type: 'json_object' },
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[OpenAI] API error:', response.status, errorText)
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('[OpenAI] Response received')

        const content = data.choices?.[0]?.message?.content
        if (!content) {
            throw new Error('No content in OpenAI response')
        }

        return JSON.parse(content) as T
    } catch (error) {
        console.error('[OpenAI] Error:', error)
        throw error
    }
}

/**
 * Build user prompt for insights generation
 */
function buildInsightsPrompt(
    company: CompanyContext,
    leads: LeadContext[],
    jobs: JobContext[]
): string {
    const sections: string[] = []

    // Company info
    sections.push(`## Company Information
- Name: ${company.name}
- Industry: ${company.industry || 'Not specified'}
- Size: ${company.size || 'Not specified'}
- Location: ${company.location || 'Not specified'}
- Domain: ${company.domain || 'Not specified'}
${company.description ? `- Description: ${company.description}` : ''}`)

    // Contacts/Leads
    if (leads.length > 0) {
        const leadsList = leads
            .map((l) => `- ${l.firstName} ${l.lastName}${l.jobTitle ? ` (${l.jobTitle})` : ''}`)
            .join('\n')
        sections.push(`## Decision Makers / Contacts (${leads.length} total)
${leadsList}`)
    } else {
        sections.push('## Decision Makers / Contacts\nNo contacts identified yet.')
    }

    // Jobs/Hiring activity
    if (jobs.length > 0) {
        const jobsList = jobs
            .map((j) => `- ${j.title}${j.department ? ` [${j.department}]` : ''}`)
            .join('\n')
        sections.push(`## Current Hiring Activity (${jobs.length} open positions)
${jobsList}`)
    } else {
        sections.push('## Current Hiring Activity\nNo open positions identified.')
    }

    return sections.join('\n\n')
}

/**
 * Build user prompt for playbook generation
 */
function buildPlaybookPrompt(
    company: CompanyContext,
    leads: LeadContext[],
    jobs: JobContext[]
): string {
    const primaryContact = leads[0]
    const sections: string[] = []

    // Company context
    sections.push(`## Target Company
- Name: ${company.name}
- Industry: ${company.industry || 'Technology'}
- Size: ${company.size || 'Growing company'}
- Location: ${company.location || 'Not specified'}
${company.description ? `- About: ${company.description}` : ''}`)

    // Primary contact
    if (primaryContact) {
        sections.push(`## Primary Contact
- Name: ${primaryContact.firstName} ${primaryContact.lastName}
- Title: ${primaryContact.jobTitle || 'Decision Maker'}`)
    } else {
        sections.push(`## Primary Contact
- Generic outreach (no specific contact identified)`)
    }

    // Hiring context
    if (jobs.length > 0) {
        const departments = jobs
            .filter((j) => j.department)
            .map((j) => j.department)
            .filter((d, i, arr) => arr.indexOf(d) === i)

        sections.push(`## Hiring Context
- ${jobs.length} open positions
- Active departments: ${departments.length > 0 ? departments.join(', ') : 'Various'}
- Key roles: ${jobs.slice(0, 3).map((j) => j.title).join(', ')}`)
    }

    // Additional contacts for multi-threading
    if (leads.length > 1) {
        const otherContacts = leads.slice(1, 4)
        const contactsList = otherContacts
            .map((l) => `- ${l.firstName} ${l.lastName} (${l.jobTitle || 'Contact'})`)
            .join('\n')
        sections.push(`## Other Decision Makers (for multi-threading)
${contactsList}`)
    }

    return sections.join('\n\n')
}

/**
 * Generate AI insights for a company
 */
export async function generateAIInsights(
    company: CompanyContext,
    leads: LeadContext[],
    jobs: JobContext[]
): Promise<AIInsights> {
    const userPrompt = buildInsightsPrompt(company, leads, jobs)

    console.log('[OpenAI] Generating insights for:', company.name)

    const result = await callOpenAI<AIInsights>(INSIGHTS_SYSTEM_PROMPT, userPrompt)

    // Validate structure
    if (!result.companyFacts || !Array.isArray(result.companyFacts)) {
        result.companyFacts = []
    }
    if (!result.decisionMakerInsights || !Array.isArray(result.decisionMakerInsights)) {
        result.decisionMakerInsights = []
    }
    if (!result.timingSignals || !Array.isArray(result.timingSignals)) {
        result.timingSignals = []
    }
    if (!result.competitiveIntel || typeof result.competitiveIntel !== 'string') {
        result.competitiveIntel = ''
    }

    return result
}

/**
 * Generate outreach playbook for a company
 */
export async function generateOutreachPlaybook(
    company: CompanyContext,
    leads: LeadContext[],
    jobs: JobContext[]
): Promise<OutreachPlaybook> {
    const userPrompt = buildPlaybookPrompt(company, leads, jobs)

    console.log('[OpenAI] Generating playbook for:', company.name)

    const result = await callOpenAI<OutreachPlaybook>(PLAYBOOK_SYSTEM_PROMPT, userPrompt)

    // Validate structure
    if (!result.coldCallScript || typeof result.coldCallScript !== 'string') {
        result.coldCallScript = ''
    }
    if (!result.emailTemplates || typeof result.emailTemplates !== 'object') {
        result.emailTemplates = { initial: '', followUp: '', breakup: '' }
    }
    if (!result.objectionHandlers || !Array.isArray(result.objectionHandlers)) {
        result.objectionHandlers = []
    }

    return result
}

// ICP Generation System Prompt
const ICP_SYSTEM_PROMPT = `You are an expert B2B sales strategist specializing in identifying Ideal Customer Profiles (ICPs) based on hiring signals. Given a product description, you identify:

1. Which departments would buy this product
2. What job titles indicate a company needs this product (hiring signals)
3. What tech stack signals relevance
4. Who the decision makers would be
5. How many relevant job postings indicate strong buying intent

Output JSON matching this exact structure:
{
  "name": "Short descriptive ICP name (2-4 words)",
  "departments": ["engineering", "sales", "marketing", "hr", "finance", "operations", "design", "product", "customer_success"],
  "jobTitles": ["5-8 specific job titles that indicate buying intent"],
  "techStack": ["relevant technologies if applicable, empty array if not tech-focused"],
  "minJobs": number between 1-20 (how many matching jobs indicate strong intent),
  "decisionMakers": ["3-5 titles of people who would approve this purchase"],
  "reasoning": "2-3 sentences explaining WHY these hiring signals indicate buying intent for this product",
  "suggestedScrapers": [
    {"jobTitle": "exact job title to search", "locations": ["United States", "Remote", "specific city if relevant"]}
  ]
}

Guidelines:
- departments must use exact IDs: engineering, sales, marketing, hr, finance, operations, design, product, customer_success
- jobTitles should be specific and searchable on job boards
- suggestedScrapers should include 3-5 high-value job title + location combinations
- minJobs should be higher for products that require scale (e.g., recruiting tools need 10+ hires)
- Be specific to the product described, not generic`

/**
 * Generate ICP suggestion based on product description
 */
export async function generateICPSuggestion(productDescription: string): Promise<ICPSuggestion> {
    console.log('[OpenAI] Generating ICP for product:', productDescription.substring(0, 50) + '...')

    const userPrompt = `Product/Service Description:
${productDescription}

Analyze this product and generate an Ideal Customer Profile based on hiring signals. Focus on companies that would be actively looking for this solution based on their job postings.`

    const result = await callOpenAI<ICPSuggestion>(ICP_SYSTEM_PROMPT, userPrompt)

    // Validate and ensure structure
    if (!result.name || typeof result.name !== 'string') {
        result.name = 'Target Companies'
    }
    if (!result.departments || !Array.isArray(result.departments)) {
        result.departments = ['engineering', 'sales']
    }
    if (!result.jobTitles || !Array.isArray(result.jobTitles)) {
        result.jobTitles = []
    }
    if (!result.techStack || !Array.isArray(result.techStack)) {
        result.techStack = []
    }
    if (!result.minJobs || typeof result.minJobs !== 'number') {
        result.minJobs = 5
    }
    if (!result.decisionMakers || !Array.isArray(result.decisionMakers)) {
        result.decisionMakers = []
    }
    if (!result.reasoning || typeof result.reasoning !== 'string') {
        result.reasoning = ''
    }
    if (!result.suggestedScrapers || !Array.isArray(result.suggestedScrapers)) {
        result.suggestedScrapers = result.jobTitles.slice(0, 5).map(title => ({
            jobTitle: title,
            locations: ['United States', 'Remote']
        }))
    }

    return result
}
