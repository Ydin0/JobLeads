'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Building2,
    MapPin,
    Briefcase,
    Users,
    Sparkles,
    Check,
    ExternalLink,
    MoreHorizontal,
    CheckCircle2,
    Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanyDetailModal } from '@/components/dashboard/company-detail-modal'
import { EnrichOptionsModal, EnrichmentOptions } from '@/components/dashboard/enrich-options-modal'

const companies = [
    {
        id: '1',
        name: 'Google',
        logo: 'G',
        website: 'google.com',
        industry: 'Technology',
        size: '10,000+',
        locations: ['Mountain View, CA', 'New York, NY', 'Seattle, WA'],
        jobs: [
            { id: 'j1', title: 'Senior ML Engineer', location: 'Mountain View, CA', postedDate: '2024-01-15', url: '#' },
            { id: 'j2', title: 'Staff Software Engineer', location: 'New York, NY', postedDate: '2024-01-14', url: '#' },
            { id: 'j3', title: 'Engineering Manager', location: 'Seattle, WA', postedDate: '2024-01-13', url: '#' },
            { id: 'j4', title: 'Data Scientist', location: 'Mountain View, CA', postedDate: '2024-01-12', url: '#' },
            { id: 'j5', title: 'Product Manager', location: 'New York, NY', postedDate: '2024-01-11', url: '#' },
        ],
        leads: [],
        enriched: false,
        sources: ['Senior Engineers in Bay Area', 'Data Scientists - Tech Hubs'],
        firstSeen: '2024-01-10',
    },
    {
        id: '2',
        name: 'Microsoft',
        logo: 'M',
        website: 'microsoft.com',
        industry: 'Technology',
        size: '10,000+',
        locations: ['Seattle, WA', 'San Francisco, CA'],
        jobs: [
            { id: 'j6', title: 'Principal Engineer', location: 'Seattle, WA', postedDate: '2024-01-15', url: '#' },
            { id: 'j7', title: 'Senior PM', location: 'San Francisco, CA', postedDate: '2024-01-14', url: '#' },
            { id: 'j8', title: 'Cloud Architect', location: 'Seattle, WA', postedDate: '2024-01-13', url: '#' },
        ],
        leads: [
            { id: 'l1', name: 'Sarah Johnson', title: 'VP of Engineering', email: 'sarah.j@microsoft.com', linkedin: 'linkedin.com/in/sarahj' },
            { id: 'l2', name: 'Michael Chen', title: 'Director of Talent', email: 'm.chen@microsoft.com', linkedin: 'linkedin.com/in/mchen' },
        ],
        enriched: true,
        sources: ['Senior Engineers in Bay Area'],
        firstSeen: '2024-01-08',
    },
    {
        id: '3',
        name: 'Stripe',
        logo: 'S',
        website: 'stripe.com',
        industry: 'Fintech',
        size: '1,000-5,000',
        locations: ['San Francisco, CA', 'Remote'],
        jobs: [
            { id: 'j9', title: 'Backend Engineer', location: 'San Francisco, CA', postedDate: '2024-01-15', url: '#' },
            { id: 'j10', title: 'Frontend Engineer', location: 'Remote', postedDate: '2024-01-14', url: '#' },
        ],
        leads: [],
        enriched: false,
        sources: ['Senior Engineers in Bay Area'],
        firstSeen: '2024-01-12',
    },
    {
        id: '4',
        name: 'OpenAI',
        logo: 'O',
        website: 'openai.com',
        industry: 'AI/ML',
        size: '500-1,000',
        locations: ['San Francisco, CA'],
        jobs: [
            { id: 'j11', title: 'Research Scientist', location: 'San Francisco, CA', postedDate: '2024-01-15', url: '#' },
            { id: 'j12', title: 'ML Engineer', location: 'San Francisco, CA', postedDate: '2024-01-14', url: '#' },
            { id: 'j13', title: 'Applied AI Engineer', location: 'San Francisco, CA', postedDate: '2024-01-13', url: '#' },
            { id: 'j14', title: 'Infrastructure Engineer', location: 'San Francisco, CA', postedDate: '2024-01-12', url: '#' },
            { id: 'j15', title: 'Technical PM', location: 'San Francisco, CA', postedDate: '2024-01-11', url: '#' },
            { id: 'j16', title: 'Security Engineer', location: 'San Francisco, CA', postedDate: '2024-01-10', url: '#' },
            { id: 'j17', title: 'Platform Engineer', location: 'San Francisco, CA', postedDate: '2024-01-09', url: '#' },
        ],
        leads: [
            { id: 'l3', name: 'David Park', title: 'Head of Engineering', email: 'd.park@openai.com', linkedin: 'linkedin.com/in/dpark' },
        ],
        enriched: true,
        sources: ['Data Scientists - Tech Hubs', 'Senior Engineers in Bay Area'],
        firstSeen: '2024-01-05',
    },
    {
        id: '5',
        name: 'Airbnb',
        logo: 'A',
        website: 'airbnb.com',
        industry: 'Travel/Tech',
        size: '5,000-10,000',
        locations: ['San Francisco, CA', 'Remote'],
        jobs: [
            { id: 'j18', title: 'Senior iOS Engineer', location: 'San Francisco, CA', postedDate: '2024-01-15', url: '#' },
            { id: 'j19', title: 'Data Engineer', location: 'Remote', postedDate: '2024-01-14', url: '#' },
        ],
        leads: [],
        enriched: false,
        sources: ['Senior Engineers in Bay Area'],
        firstSeen: '2024-01-11',
    },
    {
        id: '6',
        name: 'Netflix',
        logo: 'N',
        website: 'netflix.com',
        industry: 'Entertainment',
        size: '10,000+',
        locations: ['Los Gatos, CA', 'Los Angeles, CA'],
        jobs: [
            { id: 'j20', title: 'Senior Software Engineer', location: 'Los Gatos, CA', postedDate: '2024-01-15', url: '#' },
        ],
        leads: [],
        enriched: false,
        sources: ['Senior Engineers in Bay Area'],
        firstSeen: '2024-01-14',
    },
    {
        id: '7',
        name: 'Meta',
        logo: 'M',
        website: 'meta.com',
        industry: 'Technology',
        size: '10,000+',
        locations: ['Menlo Park, CA', 'New York, NY', 'Seattle, WA'],
        jobs: [
            { id: 'j21', title: 'Research Engineer', location: 'Menlo Park, CA', postedDate: '2024-01-15', url: '#' },
            { id: 'j22', title: 'Production Engineer', location: 'New York, NY', postedDate: '2024-01-14', url: '#' },
            { id: 'j23', title: 'ML Engineer', location: 'Seattle, WA', postedDate: '2024-01-13', url: '#' },
            { id: 'j24', title: 'Android Engineer', location: 'Menlo Park, CA', postedDate: '2024-01-12', url: '#' },
        ],
        leads: [
            { id: 'l4', name: 'Jennifer Wu', title: 'Engineering Director', email: 'j.wu@meta.com', linkedin: 'linkedin.com/in/jwu' },
            { id: 'l5', name: 'Robert Kim', title: 'Technical Recruiter Lead', email: 'r.kim@meta.com', linkedin: 'linkedin.com/in/rkim' },
            { id: 'l6', name: 'Amanda Torres', title: 'VP of People', email: 'a.torres@meta.com', linkedin: 'linkedin.com/in/atorres' },
        ],
        enriched: true,
        sources: ['Senior Engineers in Bay Area', 'Data Scientists - Tech Hubs'],
        firstSeen: '2024-01-06',
    },
]

