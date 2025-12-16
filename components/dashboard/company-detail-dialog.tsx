'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    MapPin,
    Briefcase,
    Users,
    ExternalLink,
    Linkedin,
    Globe,
    Clock,
    Sparkles,
    Mail,
    Loader2,
    Check,
    UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Company, Job, Lead, Employee } from '@/lib/db/schema'
import { toast } from 'sonner'

interface CompanyWithRelations extends Company {
    jobs: Job[]
    leads: Lead[]
    employees: Employee[]
}

interface CompanyDetailDialogProps {
    companyId: string | null
    onClose: () => void
    onRefresh?: () => void
}

export function CompanyDetailDialog({ companyId, onClose, onRefresh }: CompanyDetailDialogProps) {
    const [company, setCompany] = useState<CompanyWithRelations | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
    const [activeTab, setActiveTab] = useState<'jobs' | 'employees' | 'leads'>('jobs')
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [isPromoting, setIsPromoting] = useState(false)

    useEffect(() => {
        if (companyId) {
            setIsLoading(true)
            setSelectedEmployees([])
            fetch(`/api/companies/${companyId}`)
                .then(res => res.json())
                .then(data => {
                    setCompany(data)
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error('Error fetching company:', err)
                    setIsLoading(false)
                })

            // Fetch employees separately
            setIsLoadingEmployees(true)
            fetch(`/api/employees?companyId=${companyId}`)
                .then(res => res.json())
                .then(data => {
                    setEmployees(Array.isArray(data) ? data : [])
                    setIsLoadingEmployees(false)
                })
                .catch(err => {
                    console.error('Error fetching employees:', err)
                    setIsLoadingEmployees(false)
                })
        }
    }, [companyId])

    const toggleEmployeeSelection = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        )
    }

    const toggleSelectAll = () => {
        const unshortlistedEmployees = employees.filter(e => !e.isShortlisted)
        if (selectedEmployees.length === unshortlistedEmployees.length) {
            setSelectedEmployees([])
        } else {
            setSelectedEmployees(unshortlistedEmployees.map(e => e.id))
        }
    }

    const promoteToLeads = async () => {
        if (selectedEmployees.length === 0) return

        setIsPromoting(true)
        try {
            const response = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeIds: selectedEmployees }),
            })

            if (!response.ok) {
                throw new Error('Failed to promote employees')
            }

            const result = await response.json()
            toast.success(`Added ${result.leadsCreated} contacts to leads`)

            // Refresh employees list
            const empResponse = await fetch(`/api/employees?companyId=${companyId}`)
            const empData = await empResponse.json()
            setEmployees(Array.isArray(empData) ? empData : [])

            setSelectedEmployees([])
            onRefresh?.()
        } catch (error) {
            console.error('Error promoting employees:', error)
            toast.error('Failed to add contacts to leads')
        } finally {
            setIsPromoting(false)
        }
    }

    if (!companyId) return null

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Unknown'
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const unshortlistedEmployees = employees.filter(e => !e.isShortlisted)
    const shortlistedEmployees = employees.filter(e => e.isShortlisted)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/95">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />

                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-black/40 dark:text-white/40" />
                    </div>
                ) : company ? (
                    <>
                        {/* Header */}
                        <div className="relative flex shrink-0 items-start justify-between border-b border-black/5 p-4 dark:border-white/5">
                            <div className="flex items-start gap-4">
                                {company.logoUrl ? (
                                    <img
                                        src={company.logoUrl}
                                        alt={company.name}
                                        className="size-14 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-black/10 to-black/5 text-xl font-bold text-black ring-1 ring-inset ring-black/10 dark:from-white/10 dark:to-white/5 dark:text-white dark:ring-white/10">
                                        {company.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-lg font-semibold text-black dark:text-white">{company.name}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-black/40 dark:text-white/40">
                                        {company.industry && (
                                            <span className="rounded bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{company.industry}</span>
                                        )}
                                        {company.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3" />
                                                {company.location}
                                            </span>
                                        )}
                                        {company.size && (
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {company.size}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {company.linkedinUrl && (
                                            <a
                                                href={company.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400">
                                                <Linkedin className="size-3" />
                                                LinkedIn
                                            </a>
                                        )}
                                        {company.websiteUrl && (
                                            <a
                                                href={company.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-md bg-black/5 px-2 py-1 text-xs text-black/60 transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10">
                                                <Globe className="size-3" />
                                                Website
                                            </a>
                                        )}
                                        {company.isEnriched && (
                                            <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                                                <Sparkles className="size-3" />
                                                Enriched
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-black/40 transition-colors hover:bg-black/10 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="relative grid shrink-0 grid-cols-4 gap-3 border-b border-black/5 p-4 dark:border-white/5">
                            <div className="rounded-lg bg-black/5 p-3 text-center dark:bg-white/5">
                                <div className="text-2xl font-semibold text-black dark:text-white">{company.jobs?.length || 0}</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Open Positions</div>
                            </div>
                            <div className="rounded-lg bg-black/5 p-3 text-center dark:bg-white/5">
                                <div className="text-2xl font-semibold text-black dark:text-white">{employees.length}</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Employees Found</div>
                            </div>
                            <div className="rounded-lg bg-black/5 p-3 text-center dark:bg-white/5">
                                <div className="text-2xl font-semibold text-black dark:text-white">{shortlistedEmployees.length}</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Added to Leads</div>
                            </div>
                            <div className="rounded-lg bg-black/5 p-3 text-center dark:bg-white/5">
                                <div className="text-2xl font-semibold text-black dark:text-white">{formatDate(company.createdAt)}</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Added</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="relative flex shrink-0 items-center justify-between border-b border-black/5 px-4 dark:border-white/5">
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className={cn(
                                        'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                        activeTab === 'jobs'
                                            ? 'border-black text-black dark:border-white dark:text-white'
                                            : 'border-transparent text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                                    )}>
                                    <Briefcase className="size-4" />
                                    Jobs ({company.jobs?.length || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('employees')}
                                    className={cn(
                                        'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                        activeTab === 'employees'
                                            ? 'border-black text-black dark:border-white dark:text-white'
                                            : 'border-transparent text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                                    )}>
                                    <Users className="size-4" />
                                    Employees ({employees.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('leads')}
                                    className={cn(
                                        'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                        activeTab === 'leads'
                                            ? 'border-black text-black dark:border-white dark:text-white'
                                            : 'border-transparent text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                                    )}>
                                    <UserPlus className="size-4" />
                                    Leads ({company.leads?.length || 0})
                                </button>
                            </div>

                            {/* Add to Leads Button */}
                            {activeTab === 'employees' && selectedEmployees.length > 0 && (
                                <Button
                                    onClick={promoteToLeads}
                                    disabled={isPromoting}
                                    className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                    {isPromoting ? (
                                        <Loader2 className="mr-1.5 size-3 animate-spin" />
                                    ) : (
                                        <UserPlus className="mr-1.5 size-3" />
                                    )}
                                    Add {selectedEmployees.length} to Leads
                                </Button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-4">
                            {activeTab === 'jobs' && (
                                <div className="space-y-2">
                                    {company.jobs && company.jobs.length > 0 ? (
                                        company.jobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="group rounded-lg border border-black/5 bg-black/[0.02] p-3 transition-all hover:border-black/10 hover:bg-black/[0.04] dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-medium text-black dark:text-white">{job.title}</h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/40 dark:text-white/40">
                                                            {job.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="size-3" />
                                                                    {job.location}
                                                                </span>
                                                            )}
                                                            {job.contractType && (
                                                                <span className="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">{job.contractType}</span>
                                                            )}
                                                            {job.experienceLevel && (
                                                                <span className="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">{job.experienceLevel}</span>
                                                            )}
                                                            {job.salary && (
                                                                <span className="text-green-600 dark:text-green-400">{job.salary}</span>
                                                            )}
                                                        </div>
                                                        {job.postedTime && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-black/30 dark:text-white/30">
                                                                <Clock className="size-3" />
                                                                {job.postedTime}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {job.jobUrl && (
                                                        <a
                                                            href={job.jobUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1.5 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                            <ExternalLink className="size-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                                <Briefcase className="size-5 text-black/30 dark:text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-black/40 dark:text-white/40">No jobs found</p>
                                            <p className="text-xs text-black/30 dark:text-white/30">Run a search to find open positions</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'employees' && (
                                <div className="space-y-3">
                                    {isLoadingEmployees ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                                        </div>
                                    ) : employees.length > 0 ? (
                                        <>
                                            {/* Select All */}
                                            {unshortlistedEmployees.length > 0 && (
                                                <div className="flex items-center justify-between border-b border-black/5 pb-3 dark:border-white/5">
                                                    <button
                                                        onClick={toggleSelectAll}
                                                        className="text-xs text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white">
                                                        {selectedEmployees.length === unshortlistedEmployees.length && unshortlistedEmployees.length > 0
                                                            ? 'Deselect all'
                                                            : `Select all (${unshortlistedEmployees.length})`}
                                                    </button>
                                                    <span className="text-xs text-black/30 dark:text-white/30">
                                                        {selectedEmployees.length} selected
                                                    </span>
                                                </div>
                                            )}

                                            {/* Employees List */}
                                            <div className="space-y-2">
                                                {employees.map((employee) => (
                                                    <div
                                                        key={employee.id}
                                                        onClick={() => !employee.isShortlisted && toggleEmployeeSelection(employee.id)}
                                                        className={cn(
                                                            "group rounded-lg border p-3 transition-all",
                                                            employee.isShortlisted
                                                                ? "cursor-default border-green-500/20 bg-green-500/5"
                                                                : "cursor-pointer border-black/5 bg-black/[0.02] hover:border-black/10 hover:bg-black/[0.04] dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]",
                                                            selectedEmployees.includes(employee.id) && "border-purple-500/30 bg-purple-500/5"
                                                        )}>
                                                        <div className="flex items-center gap-3">
                                                            {/* Checkbox */}
                                                            {!employee.isShortlisted && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toggleEmployeeSelection(employee.id)
                                                                    }}
                                                                    className={cn(
                                                                        'flex size-5 items-center justify-center rounded border transition-all',
                                                                        selectedEmployees.includes(employee.id)
                                                                            ? 'border-purple-500 bg-purple-500'
                                                                            : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                                                                    )}>
                                                                    {selectedEmployees.includes(employee.id) && (
                                                                        <Check className="size-3 text-white" />
                                                                    )}
                                                                </button>
                                                            )}

                                                            {/* Avatar */}
                                                            <div className={cn(
                                                                "flex size-10 items-center justify-center rounded-full text-sm font-medium ring-1 ring-inset",
                                                                employee.isShortlisted
                                                                    ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-600 ring-green-500/20 dark:text-green-400"
                                                                    : "bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-600 ring-purple-500/20 dark:text-white dark:ring-white/10"
                                                            )}>
                                                                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-sm font-medium text-black dark:text-white">
                                                                        {employee.firstName} {employee.lastName}
                                                                    </h4>
                                                                    {employee.isShortlisted && (
                                                                        <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600 ring-1 ring-inset ring-green-500/20 dark:text-green-400">
                                                                            Added to Leads
                                                                        </span>
                                                                    )}
                                                                    {employee.seniority && (
                                                                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] text-black/50 dark:bg-white/10 dark:text-white/50">
                                                                            {employee.seniority}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-black/40 dark:text-white/40">{employee.jobTitle || 'No title'}</p>
                                                                {employee.department && (
                                                                    <p className="text-xs text-black/30 dark:text-white/30">{employee.department}</p>
                                                                )}
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                                {employee.email && (
                                                                    <a
                                                                        href={`mailto:${employee.email}`}
                                                                        className="rounded p-1.5 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                                        <Mail className="size-4" />
                                                                    </a>
                                                                )}
                                                                {employee.linkedinUrl && (
                                                                    <a
                                                                        href={employee.linkedinUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="rounded p-1.5 text-blue-400/60 transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
                                                                        <Linkedin className="size-4" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                                <Users className="size-5 text-black/30 dark:text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-black/40 dark:text-white/40">No employees found</p>
                                            <p className="text-xs text-black/30 dark:text-white/30">Enrich this company to find employees</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'leads' && (
                                <div className="space-y-2">
                                    {company.leads && company.leads.length > 0 ? (
                                        company.leads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="group rounded-lg border border-black/5 bg-black/[0.02] p-3 transition-all hover:border-black/10 hover:bg-black/[0.04] dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-medium text-purple-600 ring-1 ring-inset ring-purple-500/20 dark:text-white dark:ring-white/10">
                                                        {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-black dark:text-white">
                                                                {lead.firstName} {lead.lastName}
                                                            </h4>
                                                            <span className={cn(
                                                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                                lead.status === 'new' && 'bg-green-500/10 text-green-600 ring-green-500/20 dark:text-green-400',
                                                                lead.status === 'contacted' && 'bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400',
                                                                lead.status === 'qualified' && 'bg-purple-500/10 text-purple-600 ring-purple-500/20 dark:text-purple-400',
                                                                lead.status === 'rejected' && 'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400'
                                                            )}>
                                                                {lead.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-black/40 dark:text-white/40">{lead.jobTitle || 'No title'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {lead.email && (
                                                            <a
                                                                href={`mailto:${lead.email}`}
                                                                className="rounded p-1.5 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                                <Mail className="size-4" />
                                                            </a>
                                                        )}
                                                        {lead.linkedinUrl && (
                                                            <a
                                                                href={lead.linkedinUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded p-1.5 text-blue-400/60 transition-colors hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400">
                                                                <Linkedin className="size-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                                <UserPlus className="size-5 text-black/30 dark:text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-black/40 dark:text-white/40">No leads yet</p>
                                            <p className="text-xs text-black/30 dark:text-white/30">Select employees and add them to leads</p>
                                            <Button
                                                size="sm"
                                                onClick={() => setActiveTab('employees')}
                                                className="mt-3 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                <Users className="mr-1.5 size-3" />
                                                View Employees
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-black/40 dark:text-white/40">Company not found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
