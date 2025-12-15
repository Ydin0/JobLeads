import { Card } from '@/components/ui/card'
import { Globe, Mail, Link2, Calendar } from 'lucide-react'

const features = [
    {
        icon: Globe,
        title: 'Multi-Platform Scraping',
        description: 'Scrape job postings from LinkedIn, Indeed, Naukri, Glassdoor, and 20+ other job boards simultaneously.',
        span: 'row-span-2',
    },
    {
        icon: Mail,
        title: 'Contact Enrichment',
        description: 'Automatically enrich leads with verified email addresses, phone numbers, and LinkedIn profiles.',
        span: '',
    },
    {
        icon: Link2,
        title: 'CRM Integrations',
        description: 'Push leads directly to Salesforce, HubSpot, Pipedrive, or export to CSV. No manual work required.',
        span: '',
    },
    {
        icon: Calendar,
        title: 'Scheduled Searches',
        description: 'Set up recurring searches to automatically capture new job postings daily, weekly, or monthly.',
        span: '',
    },
]

export function PlatformFeatures() {
    return (
        <section>
            <div className="@container py-24 [--color-card:transparent]">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div>
                        <span className="text-primary font-mono text-sm uppercase">Platform</span>
                        <div className="mt-8 grid items-end gap-6 md:grid-cols-2">
                            <h2 className="text-foreground text-4xl font-semibold md:text-5xl">Everything You Need to Generate Leads</h2>
                            <div className="lg:pl-12">
                                <p className="text-muted-foreground text-balance">Powerful features designed to help recruitment agencies find and convert more clients.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 grid gap-6 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] *:shadow-lg *:shadow-black/5 md:grid-cols-2 lg:-mx-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="group grid gap-4 rounded-2xl p-8">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-zinc-800 transition-colors group-hover:bg-zinc-700">
                                    <feature.icon className="size-6 text-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-foreground font-semibold">{feature.title}</h3>
                                    <p className="text-muted-foreground mt-3">{feature.description}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