const stats = [
    {
        label: 'Total Companies',
        value: companies.length,
        icon: Building2,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        label: 'Total Jobs',
        value: companies.reduce((acc, c) => acc + c.jobs.length, 0),
        icon: Briefcase,
        color: 'from-purple-500 to-pink-500',
    },
    {
        label: 'Enriched',
        value: companies.filter(c => c.enriched).length,
        icon: CheckCircle2,
        color: 'from-green-500 to-emerald-500',
    },
    {
        label: 'Contacts Found',
        value: companies.reduce((acc, c) => acc + c.leads.length, 0),
        icon: Users,
        color: 'from-orange-500 to-amber-500',
    },
]

export default function CompaniesPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [enrichmentFilter, setEnrichmentFilter] = useState<'all' | 'enriched' | 'not_enriched'>('all')
    const [selectedCompany, setSelectedCompany] = useState<typeof companies[0] | null>(null)
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [companyToEnrich, setCompanyToEnrich] = useState<typeof companies[0] | null>(null)
    const [companiesToEnrich, setCompaniesToEnrich] = useState<typeof companies>([])
    const [enrichModalOpen, setEnrichModalOpen] = useState(false)

    const handleEnrich = (options: EnrichmentOptions) => {
        // TODO: Send to Apollo API with options
        if (companiesToEnrich.length > 0) {
            console.log('Bulk enriching companies:', companiesToEnrich.map(c => c.name), 'with options:', options)
        } else {
            console.log('Enriching company:', companyToEnrich?.name, 'with options:', options)
        }
    }

    const openEnrichModal = (company: typeof companies[0]) => {
        setCompanyToEnrich(company)
        setCompaniesToEnrich([])
        setEnrichModalOpen(true)
    }

    const openBulkEnrichModal = () => {
        const selectedCompanyObjects = companies.filter(c => selectedCompanies.includes(c.id) && !c.enriched)
        setCompaniesToEnrich(selectedCompanyObjects)
        setCompanyToEnrich(null)
        setEnrichModalOpen(true)
    }

    const filteredCompanies = companies.filter(company => {
        const matchesSearch =
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.industry.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesEnrichment =
            enrichmentFilter === 'all' ||
            (enrichmentFilter === 'enriched' && company.enriched) ||
            (enrichmentFilter === 'not_enriched' && !company.enriched)
        return matchesSearch && matchesEnrichment
    })

    const sortedCompanies = [...filteredCompanies].sort((a, b) => b.jobs.length - a.jobs.length)

    const toggleSelectCompany = (id: string) => {
        setSelectedCompanies(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedCompanies.length === sortedCompanies.length) {
            setSelectedCompanies([])
        } else {
            setSelectedCompanies(sortedCompanies.map(c => c.id))
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Companies</h1>
                    <p className="text-sm text-white/40">
                        Companies found from your searches. Enrich to find contacts.
                    </p>
                </div>
                {selectedCompanies.length > 0 && (
                    <Button
                        onClick={openBulkEnrichModal}
                        className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-sm text-white hover:from-purple-600 hover:to-blue-600">
                        <Sparkles className="mr-1.5 size-3.5" />
                        Enrich {selectedCompanies.length} {selectedCompanies.length === 1 ? 'Company' : 'Companies'}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                <div className="text-sm text-white/40">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search companies..."
                            className="h-8 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'not_enriched', label: 'Not Enriched' },
                            { id: 'enriched', label: 'Enriched' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setEnrichmentFilter(filter.id as typeof enrichmentFilter)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    enrichmentFilter === filter.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                )}>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={toggleSelectAll}
                    className="text-xs text-white/40 hover:text-white">
                    {selectedCompanies.length === sortedCompanies.length ? 'Deselect all' : 'Select all'}
                </button>
            </div>

            {/* Companies Table */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-3 py-2.5 text-left">
                                    <button
                                        onClick={toggleSelectAll}
                                        className={cn(
                                            'flex size-4 items-center justify-center rounded border transition-all',
                                            selectedCompanies.length === sortedCompanies.length && sortedCompanies.length > 0
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-white/20 hover:border-white/40'
                                        )}>
                                        {selectedCompanies.length === sortedCompanies.length && sortedCompanies.length > 0 && (
                                            <Check className="size-2.5 text-white" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Company</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Jobs</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Location</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Size</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Status</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Contacts</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Source</th>
                                <th className="px-3 py-2.5 text-right text-xs font-medium text-white/40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedCompanies.map((company) => (
                                <tr
                                    key={company.id}
                                    className={cn(
                                        'group transition-colors hover:bg-white/[0.03]',
                                        selectedCompanies.includes(company.id) && 'bg-purple-500/5'
                                    )}>
                                    <td className="px-3 py-2.5">
                                        <button
                                            onClick={() => toggleSelectCompany(company.id)}
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded border transition-all',
                                                selectedCompanies.includes(company.id)
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-white/20 hover:border-white/40'
                                            )}>
                                            {selectedCompanies.includes(company.id) && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </button>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xs font-bold text-white ring-1 ring-inset ring-white/10">
                                                {company.logo}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-white">{company.name}</div>
                                                <div className="text-xs text-white/30">{company.industry}</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                                                {company.jobs.length}
                                            </span>
                                            <span className="text-[10px] text-white/30">positions</span>
                                        </div>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1 text-xs text-white/60">
                                            <MapPin className="size-3 text-white/30" />
                                            <span className="max-w-[120px] truncate">{company.locations[0]}</span>
                                            {company.locations.length > 1 && (
                                                <span className="text-white/30">+{company.locations.length - 1}</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <span className="text-xs text-white/60">{company.size}</span>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        {company.enriched ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                <CheckCircle2 className="size-2.5" />
                                                Enriched
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/40 ring-1 ring-inset ring-white/10">
                                                <Circle className="size-2.5" />
                                                Pending
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-3 py-2.5">
                                        {company.enriched ? (
                                            <div className="flex items-center gap-1">
                                                <Users className="size-3 text-purple-400" />
                                                <span className="text-xs font-medium text-purple-400">{company.leads.length}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-white/20">—</span>
                                        )}
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                                            {company.sources.slice(0, 1).map((source) => (
                                                <span
                                                    key={source}
                                                    className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30 truncate max-w-[100px]">
                                                    {source}
                                                </span>
                                            ))}
                                            {company.sources.length > 1 && (
                                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">
                                                    +{company.sources.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setSelectedCompany(company)}
                                                className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                <ExternalLink className="size-3.5" />
                                            </button>
                                            {!company.enriched ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => openEnrichModal(company)}
                                                    className="h-7 w-[72px] bg-gradient-to-r from-purple-500 to-blue-500 text-[10px] text-white hover:from-purple-600 hover:to-blue-600">
                                                    <Sparkles className="mr-1 size-2.5" />
                                                    Enrich
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setSelectedCompany(company)}
                                                    className="h-7 w-[72px] text-[10px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                                                    <Users className="mr-1 size-2.5" />
                                                    View
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {sortedCompanies.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                        <Building2 className="size-4 text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-white">No companies found</h3>
                    <p className="mt-1 text-xs text-white/40">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}

            <CompanyDetailModal
                company={selectedCompany}
                open={!!selectedCompany}
                onOpenChange={(open) => !open && setSelectedCompany(null)}
            />

            <EnrichOptionsModal
                company={companyToEnrich}
                companies={companiesToEnrich}
                open={enrichModalOpen}
                onOpenChange={setEnrichModalOpen}
                onEnrich={handleEnrich}
            />
        </div>
    )
}
