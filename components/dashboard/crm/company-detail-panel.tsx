'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    X,
    Building2,
    Users,
    Briefcase,
    Sparkles,
    Globe,
    Linkedin,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react'
import { ContactsList } from './contacts-list'
import { JobsSummary } from './jobs-summary'
import { AIInsightsSection } from './ai-insights-section'
import { OutreachPlaybookComponent } from './outreach-playbook'
import { GenerateAIPrompt } from './generate-ai-prompt'
import type { CompanyWithLeads, AIContentType } from '@/hooks/use-crm-leads'

interface CompanyDetailPanelProps {
    data: CompanyWithLeads
    isOpen: boolean
    onClose: () => void
    onStatusChange?: (leadId: string, status: string) => void
    onGenerateAI?: (companyId: string, type: AIContentType, regenerate?: boolean) => Promise<void>
    isAILoading?: (companyId: string, type: AIContentType) => boolean
}

type Tab = 'contacts' | 'jobs' | 'insights' | 'playbook'

export function CompanyDetailPanel({
    data,
    isOpen,
    onClose,
    onStatusChange,
    onGenerateAI,
    isAILoading,
}: CompanyDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('contacts')
    const [error, setError] = useState<string | null>(null)
    const { company, leads, jobs, aiInsights, outreachPlaybook } = data

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

    const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { id: 'contacts', label: 'Contacts', icon: Users, count: leads.length },
        { id: 'jobs', label: 'Jobs', icon: Briefcase, count: jobs.length },
        { id: 'insights', label: 'AI Insights', icon: Sparkles },
        { id: 'playbook', label: 'Playbook', icon: Phone },
    ]

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="relative shrink-0 border-b border-black/5 dark:border-white/5">
                    {/* Gradient accent */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/50 to-transparent dark:via-purple-500/50" />

                    {/* Blur orbs */}
                    <div className="absolute -left-20 -top-20 size-40 rounded-full bg-[var(--theme-accent)]/10 blur-3xl dark:bg-purple-500/10" />
                    <div className="absolute -right-20 -top-20 size-40 rounded-full bg-red-500/10 blur-3xl dark:bg-blue-500/10" />

                    <div className="relative flex items-start gap-3 p-4">
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <X className="size-4" />
                        </button>

                        {/* Company Logo */}
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/5 dark:to-white/10">
                            {company.logoUrl ? (
                                <img
                                    src={company.logoUrl}
                                    alt={company.name}
                                    className="size-8 rounded object-contain"
                                />
                            ) : (
                                <Building2 className="size-6 text-black/40 dark:text-white/40" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold text-black dark:text-white">
                                {company.name}
                            </h2>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/40 dark:text-white/40">
                                {company.industry && (
                                    <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
                                        {company.industry}
                                    </span>
                                )}
                                {company.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="size-3" />
                                        {company.location}
                                    </span>
                                )}
                                {company.size && <span>{company.size}</span>}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                {company.linkedinUrl && (
                                    <a
                                        href={company.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                                    >
                                        <Linkedin className="size-3" />
                                        LinkedIn
                                    </a>
                                )}
                                {(company.websiteUrl || company.domain) && (
                                    <a
                                        href={company.websiteUrl || `https://${company.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 rounded-md bg-black/5 px-2 py-1 text-[10px] font-medium text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
                                    >
                                        <Globe className="size-3" />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="relative flex border-t border-black/5 dark:border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'border-b-2 border-[var(--theme-accent)] text-black dark:border-purple-500 dark:text-white'
                                        : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                                )}
                            >
                                <tab.icon className="size-3.5" />
                                {tab.label}
                                {tab.count !== undefined && (
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[10px]',
                                            activeTab === tab.id
                                                ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-purple-500/10 dark:text-purple-400'
                                                : 'bg-black/5 dark:bg-white/10'
                                        )}
                                    >
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'contacts' && (
                        <ContactsList
                            leads={leads}
                            maxVisible={100}
                            onStatusChange={onStatusChange}
                        />
                    )}
                    {activeTab === 'jobs' && <JobsSummary jobs={jobs} maxVisible={100} />}
                    {activeTab === 'insights' && (
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
                    {activeTab === 'playbook' && (
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

                {/* Footer */}
                <div className="shrink-0 border-t border-black/5 bg-black/[0.01] px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-black/40 dark:text-white/40">
                            {leads.length} contact{leads.length !== 1 ? 's' : ''} &middot;{' '}
                            {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                        </div>
                        <Button
                            size="sm"
                            className="h-7 bg-[var(--theme-accent)] px-3 text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
                        >
                            <Mail className="mr-1.5 size-3" />
                            Export Contacts
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
