'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Users,
    Check,
    Linkedin,
    Loader2,
    Building2,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Filter,
    X,
    Mail,
    Copy,
    CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployees } from '@/hooks/use-employees'
import Link from 'next/link'
import { toast } from 'sonner'

const seniorityLevels = [
    { id: 'owner', label: 'Owner' },
    { id: 'founder', label: 'Founder' },
    { id: 'c_suite', label: 'C-Suite' },
    { id: 'partner', label: 'Partner' },
    { id: 'vp', label: 'VP' },
    { id: 'head', label: 'Head' },
    { id: 'director', label: 'Director' },
    { id: 'manager', label: 'Manager' },
    { id: 'senior', label: 'Senior' },
    { id: 'entry', label: 'Entry' },
]

export default function PeoplePage() {
    const {
        employees,
        isLoading,
        pagination,
        filters,
        goToPage,
        updateFilters,
        clearFilters,
        promoteToLeads,
    } = useEmployees()

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [isPromoting, setIsPromoting] = useState(false)
    const [showFilters, setShowFilters] = useState(false)

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchQuery !== filters.search) {
                updateFilters({ search: searchQuery || undefined })
            }
        }, 300)
        return () => clearTimeout(timeout)
    }, [searchQuery, filters.search, updateFilters])

    // Get unique companies for filter dropdown
    const uniqueCompanies = useMemo(() => {
        const companies = new Map<string, { id: string; name: string }>()
        employees.forEach(emp => {
            if (emp.company) {
                companies.set(emp.company.id, { id: emp.company.id, name: emp.company.name })
            }
        })
        return Array.from(companies.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [employees])

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.companyId) count++
        if (filters.seniority) count++
        if (filters.jobTitle) count++
        if (filters.location) count++
        return count
    }, [filters])

    const stats = [
        {
            label: 'Total People',
            value: pagination.totalCount,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            label: 'Already Leads',
            value: employees.filter(e => e.isShortlisted).length,
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Available',
            value: employees.filter(e => !e.isShortlisted).length,
            icon: UserPlus,
            color: 'from-purple-500 to-pink-500',
        },
    ]

    const toggleSelectEmployee = (id: string) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        // Only select employees that are not already leads
        const availableEmployees = employees.filter(e => !e.isShortlisted)
        if (selectedEmployees.length === availableEmployees.length && availableEmployees.length > 0) {
            setSelectedEmployees([])
        } else {
            setSelectedEmployees(availableEmployees.map(e => e.id))
        }
    }

    const handlePromoteToLeads = async () => {
        if (selectedEmployees.length === 0) return

        setIsPromoting(true)
        try {
            const result = await promoteToLeads(selectedEmployees)
            toast.success(`Added ${result.leadsCreated} people to leads`)
            setSelectedEmployees([])
        } catch (error) {
            console.error('Error promoting to leads:', error)
            toast.error('Failed to add to leads')
        } finally {
            setIsPromoting(false)
        }
    }

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        toast.success('Email copied')
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-black dark:text-white">People</h1>
                    <p className="text-sm text-black/40 dark:text-white/40">
                        All contacts from enriched companies. Filter and add to leads.
                    </p>
                </div>
                {selectedEmployees.length > 0 && (
                    <Button
                        onClick={handlePromoteToLeads}
                        disabled={isPromoting}
                        className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-sm text-white hover:from-purple-600 hover:to-blue-600">
                        {isPromoting ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                            <UserPlus className="mr-1.5 size-3.5" />
                        )}
                        Add {selectedEmployees.length} to Leads
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] p-3 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-black dark:text-white">{stat.value}</div>
                                <div className="text-sm text-black/40 dark:text-white/40">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, title, email..."
                            className="h-8 w-full rounded-lg border border-black/10 bg-black/5 pl-9 pr-3 text-sm text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:ring-white/10"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                            showFilters || activeFilterCount > 0
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60'
                        )}>
                        <Filter className="size-3" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
                <button
                    onClick={toggleSelectAll}
                    className="text-xs text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white">
                    {selectedEmployees.length === employees.filter(e => !e.isShortlisted).length && employees.filter(e => !e.isShortlisted).length > 0
                        ? 'Deselect all'
                        : 'Select all available'}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-black dark:text-white">Filters</h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60 flex items-center gap-1">
                                <X className="size-3" />
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Company</label>
                            <select
                                value={filters.companyId || ''}
                                onChange={(e) => updateFilters({ companyId: e.target.value || undefined })}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="" className="bg-white dark:bg-[#0a0a0f]">All companies</option>
                                {uniqueCompanies.map(company => (
                                    <option key={company.id} value={company.id} className="bg-white dark:bg-[#0a0a0f]">{company.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Seniority</label>
                            <select
                                value={filters.seniority || ''}
                                onChange={(e) => updateFilters({ seniority: e.target.value || undefined })}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="" className="bg-white dark:bg-[#0a0a0f]">All seniorities</option>
                                {seniorityLevels.map(level => (
                                    <option key={level.id} value={level.id} className="bg-white dark:bg-[#0a0a0f]">{level.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Job Title Contains</label>
                            <input
                                type="text"
                                value={filters.jobTitle || ''}
                                onChange={(e) => updateFilters({ jobTitle: e.target.value || undefined })}
                                placeholder="e.g. Engineer, Manager"
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:ring-white/10"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Location Contains</label>
                            <input
                                type="text"
                                value={filters.location || ''}
                                onChange={(e) => updateFilters({ location: e.target.value || undefined })}
                                placeholder="e.g. San Francisco, UK"
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:ring-white/10"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                </div>
            )}

            {/* People Table */}
            {!isLoading && employees.length > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                                    <th className="w-10 px-3 py-2.5 text-left">
                                        <button
                                            onClick={toggleSelectAll}
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded border transition-all',
                                                selectedEmployees.length === employees.filter(e => !e.isShortlisted).length && employees.filter(e => !e.isShortlisted).length > 0
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                                            )}>
                                            {selectedEmployees.length === employees.filter(e => !e.isShortlisted).length && employees.filter(e => !e.isShortlisted).length > 0 && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="w-[200px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Person</th>
                                    <th className="w-[160px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Company</th>
                                    <th className="w-[160px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Title</th>
                                    <th className="w-[100px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Seniority</th>
                                    <th className="w-[200px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Email</th>
                                    <th className="w-[100px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Status</th>
                                    <th className="w-[80px] px-3 py-2.5 text-right text-xs font-medium text-black/40 dark:text-white/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className={cn(
                                            'group transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
                                            selectedEmployees.includes(employee.id) && 'bg-purple-500/5',
                                            employee.isShortlisted && 'opacity-60'
                                        )}>
                                        <td className="px-3 py-2.5">
                                            {!employee.isShortlisted ? (
                                                <button
                                                    onClick={() => toggleSelectEmployee(employee.id)}
                                                    className={cn(
                                                        'flex size-4 items-center justify-center rounded border transition-all',
                                                        selectedEmployees.includes(employee.id)
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                                                    )}>
                                                    {selectedEmployees.includes(employee.id) && (
                                                        <Check className="size-2.5 text-white" />
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="flex size-4 items-center justify-center">
                                                    <CheckCircle2 className="size-3.5 text-green-500" />
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
                                                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                                </div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <div className="truncate text-sm font-medium text-black dark:text-white">
                                                        {employee.firstName} {employee.lastName}
                                                    </div>
                                                    <div className="truncate text-xs text-black/30 dark:text-white/30">{employee.location || '—'}</div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {employee.company ? (
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    {employee.company.logoUrl ? (
                                                        <img
                                                            src={employee.company.logoUrl}
                                                            alt={employee.company.name}
                                                            className="size-5 shrink-0 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-5 shrink-0 items-center justify-center rounded bg-black/10 text-[10px] font-medium text-black dark:bg-white/10 dark:text-white">
                                                            {employee.company.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="truncate text-xs text-black/60 dark:text-white/60">{employee.company.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <span className="block truncate text-xs text-black/60 dark:text-white/60">{employee.jobTitle || '—'}</span>
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {employee.seniority ? (
                                                <span className="inline-flex rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/5 dark:text-white/60">
                                                    {seniorityLevels.find(s => s.id === employee.seniority)?.label || employee.seniority}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {employee.email ? (
                                                <div className="flex items-center gap-1 overflow-hidden">
                                                    <span className="truncate text-xs text-black/60 dark:text-white/60">{employee.email}</span>
                                                    <button
                                                        onClick={() => copyEmail(employee.email!)}
                                                        className="shrink-0 rounded p-0.5 text-black/20 transition-colors hover:bg-black/10 hover:text-black dark:text-white/20 dark:hover:bg-white/10 dark:hover:text-white">
                                                        <Copy className="size-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            {employee.isShortlisted ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                    <CheckCircle2 className="size-2.5" />
                                                    Lead
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-black/40 ring-1 ring-inset ring-black/10 dark:bg-white/5 dark:text-white/40 dark:ring-white/10">
                                                    Available
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-end gap-1">
                                                {employee.linkedinUrl && (
                                                    <a
                                                        href={employee.linkedinUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                        <Linkedin className="size-3.5" />
                                                    </a>
                                                )}
                                                {employee.email && (
                                                    <a
                                                        href={`mailto:${employee.email}`}
                                                        className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                        <Mail className="size-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-black/5 bg-black/[0.01] px-4 py-2 dark:border-white/5 dark:bg-white/[0.01]">
                            <div className="text-xs text-black/40 dark:text-white/40">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="px-2 text-xs text-black/60 dark:text-white/60">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && employees.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] py-12 text-center dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <Users className="size-4 text-black/30 dark:text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No people found</h3>
                    <p className="mt-1 max-w-sm text-xs text-black/40 dark:text-white/40">
                        {pagination.totalCount === 0 && !activeFilterCount
                            ? 'Enrich companies to find contacts'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {pagination.totalCount === 0 && !activeFilterCount && (
                        <Link href="/dashboard/companies">
                            <Button className="mt-4 h-8 !border-0 !ring-0 bg-gradient-to-r from-orange-500 to-red-500 px-3 text-sm text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:shadow-purple-500/25 dark:hover:from-purple-600 dark:hover:to-blue-600">
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
