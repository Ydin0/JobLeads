'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Sparkles,
    Check,
    Plus,
    Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Company {
    id: string
    name: string
    logo: string
}

interface EnrichOptionsModalProps {
    company?: Company | null
    companies?: Company[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onEnrich: (options: EnrichmentOptions) => void
}

export interface EnrichmentOptions {
    managementLevels: string[]
    includeTitles: string[]
}

const managementLevels = [
    { id: 'owner', label: 'Owner' },
    { id: 'founder', label: 'Founder' },
    { id: 'c_suite', label: 'C Suite' },
    { id: 'partner', label: 'Partner' },
    { id: 'vp', label: 'VP' },
    { id: 'head', label: 'Head' },
    { id: 'director', label: 'Director' },
    { id: 'manager', label: 'Manager' },
    { id: 'senior', label: 'Senior' },
    { id: 'entry', label: 'Entry' },
    { id: 'intern', label: 'Intern' },
]

const suggestedTitles = [
    'CTO',
    'VP of Engineering',
    'Head of Talent',
    'Engineering Manager',
    'Technical Recruiter',
    'HR Director',
]

export function EnrichOptionsModal({ company, companies, open, onOpenChange, onEnrich }: EnrichOptionsModalProps) {
    const [selectedLevels, setSelectedLevels] = useState<string[]>(['c_suite', 'vp', 'head', 'director'])
    const [includeTitles, setIncludeTitles] = useState<string[]>([])
    const [titleInput, setTitleInput] = useState('')

    const isBulk = companies && companies.length > 0
    const companyCount = isBulk ? companies.length : 1

    if (!open || (!company && !isBulk)) return null

    const toggleLevel = (id: string) => {
        setSelectedLevels(prev =>
            prev.includes(id)
                ? prev.filter(l => l !== id)
                : [...prev, id]
        )
    }

    const addTitle = (title?: string) => {
        const newTitle = title || titleInput.trim()
        if (newTitle && !includeTitles.includes(newTitle)) {
            setIncludeTitles(prev => [...prev, newTitle])
            setTitleInput('')
        }
    }

    const removeTitle = (title: string) => {
        setIncludeTitles(prev => prev.filter(t => t !== title))
    }

    const handleEnrich = () => {
        onEnrich({
            managementLevels: selectedLevels,
            includeTitles,
        })
        onOpenChange(false)
    }

    const baseCredits = Math.max(3, selectedLevels.length + includeTitles.length)
    const estimatedCredits = baseCredits * companyCount

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                            </h2>
                            <p className="text-xs text-white/40">
                                {isBulk
                                    ? `Find contacts at ${companyCount} selected companies`
                                    : `Find contacts at ${company?.name}`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Company Info */}
                    {isBulk ? (
                        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-bold text-white ring-1 ring-inset ring-white/10">
                                <Building2 className="size-5 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{companyCount} Companies Selected</div>
                                <div className="text-xs text-white/40">Select contact filters below</div>
                            </div>
                        </div>
                    ) : company && (
                        <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-sm font-bold text-white ring-1 ring-inset ring-white/10">
                                {company.logo}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-white">{company.name}</div>
                                <div className="text-xs text-white/40">Select contact filters below</div>
                            </div>
                        </div>
                    )}

                    {/* Management Level */}
                    <div>
                        <label className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-white">Management Level</span>
                            <span className="text-[10px] text-white/30">{selectedLevels.length} selected</span>
                        </label>
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 max-h-[200px] overflow-y-auto space-y-0.5">
                            {managementLevels.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => toggleLevel(level.id)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-all',
                                        selectedLevels.includes(level.id)
                                            ? 'bg-purple-500/10 text-white'
                                            : 'text-white/60 hover:bg-white/5'
                                    )}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            'flex size-4 items-center justify-center rounded border transition-all',
                                            selectedLevels.includes(level.id)
                                                ? 'border-purple-500 bg-purple-500'
                                                : 'border-white/20'
                                        )}>
                                            {selectedLevels.includes(level.id) && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </div>
                                        <span className="text-xs font-medium">{level.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Include Titles */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-white">
                            Include Titles <span className="text-white/30">(optional)</span>
                        </label>

                        {/* Tags */}
                        {includeTitles.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                                {includeTitles.map((title) => (
                                    <span
                                        key={title}
                                        className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-400 ring-1 ring-inset ring-purple-500/20">
                                        {title}
                                        <button
                                            onClick={() => removeTitle(title)}
                                            className="rounded-full p-0.5 hover:bg-purple-500/20">
                                            <X className="size-2.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTitle())}
                                placeholder="e.g., VP of Engineering"
                                className="h-8 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                            />
                            <Button
                                onClick={() => addTitle()}
                                size="sm"
                                className="h-8 bg-white/10 px-2.5 text-xs text-white hover:bg-white/20">
                                <Plus className="size-3" />
                            </Button>
                        </div>

                        {/* Suggestions */}
                        <div className="mt-2">
                            <span className="text-[10px] text-white/30">Suggestions:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {suggestedTitles.filter(t => !includeTitles.includes(t)).slice(0, 4).map((title) => (
                                    <button
                                        key={title}
                                        onClick={() => addTitle(title)}
                                        className="rounded-md border border-dashed border-white/10 px-2 py-0.5 text-[10px] text-white/40 transition-colors hover:border-white/20 hover:text-white/60">
                                        + {title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative border-t border-white/5 bg-white/[0.02] px-4 py-3">
                    {/* Credit estimate */}
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-cyan-500/10 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3 text-cyan-400" />
                            <span className="text-xs text-white/70">Estimated cost</span>
                        </div>
                        <span className="text-xs font-medium text-cyan-400">{estimatedCredits} credits</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleEnrich}
                            disabled={selectedLevels.length === 0}
                            className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 px-4 text-xs text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50">
                            <Sparkles className="mr-1.5 size-3" />
                            {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
