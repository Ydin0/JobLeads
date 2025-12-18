// Mock AI Content Generators
// These generate realistic-looking AI insights and outreach content
// Will be replaced with real AI integration later

export interface AIInsights {
    companyFacts: string[]
    decisionMakerInsights: string[]
    timingSignals: string[]
    competitiveIntel: string
}

export interface OutreachPlaybook {
    coldCallScript: string
    emailTemplates: {
        initial: string
        followUp: string
        breakup: string
    }
    objectionHandlers: { objection: string; response: string }[]
}

interface Company {
    name: string
    industry?: string | null
    size?: string | null
    location?: string | null
    description?: string | null
}

interface Lead {
    firstName: string
    lastName: string
    jobTitle?: string | null
}

interface Job {
    title?: string
    department?: string
}

// Helper to get department from job title
function getDepartmentFromTitle(title?: string | null): string {
    if (!title) return 'business'
    const lower = title.toLowerCase()
    if (lower.includes('engineer') || lower.includes('developer') || lower.includes('technical')) return 'engineering'
    if (lower.includes('sales') || lower.includes('account')) return 'sales'
    if (lower.includes('marketing') || lower.includes('growth')) return 'marketing'
    if (lower.includes('product') || lower.includes('pm')) return 'product'
    if (lower.includes('hr') || lower.includes('people') || lower.includes('talent')) return 'HR'
    if (lower.includes('finance') || lower.includes('cfo')) return 'finance'
    if (lower.includes('operation') || lower.includes('coo')) return 'operations'
    if (lower.includes('cto') || lower.includes('ceo') || lower.includes('chief')) return 'executive'
    return 'business'
}

// Get a random item from an array
function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export function generateMockInsights(
    company: Company,
    leads: Lead[],
    jobs: Job[]
): AIInsights {
    const companyName = company.name
    const industry = company.industry || 'technology'
    const size = company.size || 'growing'
    const location = company.location || 'the United States'
    const jobCount = jobs.length

    // Generate company facts
    const companyFacts: string[] = [
        `${companyName} is a ${size} company in the ${industry} sector.`,
        `Headquartered in ${location}, they've been actively expanding their team.`,
    ]

    if (jobCount > 0) {
        companyFacts.push(`Currently hiring for ${jobCount} position${jobCount > 1 ? 's' : ''}, indicating active growth phase.`)
    }

    if (jobCount > 5) {
        companyFacts.push(`High hiring velocity suggests potential funding round or rapid expansion.`)
    }

    if (company.description) {
        companyFacts.push(`Focus area: ${company.description.substring(0, 120)}${company.description.length > 120 ? '...' : ''}`)
    }

    // Generate decision maker insights
    const decisionMakerInsights = leads.map(lead => {
        const dept = getDepartmentFromTitle(lead.jobTitle)
        const title = lead.jobTitle || 'Key Contact'
        return `${lead.firstName} ${lead.lastName} (${title}) - Likely involved in ${dept} decisions and vendor evaluations.`
    })

    // Generate timing signals
    const timingSignals: string[] = []

    if (jobCount > 3) {
        timingSignals.push('HIGH PRIORITY: Actively hiring multiple roles - likely receptive to solutions that help scale.')
    } else if (jobCount > 0) {
        timingSignals.push('Growing team - good timing to discuss solutions that support expansion.')
    }

    timingSignals.push('Best contact time: Tuesday-Thursday, 10am-11am local time.')
    timingSignals.push('Avoid: Monday mornings (planning meetings) and Friday afternoons.')

    if (leads.length > 2) {
        timingSignals.push('Multiple decision-makers identified - consider multi-threading your outreach.')
    }

    // Generate competitive intel
    const competitiveOptions = [
        `Based on their hiring patterns, ${companyName} appears to be investing heavily in ${industry} capabilities. They may be evaluating solutions to support this growth.`,
        `${companyName}'s job postings suggest they're building out their ${jobCount > 3 ? 'infrastructure' : 'team'}. This is typically when companies evaluate new vendors.`,
        `Companies like ${companyName} in the ${industry} space often struggle with scaling challenges. Position your solution around efficiency and growth enablement.`,
    ]

    return {
        companyFacts,
        decisionMakerInsights,
        timingSignals,
        competitiveIntel: randomItem(competitiveOptions),
    }
}

