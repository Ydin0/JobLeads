import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Users,
    Building2,
    Search,
    Briefcase,
    ArrowUpRight,
    Plus,
    ExternalLink,
    Sparkles,
    CheckCircle2,
    Clock,
    ChevronRight,
    Mail,
    Linkedin,
    MapPin,
    Calendar,
    TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

const stats = [
    {
        name: 'Companies Found',
        value: '47',
        change: '+8 this week',
        changeType: 'positive',
        icon: Building2,
        color: 'from-blue-500 to-cyan-500',
    },
    {
        name: 'Open Positions',
        value: '234',
        change: '+45 this week',
        changeType: 'positive',
        icon: Briefcase,
        color: 'from-purple-500 to-pink-500',
    },
    {
        name: 'Contacts Found',
        value: '28',
        change: '+12 this week',
        changeType: 'positive',
        icon: Users,
        color: 'from-green-500 to-emerald-500',
    },
    {
        name: 'Active Searches',
        value: '4',
        change: '2 running',
        changeType: 'neutral',
        icon: Search,
        color: 'from-orange-500 to-amber-500',
    },
]

const recentCompanies = [
    {
        name: 'OpenAI',
        logo: 'O',
        industry: 'AI/ML',
        location: 'San Francisco, CA',
        jobs: 7,
        enriched: true,
        contacts: 1,
    },
    {
        name: 'Google',
        logo: 'G',
        industry: 'Technology',
        location: 'Mountain View, CA',
        jobs: 5,
        enriched: false,
        contacts: 0,
    },
    {
        name: 'Meta',
        logo: 'M',
        industry: 'Technology',
        location: 'Menlo Park, CA',
        jobs: 4,
        enriched: true,
        contacts: 3,
    },
    {
        name: 'Microsoft',
        logo: 'M',
        industry: 'Technology',
        location: 'Seattle, WA',
        jobs: 3,
        enriched: true,
        contacts: 2,
    },
    {
        name: 'Stripe',
        logo: 'S',
        industry: 'Fintech',
        location: 'San Francisco, CA',
        jobs: 2,
        enriched: false,
        contacts: 0,
    },
]

const recentContacts = [
    {
        name: 'Sarah Johnson',
        title: 'VP of Engineering',
        company: 'Microsoft',
        companyLogo: 'M',
        email: 'sarah.j@microsoft.com',
        hasLinkedin: true,
        status: 'new',
        addedDate: '2h ago',
    },
    {
        name: 'David Park',
        title: 'Head of Engineering',
        company: 'OpenAI',
        companyLogo: 'O',
        email: 'd.park@openai.com',
        hasLinkedin: true,
        status: 'qualified',
        addedDate: '5h ago',
    },
    {
        name: 'Jennifer Wu',
        title: 'Engineering Director',
        company: 'Meta',
        companyLogo: 'M',
        email: 'j.wu@meta.com',
        hasLinkedin: true,
        status: 'contacted',
        addedDate: '1d ago',
    },
    {
        name: 'Michael Chen',
        title: 'Director of Talent',
        company: 'Microsoft',
        companyLogo: 'M',
        email: 'm.chen@microsoft.com',
        hasLinkedin: true,
        status: 'new',
        addedDate: '1d ago',
    },
]

const activeSearches = [
    {
        name: 'Senior Engineers in Bay Area',
        companies: 12,
        jobs: 45,
        newJobs: 8,
        lastRun: '2h ago',
        nextRun: 'Tomorrow 9AM',
        schedule: 'Daily',
        status: 'active',
    },
    {
        name: 'Data Scientists - Tech Hubs',
        companies: 8,
        jobs: 23,
        newJobs: 3,
        lastRun: '4h ago',
        nextRun: 'Tomorrow 9AM',
        schedule: 'Daily',
        status: 'active',
    },
    {
        name: 'Product Managers - Remote',
        companies: 15,
        jobs: 38,
        newJobs: 0,
        lastRun: '1d ago',
        nextRun: 'Paused',
        schedule: 'Weekly',
        status: 'paused',
    },
]

