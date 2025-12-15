import type { Metadata } from 'next'
import Header from '@/components/header'
import FooterSection from '@/components/footer'

export const metadata: Metadata = {
    title: 'RecLead - Turn Job Postings Into Warm Leads',
    description: 'Scrape jobs from LinkedIn, Indeed, Naukri and more. Enrich with contact data. Push to your CRM. Automatically.',
}

export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <Header />
            <main
                role="main"
                data-theme="dark"
                className="bg-background">
                {children}
            </main>
            <FooterSection />
        </>
    )
}