import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Leadey - Turn Job Postings Into Warm Leads',
    description: 'Scrape jobs from LinkedIn, Indeed, and more. Enrich with contact data. Push to your CRM. Automatically.',
}

export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return <>{children}</>
}
