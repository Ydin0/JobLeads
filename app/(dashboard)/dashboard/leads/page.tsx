'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Download,
    MoreHorizontal,
    ExternalLink,
    Mail,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    UserCheck,
    UserX,
    Linkedin,
    Users,
    Copy,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeadDetailModal } from '@/components/dashboard/lead-detail-modal'

const leads = [
    {
        id: '1',
        name: 'Sarah Johnson',
        title: 'VP of Engineering',
        company: 'Microsoft',
        companyId: '2',
        companyLogo: 'M',
        location: 'Seattle, WA',
        email: 'sarah.j@microsoft.com',
        phone: '+1 (555) 123-4567',
        linkedin: 'linkedin.com/in/sarahj',
        source: 'Senior Engineers in Bay Area',
        status: 'new',
        dateFound: '2024-01-15',
        jobsAtCompany: 3,
    },
    {
        id: '2',
        name: 'Michael Chen',
        title: 'Director of Talent',
        company: 'Microsoft',
        companyId: '2',
        companyLogo: 'M',
        location: 'Seattle, WA',
        email: 'm.chen@microsoft.com',
        phone: '+1 (555) 234-5678',
        linkedin: 'linkedin.com/in/mchen',
        source: 'Senior Engineers in Bay Area',
        status: 'contacted',
        dateFound: '2024-01-15',
        jobsAtCompany: 3,
    },
    {
        id: '3',
        name: 'David Park',
        title: 'Head of Engineering',
        company: 'OpenAI',
        companyId: '4',
        companyLogo: 'O',
        location: 'San Francisco, CA',
        email: 'd.park@openai.com',
        phone: '+1 (555) 345-6789',
        linkedin: 'linkedin.com/in/dpark',
        source: 'Data Scientists - Tech Hubs',
        status: 'qualified',
        dateFound: '2024-01-14',
        jobsAtCompany: 7,
    },
    {
        id: '4',
        name: 'Jennifer Wu',
        title: 'Engineering Director',
        company: 'Meta',
        companyId: '7',
        companyLogo: 'M',
        location: 'Menlo Park, CA',
        email: 'j.wu@meta.com',
        phone: '+1 (555) 456-7890',
        linkedin: 'linkedin.com/in/jwu',
        source: 'Senior Engineers in Bay Area',
        status: 'new',
        dateFound: '2024-01-13',
        jobsAtCompany: 4,
    },
    {
        id: '5',
        name: 'Robert Kim',
        title: 'Technical Recruiter Lead',
        company: 'Meta',
        companyId: '7',
        companyLogo: 'M',
        location: 'Menlo Park, CA',
        email: 'r.kim@meta.com',
        phone: '+1 (555) 567-8901',
        linkedin: 'linkedin.com/in/rkim',
        source: 'Senior Engineers in Bay Area',
        status: 'contacted',
        dateFound: '2024-01-13',
        jobsAtCompany: 4,
    },
    {
        id: '6',
        name: 'Amanda Torres',
        title: 'VP of People',
        company: 'Meta',
        companyId: '7',
        companyLogo: 'M',
        location: 'Menlo Park, CA',
        email: 'a.torres@meta.com',
        phone: '+1 (555) 678-9012',
        linkedin: 'linkedin.com/in/atorres',
        source: 'Data Scientists - Tech Hubs',
        status: 'new',
        dateFound: '2024-01-12',
        jobsAtCompany: 4,
    },
    {
        id: '7',
        name: 'Chris Anderson',
        title: 'CTO',
        company: 'Stripe',
        companyId: '3',
        companyLogo: 'S',
        location: 'San Francisco, CA',
        email: 'c.anderson@stripe.com',
        phone: '+1 (555) 789-0123',
        linkedin: 'linkedin.com/in/canderson',
        source: 'Senior Engineers in Bay Area',
        status: 'qualified',
        dateFound: '2024-01-11',
        jobsAtCompany: 2,
    },
    {
        id: '8',
        name: 'Emily Zhang',
        title: 'Head of Recruiting',
        company: 'Stripe',
        companyId: '3',
        companyLogo: 'S',
        location: 'San Francisco, CA',
        email: 'e.zhang@stripe.com',
        phone: '+1 (555) 890-1234',
        linkedin: 'linkedin.com/in/ezhang',
        source: 'Senior Engineers in Bay Area',
        status: 'new',
        dateFound: '2024-01-11',
        jobsAtCompany: 2,
    },
]

const statusConfig = {
    new: {
        label: 'New',
        color: 'bg-green-500/10 text-green-400 ring-green-500/20',
        icon: Clock,
    },
    contacted: {
        label: 'Contacted',
        color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
        icon: Mail,
    },
    qualified: {
        label: 'Qualified',
        color: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
        icon: UserCheck,
    },
    rejected: {
        label: 'Not Interested',
        color: 'bg-red-500/10 text-red-400 ring-red-500/20',
        icon: UserX,
    },
}

