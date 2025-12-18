'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
    Briefcase,
    MapPin,
    Clock,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import type { Job } from '@/lib/db/schema'

interface JobsSummaryProps {
    jobs: Job[]
    maxVisible?: number
}

const departmentColors: Record<string, { bg: string; text: string }> = {
    engineering: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' },
    sales: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400' },
    marketing: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
    hr: { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' },
    finance: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400' },
    operations: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
    design: { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
    product: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' },
    customer_success: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400' },
    legal: { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
    other: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400' },
}

function JobRow({ job }: { job: Job }) {
    const dept = job.department || 'other'
    const colors = departmentColors[dept] || departmentColors.other
    const techStack = (job.techStack as string[]) || []

    return (
        <div className="group rounded-lg border border-black/5 bg-black/[0.01] p-2.5 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-black dark:text-white">
                            {job.title}
                        </span>
                        {job.department && (
                            <span
                                className={cn(
                                    'rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize',
                                    colors.bg,
                                    colors.text
                                )}
                            >
                                {job.department.replace('_', ' ')}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] text-black/40 dark:text-white/40">
                        {job.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="size-2.5" />
                                {job.location}
                            </span>
                        )}
                        {job.workType && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="size-2.5" />
                                {job.workType}
                            </span>
                        )}
                        {job.postedTime && (
                            <span className="flex items-center gap-1">
                                <Clock className="size-2.5" />
                                {job.postedTime}
                            </span>
                        )}
                    </div>

                    {techStack.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {techStack.slice(0, 5).map((tech, index) => (
                                <span
                                    key={index}
                                    className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400"
                                >
                                    {tech}
                                </span>
                            ))}
                            {techStack.length > 5 && (
                                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-black/40 dark:bg-white/5 dark:text-white/40">
                                    +{techStack.length - 5} more
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {job.jobUrl && (
                    <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded p-1 text-black/30 opacity-0 transition-all hover:bg-black/5 hover:text-black/60 group-hover:opacity-100 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                        title="View job posting"
                    >
                        <ExternalLink className="size-3" />
                    </a>
                )}
            </div>
        </div>
    )
}

function DepartmentSummary({ jobs }: { jobs: Job[] }) {
    const deptCounts = jobs.reduce(
        (acc, job) => {
            const dept = job.department || 'other'
            acc[dept] = (acc[dept] || 0) + 1
            return acc
        },
        {} as Record<string, number>
    )

    return (
        <div className="flex flex-wrap gap-1.5">
            {Object.entries(deptCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                    const colors = departmentColors[dept] || departmentColors.other
                    return (
                        <span
                            key={dept}
                            className={cn(
                                'rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize',
                                colors.bg,
                                colors.text
                            )}
                        >
                            {dept.replace('_', ' ')}: {count}
                        </span>
                    )
                })}
        </div>
    )
}

export function JobsSummary({ jobs, maxVisible = 3 }: JobsSummaryProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (jobs.length === 0) {
        return (
            <div className="py-3 text-center text-xs text-black/40 dark:text-white/40">
                No job postings found
            </div>
        )
    }

    const visibleJobs = isExpanded ? jobs : jobs.slice(0, maxVisible)
    const hasMore = jobs.length > maxVisible

    return (
        <div className="space-y-3">
            {/* Summary Stats */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Briefcase className="size-3.5 text-black/40 dark:text-white/40" />
                    <span className="text-xs font-medium text-black dark:text-white">
                        {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Department breakdown */}
            <DepartmentSummary jobs={jobs} />

            {/* Job listings */}
            <div className="space-y-2">
                {visibleJobs.map((job) => (
                    <JobRow key={job.id} job={job} />
                ))}
            </div>

            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-black/40 transition-colors hover:bg-black/[0.02] hover:text-black/60 dark:text-white/40 dark:hover:bg-white/[0.02] dark:hover:text-white/60"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="size-3" />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="size-3" />
                            Show all {jobs.length} positions
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