export function generateMockPlaybook(
    company: Company,
    leads: Lead[],
    jobs: Job[]
): OutreachPlaybook {
    const companyName = company.name
    const industry = company.industry || 'technology'
    const primaryContact = leads[0]
    const firstName = primaryContact?.firstName || 'there'
    const jobCount = jobs.length

    // Pain points based on industry
    const painPoints: Record<string, string[]> = {
        'Software': ['scaling engineering teams', 'reducing technical debt', 'improving deployment velocity'],
        'Data & Analytics': ['data pipeline reliability', 'real-time processing', 'data governance'],
        'Cloud Services': ['infrastructure costs', 'multi-cloud complexity', 'security compliance'],
        'Developer Tools': ['developer adoption', 'integration complexity', 'documentation'],
        'default': ['operational efficiency', 'scaling challenges', 'team productivity'],
    }

    const relevantPains = painPoints[industry] || painPoints['default']
    const painPoint = randomItem(relevantPains)

    const coldCallScript = `Hi ${firstName}, this is [Your Name] from [Your Company].

I noticed ${companyName} is ${jobCount > 2 ? 'scaling your team significantly' : 'growing'} - congratulations on the momentum!

The reason for my call: we've been helping ${industry} companies like yours with ${painPoint}, and I wanted to see if that's something on your radar.

[PAUSE - Let them respond]

[If interested]: Great! Many of our clients were dealing with similar challenges when they were at your stage. What's currently your biggest bottleneck when it comes to ${painPoint}?

[If not interested]: I understand. Just curious - is that because you've already solved that, or is it just not a priority right now?

[If busy]: Totally get it. Would it make sense to schedule 15 minutes later this week? I can share some quick wins other ${industry} companies have seen.`

    const emailTemplates = {
        initial: `Subject: ${companyName}'s growth + a quick idea

Hi ${firstName},

I came across ${companyName} and noticed you're hiring for ${jobCount || 'several'} positions - impressive growth!

When ${industry} companies scale this quickly, they often run into challenges with ${painPoint}. We've helped similar companies solve this by [Your Solution's Key Benefit].

For example, [Similar Company] was able to [Specific Result] within [Timeframe].

Would you be open to a 15-minute call to explore if this might help ${companyName}?

Best,
[Your Name]

P.S. No worries if the timing isn't right - just reply "later" and I'll check back in a few months.`,

        followUp: `Subject: Re: ${companyName}'s growth

Hi ${firstName},

I wanted to follow up on my previous email. I know you're busy ${jobCount > 2 ? 'scaling the team' : 'with growth initiatives'}, so I'll keep this brief.

One thing I forgot to mention: we recently helped a ${industry} company similar to ${companyName} reduce their ${painPoint} challenges by 40% in just 3 months.

Worth a quick 15-minute chat to see if we could do the same for you?

[Your Name]`,

        breakup: `Subject: Should I close your file?

Hi ${firstName},

I've reached out a few times and haven't heard back, which usually means one of three things:

1. You're all set and don't need help with ${painPoint}
2. You're interested but now isn't the right time
3. You've been incredibly busy with ${companyName}'s growth

If it's #1 - no problem at all, I'll stop reaching out.
If it's #2 - just reply "later" and I'll check back in a few months.
If it's #3 - I get it! Reply "busy" and I'll send over a 2-minute video instead.

Either way, I won't keep filling your inbox.

Best,
[Your Name]`,
    }

    const objectionHandlers = [
        {
            objection: "We're not interested right now",
            response: `I appreciate the honesty. Just curious - is that because you're happy with your current approach to ${painPoint}, or is it just not a priority compared to other initiatives?`,
        },
        {
            objection: "Send me an email / some information",
            response: `Happy to! But so I don't waste your time with irrelevant info - what's the biggest challenge you're facing with ${painPoint} right now? That way I can send you something actually useful.`,
        },
        {
            objection: "We don't have budget for this",
            response: `Totally understand - budget is always tight when you're growing. Many of our clients started by understanding the ROI first. Would it help to at least see what the potential savings could be, so you're prepared when budget conversations come up?`,
        },
        {
            objection: "We're using a competitor / built it in-house",
            response: `That makes sense - a lot of ${industry} companies start that way. Just curious, how's that working out? Any gaps or pain points you wish were better handled?`,
        },
        {
            objection: "Call me back in X months",
            response: `Absolutely, I'll put that in my calendar. Just so I come prepared - what's happening in ${companyName} in X months that would make this more relevant? Is there a specific initiative or milestone coming up?`,
        },
        {
            objection: "I'm not the right person",
            response: `I appreciate you letting me know. Who would be the best person to talk to about ${painPoint}? And would you be open to making an intro, or should I reach out directly?`,
        },
    ]

    return {
        coldCallScript,
        emailTemplates,
        objectionHandlers,
    }
}
