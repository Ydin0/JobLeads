'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    User,
    Shuffle,
    Settings2,
    Search,
    ChevronRight,
    Target,
    Check,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Mock companies from database
const mockCompanies = [
    { id: '1', name: 'Acme Corporation', industry: 'Software', size: '201-500', location: 'San Francisco, CA' },
    { id: '2', name: 'TechStart Inc', industry: 'SaaS', size: '51-200', location: 'New York, NY' },
    { id: '3', name: 'DataFlow Systems', industry: 'Data Analytics', size: '11-50', location: 'Austin, TX' },
    { id: '4', name: 'CloudScale', industry: 'Cloud Computing', size: '501-1000', location: 'Seattle, WA' },
    { id: '5', name: 'InnovateTech', industry: 'AI/ML', size: '51-200', location: 'Boston, MA' },
]

// Mock ICPs
const mockICPs = [
    { id: '1', name: 'Enterprise SaaS', companiesCount: 45 },
    { id: '2', name: 'Mid-Market Tech', companiesCount: 78 },
    { id: '3', name: 'Startup Founders', companiesCount: 23 },
]

// Mock contacts/leads
const mockContacts = [
    { id: '1', name: 'Sarah Johnson', title: 'VP of Sales', companyId: '1' },
    { id: '2', name: 'John Smith', title: 'CTO', companyId: '1' },
    { id: '3', name: 'Emily Davis', title: 'Director of Ops', companyId: '2' },
]

type SourceType = 'company' | 'icp' | 'custom'
type DifficultyType = 'easy' | 'medium' | 'hard'

