'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Building2,
    Users,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Globe,
    Linkedin,
    MapPin,
    ExternalLink,
    Check,
    Sparkles,
    Loader2,
    UserPlus,
} from 'lucide-react'
import { ContactsList } from './contacts-list'
import { JobsSummary } from './jobs-summary'
import { AIInsightsSection } from './ai-insights-section'
import { OutreachPlaybookComponent } from './outreach-playbook'
import { GenerateAIPrompt } from './generate-ai-prompt'
import type { CompanyWithLeads, AIContentType } from '@/hooks/use-crm-leads'

interface CompanyLeadCardProps {
    data: CompanyWithLeads
    isSelected: boolean
    onSelect: (selected: boolean) => void
    onViewDetails: () => void
    onStatusChange?: (leadId: string, status: string) => void
    onGenerateAI?: (companyId: string, type: AIContentType, regenerate?: boolean) => Promise<void>
    isAILoading?: (companyId: string, type: AIContentType) => boolean
    onEnrichEmployees?: () => void
    isEnriching?: boolean
}

type ExpandedSection = 'contacts' | 'jobs' | 'insights' | 'playbook' | null

export function CompanyLeadCard({
    data,
    isSelected,
    onSelect,
    onViewDetails,
    onStatusChange,
    onGenerateAI,
    isAILoading,
    onEnrichEmployees,
    isEnriching,
}: CompanyLeadCardProps) {
    const { company, leads, jobs, aiInsights, outreachPlaybook, hasAiInsights, hasOutreachPlaybook } = data
    const [expandedSection, setExpandedSection] = useState<ExpandedSection>('contacts')
    const [error, setError] = useState<string | null>(null)

    const toggleSection = (section: ExpandedSection) => {
        setExpandedSection(expandedSection === section ? null : section)
    }

    const handleGenerateAI = async (type: AIContentType, regenerate = false) => {
        if (!onGenerateAI) return
        setError(null)
        try {
            await onGenerateAI(company.id, type, regenerate)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate AI content')
        }
    }

    const insightsLoading = isAILoading?.(company.id, 'insights') || false
    const playbookLoading = isAILoading?.(company.id, 'playbook') || false

    const sections = [
        { id: 'contacts' as const, label: 'Contacts', count: leads.length, icon: Users },
        { id: 'jobs' as const, label: 'Jobs', count: jobs.length, icon: Briefcase },
        {
            id: 'insights' as const,
            label: 'Insights',
            icon: Sparkles,
            needsGeneration: !hasAiInsights,
            isLoading: insightsLoading,
        },
        {
            id: 'playbook' as const,
            label: 'Playbook',
            icon: Sparkles,
            needsGeneration: !hasOutreachPlaybook,
            isLoading: playbookLoading,
        },
    ]

    return (
        <div className="relative overflow-hidden rounded-xl border border-black/5 bg-white/70 backdrop-blur-sm transition-all hover:border-black/10 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10">
            {/* Gradient top line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

            {/* Header */}
            <div className="flex items-start gap-3 p-3">
                {/* Checkbox */}
                <button
                    onClick={() => onSelect(!isSelected)}
                    className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                        isSelected
                            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] dark:border-purple-500 dark:bg-purple-500'
                            : 'border-black/20 bg-transparent hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                    )}
                >
                    {isSelected && <Check className="size-3 text-white" />}
                </button>

                {/* Company Logo */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10">
                    {company.logoUrl ? (
                        <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="size-6 rounded object-contain"
                        />
                    ) : (
                        <Building2 className="size-5 text-black/40 dark:text-white/40" />
                    )}
                </div>

                {/* Company Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-black dark:text-white">
                            {company.name}
                        </h3>
                        {company.linkedinUrl && (
                            <a
                                href={company.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black/30 hover:text-blue-600 dark:text-white/30 dark:hover:text-blue-400"
                            >
                                <Linkedin className="size-3.5" />
                            </a>
                        )}
                        {(company.websiteUrl || company.domain) && (
                            <a
                                href={company.websiteUrl || `https://${company.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60"
                            >
                                <Globe className="size-3.5" />
                            </a>
                        )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-black/40 dark:text-white/40">
                        {company.industry && (
                            <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
                                {company.industry}
                            </span>
                        )}
                        {company.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="size-2.5" />
                                {company.location}
                            </span>
                        )}
                        {company.size && <span>{company.size} employees</span>}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex shrink-0 items-center gap-3 text-[10px] text-black/40 dark:text-white/40">
                    <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {leads.length}
                    </span>
                    <span className="flex items-center gap-1">
                        <Briefcase className="size-3" />
                        {jobs.length}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                    {onEnrichEmployees && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEnrichEmployees}
                            disabled={isEnriching}
                            className="h-7 px-2 text-xs text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/10 dark:text-purple-400 dark:hover:bg-purple-500/10"
                        >
                            {isEnriching ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                                <UserPlus className="mr-1 size-3" />
                            )}
                            Enrich
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewDetails}
                        className="h-7 px-2 text-xs"
                    >
                        <ExternalLink className="mr-1 size-3" />
                        View
                    </Button>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex border-t border-black/5 dark:border-white/5">
                {sections.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-medium transition-colors',
                            expandedSection === section.id
                                ? 'bg-black/[0.02] text-black dark:bg-white/[0.02] dark:text-white'
                                : 'text-black/40 hover:bg-black/[0.01] hover:text-black/60 dark:text-white/40 dark:hover:bg-white/[0.01] dark:hover:text-white/60'
                        )}
                    >
                        <section.icon className={cn('size-3', section.isLoading && 'animate-pulse')} />
                        {section.label}
                        {section.count !== undefined && (
                            <span
                                className={cn(
                                    'rounded-full px-1.5 py-0.5 text-[9px]',
                                    expandedSection === section.id
                                        ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-purple-500/10 dark:text-purple-400'
                                        : 'bg-black/5 dark:bg-white/10'
                                )}
                            >
                                {section.count}
                            </span>
                        )}
                        {section.needsGeneration && !section.isLoading && (
                            <span className="size-1.5 rounded-full bg-[var(--theme-accent)] dark:bg-purple-500" title="AI content not generated" />
                        )}
                        {expandedSection === section.id ? (
                            <ChevronDown className="size-3" />
                        ) : (
                            <ChevronRight className="size-3" />
                        )}
                    </button>
                ))}
            </div>

            {/* Expanded Content */}
            {expandedSection && (
                <div className="border-t border-black/5 p-3 dark:border-white/5">
                    {expandedSection === 'contacts' && (
                        <ContactsList leads={leads} onStatusChange={onStatusChange} />
                    )}
                    {expandedSection === 'jobs' && <JobsSummary jobs={jobs} />}
                    {expandedSection === 'insights' && (
                        aiInsights ? (
                            <AIInsightsSection
                                insights={aiInsights}
                                onRegenerate={() => handleGenerateAI('insights', true)}
                                isRegenerating={insightsLoading}
                            />
                        ) : (
                            <GenerateAIPrompt
                                type="insights"
                                isLoading={insightsLoading}
                                onGenerate={() => handleGenerateAI('insights')}
                                error={error}
                            />
                        )
                    )}
                    {expandedSection === 'playbook' && (
                        outreachPlaybook ? (
                            <OutreachPlaybookComponent
                                playbook={outreachPlaybook}
                                onRegenerate={() => handleGenerateAI('playbook', true)}
                                isRegenerating={playbookLoading}
                            />
                        ) : (
                            <GenerateAIPrompt
                                type="playbook"
                                isLoading={playbookLoading}
                                onGenerate={() => handleGenerateAI('playbook')}
                                error={error}
                            />
                        )
                    )}
                </div>
            )}
        </div>
    )
}