const stats = [
    { label: 'Total Contacts', value: leads.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'New', value: leads.filter(l => l.status === 'new').length, icon: Clock, color: 'from-green-500 to-emerald-500' },
    { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, icon: Mail, color: 'from-purple-500 to-pink-500' },
    { label: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, icon: UserCheck, color: 'from-orange-500 to-amber-500' },
]

export default function LeadsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null)
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(filteredLeads.map(l => l.id))
        }
    }

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Leads</h1>
                    <p className="text-sm text-white/40">
                        Key contacts from enriched companies
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedLeads.length > 0 && (
                        <span className="text-xs text-white/40">{selectedLeads.length} selected</span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white">
                        <Download className="mr-1.5 size-3.5" />
                        Export CSV
                    </Button>
                </div>
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
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="h-8 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {['all', 'new', 'contacted', 'qualified'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    statusFilter === status
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                )}>
                                {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
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
                                            selectedLeads.length === filteredLeads.length && filteredLeads.length > 0
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-white/20 hover:border-white/40'
                                        )}>
                                        {selectedLeads.length === filteredLeads.length && filteredLeads.length > 0 && (
                                            <Check className="size-2.5 text-white" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Contact</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Company</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Email</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">LinkedIn</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Status</th>
                                <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Source</th>
                                <th className="px-3 py-2.5 text-right text-xs font-medium text-white/40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLeads.map((lead) => {
                                const status = statusConfig[lead.status as keyof typeof statusConfig]
                                return (
                                    <tr
                                        key={lead.id}
                                        className={cn(
                                            'transition-colors hover:bg-white/[0.03]',
                                            selectedLeads.includes(lead.id) && 'bg-purple-500/5'
                                        )}>
                                        <td className="px-3 py-2.5">
                                            <button
                                                onClick={() => toggleSelectLead(lead.id)}
                                                className={cn(
                                                    'flex size-4 items-center justify-center rounded border transition-all',
                                                    selectedLeads.includes(lead.id)
                                                        ? 'border-purple-500 bg-purple-500'
                                                        : 'border-white/20 hover:border-white/40'
                                                )}>
                                                {selectedLeads.includes(lead.id) && (
                                                    <Check className="size-2.5 text-white" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-[10px] font-medium text-white ring-1 ring-inset ring-white/10">
                                                    {lead.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="min-w-0">
                                                    <button
                                                        onClick={() => setSelectedLead(lead)}
                                                        className="text-sm font-medium text-white hover:underline truncate block max-w-[140px]">
                                                        {lead.name}
                                                    </button>
                                                    <div className="text-xs text-white/30 truncate max-w-[140px]">{lead.title}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-5 shrink-0 items-center justify-center rounded bg-white/10 text-[10px] font-medium text-white">
                                                    {lead.companyLogo}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-white truncate max-w-[80px]">{lead.company}</div>
                                                    <div className="text-[10px] text-white/30">{lead.jobsAtCompany} jobs</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <button
                                                onClick={() => copyToClipboard(lead.email, `email-${lead.id}`)}
                                                className="group flex items-center gap-1 text-xs text-white/60 hover:text-white">
                                                <span className="truncate max-w-[140px]">{lead.email}</span>
                                                {copiedField === `email-${lead.id}` ? (
                                                    <Check className="size-3 shrink-0 text-green-400" />
                                                ) : (
                                                    <Copy className="size-3 shrink-0 opacity-0 group-hover:opacity-100" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <a
                                                href={`https://${lead.linkedin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                                                <Linkedin className="size-3" />
                                                <span className="hidden sm:inline">Profile</span>
                                            </a>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                status.color
                                            )}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-xs text-white/30 truncate block max-w-[100px]">
                                                {lead.source}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => setSelectedLead(lead)}
                                                    className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                    <ExternalLink className="size-3.5" />
                                                </button>
                                                <button className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                    <MoreHorizontal className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLeads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                            <Users className="size-4 text-white/30" />
                        </div>
                        <h3 className="mt-3 text-sm font-medium text-white">No contacts found</h3>
                        <p className="mt-1 max-w-sm text-xs text-white/40">
                            Contacts appear here after you enrich companies.
                        </p>
                        <Button
                            className="mt-3 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white hover:from-purple-600 hover:to-blue-600"
                            asChild>
                            <a href="/dashboard/companies">
                                <Sparkles className="mr-1.5 size-3" />
                                Go to Companies
                            </a>
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {filteredLeads.length > 0 && (
                    <div className="flex items-center justify-between border-t border-white/5 px-3 py-2.5">
                        <div className="text-xs text-white/40">
                            Showing <span className="font-medium text-white/60">{filteredLeads.length}</span> of{' '}
                            <span className="font-medium text-white/60">{leads.length}</span> contacts
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30">
                                <ChevronLeft className="mr-1 size-3" />
                                Previous
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                Next
                                <ChevronRight className="ml-1 size-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Lead Detail Modal */}
            <LeadDetailModal
                lead={selectedLead ? {
                    ...selectedLead,
                    experience: '5+ years',
                    skills: ['Leadership', 'Technical Strategy', 'Team Building'],
                } : null}
                open={!!selectedLead}
                onOpenChange={(open) => !open && setSelectedLead(null)}
            />
        </div>
    )
}