export default function SetupPage() {
    const router = useRouter()

    // Form state
    const [sourceType, setSourceType] = useState<SourceType>('company')
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
    const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null)
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
    const [useAutoPersona, setUseAutoPersona] = useState(true)
    const [difficulty, setDifficulty] = useState<DifficultyType>('medium')
    const [customInstructions, setCustomInstructions] = useState('')
    const [companySearch, setCompanySearch] = useState('')

    const filteredCompanies = mockCompanies.filter((c) =>
        c.name.toLowerCase().includes(companySearch.toLowerCase())
    )

    const selectedCompany = mockCompanies.find((c) => c.id === selectedCompanyId)
    const companyContacts = mockContacts.filter((c) => c.companyId === selectedCompanyId)

    const handleStartBriefing = () => {
        const callId = `call-${Date.now()}`
        const params = new URLSearchParams({
            mode: 'manual',
            difficulty,
        })
        if (selectedCompanyId) params.set('companyId', selectedCompanyId)
        if (selectedContactId) params.set('contactId', selectedContactId)
        if (selectedIcpId) params.set('icpId', selectedIcpId)
        if (customInstructions) params.set('instructions', customInstructions)

        router.push(`/dashboard/trainer/call/${callId}/brief?${params.toString()}`)
    }

    const isValid =
        (sourceType === 'company' && selectedCompanyId) ||
        (sourceType === 'icp' && selectedIcpId) ||
        sourceType === 'custom'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/trainer"
                    className="flex size-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-lg font-semibold text-black dark:text-white">
                        Setup Practice Call
                    </h1>
                    <p className="text-sm text-black/50 dark:text-white/50">
                        Configure your custom practice scenario
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Step 1: Select Source */}
                    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white">
                            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-semibold text-[#E07D2A] dark:from-rose-500/20 dark:to-orange-500/20 dark:text-orange-300">
                                1
                            </span>
                            Select Source
                        </h2>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <button
                                onClick={() => setSourceType('company')}
                                className={cn(
                                    'rounded-xl border p-4 text-left transition-all',
                                    sourceType === 'company'
                                        ? 'border-black/20 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:border-white/20 dark:from-white/[0.05] dark:to-white/[0.02]'
                                        : 'border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20'
                                )}
                            >
                                <div className={cn(
                                    'flex size-10 items-center justify-center rounded-lg',
                                    sourceType === 'company'
                                        ? 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10'
                                        : 'bg-black/5 dark:bg-white/5'
                                )}>
                                    <Building2 className={cn(
                                        'size-5',
                                        sourceType === 'company' ? 'text-rose-400 dark:text-rose-300' : 'text-black/40 dark:text-white/40'
                                    )} />
                                </div>
                                <div className="mt-3 text-sm font-medium text-black dark:text-white">
                                    Real Company
                                </div>
                                <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                                    Select from your database
                                </div>
                            </button>

                            <button
                                onClick={() => setSourceType('icp')}
                                className={cn(
                                    'rounded-xl border p-4 text-left transition-all',
                                    sourceType === 'icp'
                                        ? 'border-black/20 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:border-white/20 dark:from-white/[0.05] dark:to-white/[0.02]'
                                        : 'border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20'
                                )}
                            >
                                <div className={cn(
                                    'flex size-10 items-center justify-center rounded-lg',
                                    sourceType === 'icp'
                                        ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-500/10 dark:to-violet-500/10'
                                        : 'bg-black/5 dark:bg-white/5'
                                )}>
                                    <Shuffle className={cn(
                                        'size-5',
                                        sourceType === 'icp' ? 'text-purple-400 dark:text-purple-300' : 'text-black/40 dark:text-white/40'
                                    )} />
                                </div>
                                <div className="mt-3 text-sm font-medium text-black dark:text-white">
                                    Random from ICP
                                </div>
                                <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                                    Pick random from an ICP
                                </div>
                            </button>

                            <button
                                onClick={() => setSourceType('custom')}
                                className={cn(
                                    'rounded-xl border p-4 text-left transition-all',
                                    sourceType === 'custom'
                                        ? 'border-black/20 bg-gradient-to-br from-slate-50 to-slate-50/50 dark:border-white/20 dark:from-white/[0.05] dark:to-white/[0.02]'
                                        : 'border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20'
                                )}
                            >
                                <div className={cn(
                                    'flex size-10 items-center justify-center rounded-lg',
                                    sourceType === 'custom'
                                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10'
                                        : 'bg-black/5 dark:bg-white/5'
                                )}>
                                    <Settings2 className={cn(
                                        'size-5',
                                        sourceType === 'custom' ? 'text-emerald-500 dark:text-emerald-400' : 'text-black/40 dark:text-white/40'
                                    )} />
                                </div>
                                <div className="mt-3 text-sm font-medium text-black dark:text-white">
                                    Custom Scenario
                                </div>
                                <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                                    AI generates a scenario
                                </div>
                            </button>
                        </div>

                        {/* Company Selection */}
                        {sourceType === 'company' && (
                            <div className="mt-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                    <input
                                        type="text"
                                        value={companySearch}
                                        onChange={(e) => setCompanySearch(e.target.value)}
                                        placeholder="Search companies..."
                                        className="w-full rounded-lg border border-black/10 bg-black/[0.02] py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                                    />
                                </div>

                                <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
                                    {filteredCompanies.map((company) => (
                                        <button
                                            key={company.id}
                                            onClick={() => {
                                                setSelectedCompanyId(company.id)
                                                setSelectedContactId(null)
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                                                selectedCompanyId === company.id
                                                    ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-white/[0.05] dark:to-white/[0.02]'
                                                    : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                                            )}
                                        >
                                            <div className={cn(
                                                'flex size-9 items-center justify-center rounded-lg',
                                                selectedCompanyId === company.id
                                                    ? 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10'
                                                    : 'bg-black/5 dark:bg-white/5'
                                            )}>
                                                <Building2 className={cn(
                                                    'size-4',
                                                    selectedCompanyId === company.id
                                                        ? 'text-rose-400 dark:text-rose-300'
                                                        : 'text-black/40 dark:text-white/40'
                                                )} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-black dark:text-white">
                                                    {company.name}
                                                </div>
                                                <div className="text-xs text-black/50 dark:text-white/50">
                                                    {company.industry} • {company.size}
                                                </div>
                                            </div>
                                            {selectedCompanyId === company.id && (
                                                <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                                                    <Check className="size-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ICP Selection */}
                        {sourceType === 'icp' && (
                            <div className="mt-4 space-y-1.5">
                                {mockICPs.map((icp) => (
                                    <button
                                        key={icp.id}
                                        onClick={() => setSelectedIcpId(icp.id)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                                            selectedIcpId === icp.id
                                                ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-white/[0.05] dark:to-white/[0.02]'
                                                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                                        )}
                                    >
                                        <div className={cn(
                                            'flex size-9 items-center justify-center rounded-lg',
                                            selectedIcpId === icp.id
                                                ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-500/10 dark:to-violet-500/10'
                                                : 'bg-black/5 dark:bg-white/5'
                                        )}>
                                            <Target className={cn(
                                                'size-4',
                                                selectedIcpId === icp.id
                                                    ? 'text-purple-400 dark:text-purple-300'
                                                    : 'text-black/40 dark:text-white/40'
                                            )} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-black dark:text-white">
                                                {icp.name}
                                            </div>
                                            <div className="text-xs text-black/50 dark:text-white/50">
                                                {icp.companiesCount} companies
                                            </div>
                                        </div>
                                        {selectedIcpId === icp.id && (
                                            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                                                <Check className="size-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Custom Scenario Info */}
                        {sourceType === 'custom' && (
                            <div className="mt-4 flex items-start gap-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4 dark:from-emerald-500/10 dark:to-teal-500/5">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                                <p className="text-sm text-black/70 dark:text-white/70">
                                    AI will generate a realistic company and contact based on your custom instructions below.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Contact Selection (only for real company) */}
                    {sourceType === 'company' && selectedCompanyId && (
                        <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                            <h2 className="flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white">
                                <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-semibold text-[#E07D2A] dark:from-rose-500/20 dark:to-orange-500/20 dark:text-orange-300">
                                    2
                                </span>
                                Select Contact
                            </h2>

                            <div className="mt-4 space-y-1.5">
                                <button
                                    onClick={() => {
                                        setUseAutoPersona(true)
                                        setSelectedContactId(null)
                                    }}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                                        useAutoPersona
                                            ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-white/[0.05] dark:to-white/[0.02]'
                                            : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                                    )}
                                >
                                    <div className={cn(
                                        'flex size-9 items-center justify-center rounded-lg',
                                        useAutoPersona
                                            ? 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-500/10 dark:to-violet-500/10'
                                            : 'bg-black/5 dark:bg-white/5'
                                    )}>
                                        <Sparkles className={cn(
                                            'size-4',
                                            useAutoPersona
                                                ? 'text-purple-400 dark:text-purple-300'
                                                : 'text-black/40 dark:text-white/40'
                                        )} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-black dark:text-white">
                                                Auto-generate Persona
                                            </span>
                                            <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:bg-purple-500/20 dark:text-purple-300">
                                                AI
                                            </span>
                                        </div>
                                        <div className="text-xs text-black/50 dark:text-white/50">
                                            AI creates a realistic contact for this company
                                        </div>
                                    </div>
                                    {useAutoPersona && (
                                        <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                                            <Check className="size-3 text-white" />
                                        </div>
                                    )}
                                </button>

                                {companyContacts.map((contact) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => {
                                            setUseAutoPersona(false)
                                            setSelectedContactId(contact.id)
                                        }}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                                            selectedContactId === contact.id
                                                ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-white/[0.05] dark:to-white/[0.02]'
                                                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                                        )}
                                    >
                                        <div className={cn(
                                            'flex size-9 items-center justify-center rounded-full',
                                            selectedContactId === contact.id
                                                ? 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10'
                                                : 'bg-black/5 dark:bg-white/5'
                                        )}>
                                            <User className={cn(
                                                'size-4',
                                                selectedContactId === contact.id
                                                    ? 'text-rose-400 dark:text-rose-300'
                                                    : 'text-black/40 dark:text-white/40'
                                            )} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-black dark:text-white">
                                                {contact.name}
                                            </div>
                                            <div className="text-xs text-black/50 dark:text-white/50">
                                                {contact.title}
                                            </div>
                                        </div>
                                        {selectedContactId === contact.id && (
                                            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
                                                <Check className="size-3 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Call Settings */}
                    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                        <h2 className="flex items-center gap-2.5 text-sm font-semibold text-black dark:text-white">
                            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-semibold text-[#E07D2A] dark:from-rose-500/20 dark:to-orange-500/20 dark:text-orange-300">
                                {sourceType === 'company' && selectedCompanyId ? '3' : '2'}
                            </span>
                            Call Settings
                        </h2>

                        {/* Difficulty */}
                        <div className="mt-4">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                Difficulty Level
                            </label>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                {(['easy', 'medium', 'hard'] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={cn(
                                            'rounded-lg border py-2.5 text-sm font-medium capitalize transition-all',
                                            difficulty === level
                                                ? level === 'easy'
                                                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-600 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-teal-500/5 dark:text-emerald-400'
                                                    : level === 'medium'
                                                        ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/50 text-orange-600 dark:border-orange-500/30 dark:from-orange-500/10 dark:to-amber-500/5 dark:text-orange-400'
                                                        : 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50/50 text-rose-600 dark:border-rose-500/30 dark:from-rose-500/10 dark:to-pink-500/5 dark:text-rose-400'
                                                : 'border-black/10 text-black/60 hover:border-black/20 dark:border-white/10 dark:text-white/60'
                                        )}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                                {difficulty === 'easy' && 'Prospect is friendly and receptive to your pitch'}
                                {difficulty === 'medium' && 'Prospect has some objections but is open to discussion'}
                                {difficulty === 'hard' && 'Prospect is skeptical and raises multiple objections'}
                            </p>
                        </div>

                        {/* Custom Instructions */}
                        <div className="mt-5">
                            <label className="text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                Custom Instructions (Optional)
                            </label>
                            <textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="e.g., 'Ask about pricing early', 'Be in a hurry', 'Mention competitor products'..."
                                rows={3}
                                className="mt-2 w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2.5 text-sm text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="text-sm font-semibold text-black dark:text-white">Summary</h3>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-black/50 dark:text-white/50">Source</span>
                                <span className="text-sm font-medium text-black dark:text-white">
                                    {sourceType === 'company'
                                        ? selectedCompany?.name || 'Select company'
                                        : sourceType === 'icp'
                                          ? mockICPs.find((i) => i.id === selectedIcpId)?.name || 'Select ICP'
                                          : 'Custom Scenario'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-black/50 dark:text-white/50">Contact</span>
                                <span className="text-sm font-medium text-black dark:text-white">
                                    {sourceType === 'company' && selectedCompanyId
                                        ? useAutoPersona
                                            ? 'Auto-generated'
                                            : mockContacts.find((c) => c.id === selectedContactId)?.name || 'Auto-generated'
                                        : 'Auto-generated'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-black/50 dark:text-white/50">Difficulty</span>
                                <span className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                                    difficulty === 'easy' && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
                                    difficulty === 'medium' && 'bg-[#FEF3E7] text-[#E07D2A] dark:bg-orange-500/10 dark:text-orange-400',
                                    difficulty === 'hard' && 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                )}>
                                    {difficulty}
                                </span>
                            </div>

                            {customInstructions && (
                                <div className="border-t border-black/5 pt-3 dark:border-white/5">
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                        Custom Instructions
                                    </span>
                                    <p className="mt-1.5 text-xs leading-relaxed text-black/70 dark:text-white/70">
                                        {customInstructions}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Start Button with gradient wrapper only when valid */}
                    <div className={cn(
                        'rounded-full p-px',
                        isValid
                            ? 'bg-gradient-to-r from-rose-200/60 via-purple-200/60 to-violet-200/60 dark:from-rose-400/20 dark:via-purple-400/20 dark:to-violet-400/20'
                            : 'bg-black/10 dark:bg-white/10'
                    )}>
                        <Button
                            onClick={handleStartBriefing}
                            disabled={!isValid}
                            className="h-11 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/50 dark:bg-[#0a0a0f] dark:hover:bg-black dark:disabled:bg-white/10"
                        >
                            Start Briefing
                            <ChevronRight className="ml-2 size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