export default function DashboardPage() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Dashboard</h1>
                    <p className="text-sm text-white/40">Overview of your lead generation activity</p>
                </div>
                <Button size="sm" className="h-8 bg-white text-sm text-black hover:bg-white/90" asChild>
                    <Link href="/dashboard/searches">
                        <Plus className="mr-1.5 size-3.5" />
                        New Search
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                    <div className="flex items-center gap-0.5 text-xs font-medium">
                                        {stat.changeType === 'positive' && (
                                            <ArrowUpRight className="size-3 text-green-400" />
                                        )}
                                        <span className={stat.changeType === 'positive' ? 'text-green-400' : 'text-white/40'}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-white/40">{stat.name}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Recent Companies */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/5 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <h2 className="text-sm font-medium text-white">Recent Companies</h2>
                        <Link
                            href="/dashboard/companies"
                            className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                            View all
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                    <div className="relative p-3">
                        <div className="space-y-1.5">
                            {recentCompanies.map((company, index) => (
                                <div
                                    key={index}
                                    className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                            {company.logo}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">{company.name}</span>
                                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/40">{company.industry}</span>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="size-3" />
                                                    {company.jobs} jobs
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-3" />
                                                    {company.location}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {company.enriched ? (
                                            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                <CheckCircle2 className="size-3" />
                                                {company.contacts} contacts
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="h-7 bg-gradient-to-r from-purple-500 to-blue-500 px-2.5 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                <Sparkles className="mr-1 size-3" />
                                                Enrich
                                            </Button>
                                        )}
                                        <ChevronRight className="size-4 text-white/20" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Contacts */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/5 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <h2 className="text-sm font-medium text-white">Recent Contacts</h2>
                        <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                            View all
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                    <div className="relative p-3">
                        <div className="space-y-1.5">
                            {recentContacts.map((contact, index) => (
                                <div
                                    key={index}
                                    className="group rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                            {contact.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-medium text-white truncate">{contact.name}</span>
                                                <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                                    contact.status === 'new'
                                                        ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                                        : contact.status === 'contacted'
                                                        ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                                                        : 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
                                                }`}>
                                                    {contact.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-white/40 truncate">{contact.title}</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="flex size-5 items-center justify-center rounded bg-white/10 text-[10px] font-medium text-white">
                                                {contact.companyLogo}
                                            </div>
                                            <span className="text-xs text-white/40">{contact.company}</span>
                                            <span className="text-xs text-white/20">·</span>
                                            <span className="text-xs text-white/30">{contact.addedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="size-3.5 text-white/30" />
                                            {contact.hasLinkedin && <Linkedin className="size-3.5 text-blue-400/60" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href="/dashboard/companies"
                            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2.5 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/60">
                            <Sparkles className="size-3.5" />
                            Enrich companies to find contacts
                        </Link>
                    </div>
                </div>
            </div>

            {/* Active Searches */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="absolute -right-32 -top-32 size-64 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <h2 className="text-sm font-medium text-white">Active Searches</h2>
                    <Link
                        href="/dashboard/searches"
                        className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                        Manage
                        <ExternalLink className="size-3" />
                    </Link>
                </div>
                <div className="relative p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {activeSearches.map((search, index) => (
                            <div
                                key={index}
                                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <div className="text-sm font-medium text-white truncate">{search.name}</div>
                                        {search.newJobs > 0 && (
                                            <span className="flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                <TrendingUp className="size-2.5" />
                                                +{search.newJobs}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                        search.status === 'active'
                                            ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                    }`}>
                                        {search.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
                                        <div className="text-sm font-medium text-white">{search.companies}</div>
                                        <div className="text-[10px] text-white/30">Companies</div>
                                    </div>
                                    <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
                                        <div className="text-sm font-medium text-white">{search.jobs}</div>
                                        <div className="text-[10px] text-white/30">Jobs</div>
                                    </div>
                                </div>
                                <div className="mt-2 space-y-0.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 text-white/30">
                                            <Clock className="size-3" />
                                            Last run
                                        </span>
                                        <span className="text-white/50">{search.lastRun}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1 text-white/30">
                                            <Calendar className="size-3" />
                                            {search.schedule}
                                        </span>
                                        <span className="text-white/50">{search.nextRun}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative border-b border-white/5 px-4 py-3">
                    <h2 className="text-sm font-medium text-white">Quick Actions</h2>
                </div>
                <div className="relative p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: Search, title: 'New Search', desc: 'Start scraping jobs', gradient: 'from-blue-500 to-cyan-500', href: '/dashboard/searches' },
                            { icon: Sparkles, title: 'Enrich Companies', desc: 'Find key contacts', gradient: 'from-purple-500 to-pink-500', href: '/dashboard/companies' },
                            { icon: Users, title: 'Export Contacts', desc: 'Download as CSV', gradient: 'from-green-500 to-emerald-500', href: '/dashboard/leads' },
                            { icon: Building2, title: 'View Companies', desc: 'Browse all', gradient: 'from-orange-500 to-amber-500', href: '/dashboard/companies' },
                        ].map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} shadow-lg transition-transform group-hover:scale-105`}>
                                    <action.icon className="size-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{action.title}</div>
                                    <div className="text-xs text-white/40">{action.desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
