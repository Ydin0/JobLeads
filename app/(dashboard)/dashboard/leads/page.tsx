'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Download,
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
    Loader2,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLeads } from '@/hooks/use-leads'
import Link from 'next/link'

const statusConfig = {
    new: { label: 'New', icon: Clock, color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
    contacted: { label: 'Contacted', icon: Mail, color: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
    qualified: { label: 'Qualified', icon: UserCheck, color: 'bg-green-500/10 text-green-400 ring-green-500/20' },
    rejected: { label: 'Rejected', icon: UserX, color: 'bg-red-500/10 text-red-400 ring-red-500/20' },
}

export default function LeadsPage() {
    const { leads, isLoading, updateLead } = useLeads()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'rejected'>('all')
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const leadsPerPage = 10

    const stats = [
        { label: 'Total Leads', value: leads.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'New', value: leads.filter(l => l.status === 'new').length, icon: Clock, color: 'from-purple-500 to-pink-500' },
        { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, icon: Mail, color: 'from-yellow-500 to-orange-500' },
        { label: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
    ]

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
    const paginatedLeads = filteredLeads.slice(
        (currentPage - 1) * leadsPerPage,
        currentPage * leadsPerPage
    )

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id))
        }
    }

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateLead(id, { status: newStatus as 'new' | 'contacted' | 'qualified' | 'rejected' })
        } catch (error) {
            console.error('Error updating lead status:', error)
        }
    }

    const formatDate = (date: Date | string | null) => {
        if (!date) return '—'
        return new Date(date).toLocaleDateString()
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Leads</h1>
                    <p className="text-sm text-white/40">
                        Contacts found from enriched companies
                    </p>
                </div>
                {selectedLeads.length > 0 && (
                    <Button
                        className="h-8 bg-white text-sm text-black hover:bg-white/90">
                        <Download className="mr-1.5 size-3.5" />
                        Export {selectedLeads.length} leads
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
                            placeholder="Search leads..."
                            className="h-8 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'new', label: 'New' },
                            { id: 'contacted', label: 'Contacted' },
                            { id: 'qualified', label: 'Qualified' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    statusFilter === filter.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                )}>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-white/40" />
                </div>
            )}

            {/* Leads Table */}
            {!isLoading && paginatedLeads.length > 0 && (
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
                                                selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-white/20 hover:border-white/40'
                                            )}>
                                            {selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0 && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Contact</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Title</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Email</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Status</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Found</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-white/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedLeads.map((lead) => {
                                    const status = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new
                                    const StatusIcon = status.icon

                                    return (
                                        <tr
                                            key={lead.id}
                                            className={cn(
                                                'group transition-colors hover:bg-white/[0.03]',
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
                                                    <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
                                                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-white">
                                                            {lead.firstName} {lead.lastName}
                                                        </div>
                                                        <div className="text-xs text-white/30">{lead.location || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <span className="text-xs text-white/60">{lead.jobTitle || '—'}</span>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                {lead.email ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-white/60">{lead.email}</span>
                                                        <button
                                                            onClick={() => copyEmail(lead.email!)}
                                                            className="rounded p-0.5 text-white/20 transition-colors hover:bg-white/10 hover:text-white">
                                                            <Copy className="size-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-white/30">—</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset cursor-pointer bg-transparent',
                                                        status.color
                                                    )}>
                                                    <option value="new" className="bg-[#0a0a0f]">New</option>
                                                    <option value="contacted" className="bg-[#0a0a0f]">Contacted</option>
                                                    <option value="qualified" className="bg-[#0a0a0f]">Qualified</option>
                                                    <option value="rejected" className="bg-[#0a0a0f]">Rejected</option>
                                                </select>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <span className="text-xs text-white/40">{formatDate(lead.createdAt)}</span>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    {lead.linkedinUrl && (
                                                        <a
                                                            href={lead.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <Linkedin className="size-3.5" />
                                                        </a>
                                                    )}
                                                    {lead.email && (
                                                        <a
                                                            href={`mailto:${lead.email}`}
                                                            className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <Mail className="size-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-4 py-2">
                            <div className="text-xs text-white/40">
                                Showing {((currentPage - 1) * leadsPerPage) + 1} to {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30">
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="px-2 text-xs text-white/60">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30">
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredLeads.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                        <Users className="size-4 text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-white">No leads yet</h3>
                    <p className="mt-1 max-w-sm text-xs text-white/40">
                        {leads.length === 0
                            ? 'Enrich companies to find contact leads'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {leads.length === 0 && (
                        <Link href="/dashboard/companies">
                            <Button className="mt-4 h-8 bg-white text-sm text-black hover:bg-white/90">
                                <Building2 className="mr-1.5 size-3.5" />
                                Go to Companies
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
