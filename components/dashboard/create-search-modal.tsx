'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    ChevronRight,
    ChevronLeft,
    Search,
    Building2,
    Calendar,
    Check,
    Sparkles,
    Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CreateSearchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSearchCreated?: (search: { id: string }) => void
}

const jobBoards = [
    { id: 'linkedin', name: 'LinkedIn', icon: 'in', available: true },
    { id: 'indeed', name: 'Indeed', icon: 'I', available: false },
    { id: 'glassdoor', name: 'Glassdoor', icon: 'G', available: false },
    { id: 'naukri', name: 'Naukri', icon: 'N', available: false },
    { id: 'monster', name: 'Monster', icon: 'M', available: false },
    { id: 'ziprecruiter', name: 'ZipRecruiter', icon: 'Z', available: false },
]

const publishedAtOptions = [
    { id: 'any', label: 'Any Time' },
    { id: 'day', label: 'Past 24 hours' },
    { id: 'week', label: 'Past week' },
    { id: 'month', label: 'Past month' },
]

const remoteOptions = [
    { id: 'any', label: 'Any' },
    { id: 'on-site', label: 'On-site' },
    { id: 'remote', label: 'Remote' },
    { id: 'hybrid', label: 'Hybrid' },
]

const jobTypeOptions = [
    { id: 'any', label: 'Any' },
    { id: 'full-time', label: 'Full-time' },
    { id: 'part-time', label: 'Part-time' },
    { id: 'contract', label: 'Contract' },
    { id: 'internship', label: 'Internship' },
]

const experienceLevelOptions = [
    { id: 'any', label: 'Any' },
    { id: 'entry', label: 'Entry level' },
    { id: 'associate', label: 'Associate' },
    { id: 'mid-senior', label: 'Mid-Senior level' },
    { id: 'director', label: 'Director' },
    { id: 'executive', label: 'Executive' },
]

const scheduleOptions = [
    { id: 'once', label: 'Run once', desc: 'Single execution' },
    { id: 'daily', label: 'Daily', desc: 'Every day at 9:00 AM' },
    { id: 'weekly', label: 'Weekly', desc: 'Every Monday at 9:00 AM' },
    { id: 'monthly', label: 'Monthly', desc: '1st of each month' },
]

const steps = [
    { id: 1, name: 'Basics', icon: Search },
    { id: 2, name: 'Search', icon: Sparkles },
    { id: 3, name: 'Filters', icon: Building2 },
    { id: 4, name: 'Schedule', icon: Calendar },
    { id: 5, name: 'Summary', icon: Check },
]

export function CreateSearchModal({ open, onOpenChange, onSearchCreated }: CreateSearchModalProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        jobBoards: ['linkedin'] as string[],
        jobTitle: '',
        jobLocation: '',
        companies: [] as string[],
        companyInput: '',
        publishedAt: 'any',
        totalRows: 100,
        remoteOption: 'any',
        jobType: 'any',
        experienceLevel: 'any',
        schedule: 'daily',
    })

    const handleClose = () => {
        onOpenChange(false)
        setCurrentStep(1)
        setFormData({
            name: '',
            jobBoards: ['linkedin'],
            jobTitle: '',
            jobLocation: '',
            companies: [],
            companyInput: '',
            publishedAt: 'any',
            totalRows: 100,
            remoteOption: 'any',
            jobType: 'any',
            experienceLevel: 'any',
            schedule: 'daily',
        })
    }

    const toggleJobBoard = (id: string, available: boolean) => {
        if (!available) return
        setFormData(prev => ({
            ...prev,
            jobBoards: prev.jobBoards.includes(id)
                ? prev.jobBoards.filter(b => b !== id)
                : [...prev.jobBoards, id]
        }))
    }

    const addCompany = () => {
        if (formData.companyInput.trim() && !formData.companies.includes(formData.companyInput.trim())) {
            setFormData(prev => ({
                ...prev,
                companies: [...prev.companies, prev.companyInput.trim()],
                companyInput: ''
            }))
        }
    }

    const removeCompany = (company: string) => {
        setFormData(prev => ({
            ...prev,
            companies: prev.companies.filter(c => c !== company)
        }))
    }

    const adjustTotalRows = (delta: number) => {
        setFormData(prev => ({
            ...prev,
            totalRows: Math.max(10, Math.min(1000, prev.totalRows + delta))
        }))
    }

    const handleSubmit = async (runImmediately: boolean = false) => {
        try {
            setIsSubmitting(true)

            const response = await fetch('/api/searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name || `${formData.jobTitle || 'Jobs'} in ${formData.jobLocation || 'Any Location'}`,
                    description: `Search for ${formData.jobTitle || 'any'} jobs in ${formData.jobLocation || 'any location'}`,
                    filters: {
                        jobTitles: formData.jobTitle ? [formData.jobTitle] : [],
                        locations: formData.jobLocation ? [formData.jobLocation] : [],
                        companyNames: formData.companies,
                        keywords: [],
                    },
                }),
            })

            if (!response.ok) throw new Error('Failed to create search')

            const newSearch = await response.json()
            onSearchCreated?.(newSearch)

            if (!runImmediately) {
                toast.success('Search created successfully', {
                    description: 'You can run it from the searches page.',
                })
                handleClose()
                return
            }

            // Run immediately
            setIsRunning(true)
            toast.loading('Running search...', {
                id: 'search-running',
                description: 'Scraping LinkedIn jobs. This may take 1-2 minutes.',
            })

            try {
                const runResponse = await fetch(`/api/searches/${newSearch.id}/run`, {
                    method: 'POST',
                })

                if (runResponse.ok) {
                    const result = await runResponse.json()
                    toast.success('Search completed!', {
                        id: 'search-running',
                        description: `Found ${result.jobsFound} jobs from ${result.companiesFound} companies.`,
                    })
                } else {
                    const error = await runResponse.json()
                    toast.error('Search failed', {
                        id: 'search-running',
                        description: error.details || error.error || 'Unknown error',
                    })
                }
            } catch (runError) {
                console.error('Error running search:', runError)
                toast.error('Search failed to run', {
                    id: 'search-running',
                    description: 'You can try running it manually from the searches page.',
                })
            } finally {
                setIsRunning(false)
                handleClose()
            }
        } catch (error) {
            console.error('Error creating search:', error)
            toast.error('Failed to create search', {
                description: 'Please try again.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={!isRunning ? handleClose : undefined}
            />

            {/* Modal */}
            <div className="relative flex h-[580px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Running Overlay */}
                {isRunning && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-sm">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20" />
                            <div className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500">
                                <Loader2 className="size-8 animate-spin text-white" />
                            </div>
                        </div>
                        <h3 className="mt-6 text-lg font-semibold text-white">Running Search</h3>
                        <p className="mt-2 text-center text-sm text-white/40">
                            Scraping LinkedIn jobs for "{formData.jobTitle || 'all positions'}"
                            {formData.jobLocation && ` in ${formData.jobLocation}`}
                        </p>
                        <p className="mt-1 text-xs text-white/30">This may take 1-2 minutes...</p>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="size-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0ms' }} />
                            <div className="size-2 animate-bounce rounded-full bg-cyan-500" style={{ animationDelay: '150ms' }} />
                            <div className="size-2 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
                    <div>
                        <h2 className="text-base font-semibold text-white">Create New Search</h2>
                        <p className="text-xs text-white/40">Configure your job scraping parameters</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="relative shrink-0 border-b border-white/5 px-4 py-2.5">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => setCurrentStep(step.id)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                                        currentStep === step.id
                                            ? 'bg-white/10 text-white'
                                            : currentStep > step.id
                                            ? 'text-green-400'
                                            : 'text-white/30'
                                    )}>
                                    <div
                                        className={cn(
                                            'flex size-5 items-center justify-center rounded-full text-[10px]',
                                            currentStep === step.id
                                                ? 'bg-white text-black'
                                                : currentStep > step.id
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-white/10 text-white/50'
                                        )}>
                                        {currentStep > step.id ? (
                                            <Check className="size-2.5" />
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <span className="hidden sm:inline">{step.name}</span>
                                </button>
                                {index < steps.length - 1 && (
                                    <div
                                        className={cn(
                                            'mx-1.5 h-px w-6',
                                            currentStep > step.id ? 'bg-green-500/50' : 'bg-white/10'
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4">
                    {/* Step 1: Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-white">
                                    Search Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Senior Engineers in Bay Area"
                                    className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-medium text-white">
                                    Job Board
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {jobBoards.map((board) => (
                                        <button
                                            key={board.id}
                                            onClick={() => toggleJobBoard(board.id, board.available)}
                                            disabled={!board.available}
                                            className={cn(
                                                'relative flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all',
                                                !board.available && 'cursor-not-allowed opacity-40',
                                                board.available && formData.jobBoards.includes(board.id)
                                                    ? 'border-white/20 bg-white/10 text-white'
                                                    : board.available
                                                    ? 'border-white/5 bg-white/[0.02] text-white/50 hover:border-white/10 hover:bg-white/5'
                                                    : 'border-white/5 bg-white/[0.02] text-white/30'
                                            )}>
                                            <div
                                                className={cn(
                                                    'flex size-6 items-center justify-center rounded text-[10px] font-bold',
                                                    board.available && formData.jobBoards.includes(board.id)
                                                        ? 'bg-white text-black'
                                                        : 'bg-white/10 text-white/70'
                                                )}>
                                                {board.icon}
                                            </div>
                                            <div>
                                                <span className="text-xs font-medium">{board.name}</span>
                                                {!board.available && (
                                                    <span className="block text-[10px] text-white/30">Soon</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Search Criteria */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Job Title <span className="text-white/30">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jobTitle}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                        placeholder="e.g., machine learning"
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Location <span className="text-white/30">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.jobLocation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jobLocation: e.target.value }))}
                                        placeholder="e.g., New York"
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-white">
                                    Company Name <span className="text-white/30">(optional)</span>
                                </label>
                                <p className="mb-2 text-[10px] text-white/40">
                                    Filter results to specific companies
                                </p>

                                {formData.companies.length > 0 && (
                                    <div className="mb-2 space-y-1.5">
                                        {formData.companies.map((company, index) => (
                                            <div
                                                key={company}
                                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                                <span className="flex size-5 items-center justify-center rounded bg-white/10 text-[10px] text-white/50">
                                                    {index + 1}
                                                </span>
                                                <span className="flex-1 text-xs text-white">{company}</span>
                                                <button
                                                    onClick={() => removeCompany(company)}
                                                    className="rounded p-0.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                    <X className="size-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.companyInput}
                                        onChange={(e) => setFormData(prev => ({ ...prev, companyInput: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
                                        placeholder="Enter company name"
                                        className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                    />
                                    <Button
                                        onClick={addCompany}
                                        size="sm"
                                        className="h-9 bg-white/10 px-3 text-xs text-white hover:bg-white/20">
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Filters */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Published At
                                    </label>
                                    <select
                                        value={formData.publishedAt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10">
                                        {publishedAtOptions.map((option) => (
                                            <option key={option.id} value={option.id} className="bg-[#0a0a0f]">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Total Rows
                                    </label>
                                    <div className="flex h-9 items-center gap-1.5">
                                        <input
                                            type="number"
                                            value={formData.totalRows}
                                            onChange={(e) => setFormData(prev => ({ ...prev, totalRows: Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)) }))}
                                            className="h-full flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                                        />
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => adjustTotalRows(10)}
                                                className="flex h-[18px] w-7 items-center justify-center rounded-t border border-white/10 bg-white/5 text-[10px] text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                                                +
                                            </button>
                                            <button
                                                onClick={() => adjustTotalRows(-10)}
                                                className="flex h-[18px] w-7 items-center justify-center rounded-b border border-t-0 border-white/10 bg-white/5 text-[10px] text-white/50 transition-colors hover:bg-white/10 hover:text-white">
                                                −
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Remote
                                    </label>
                                    <select
                                        value={formData.remoteOption}
                                        onChange={(e) => setFormData(prev => ({ ...prev, remoteOption: e.target.value }))}
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10">
                                        {remoteOptions.map((option) => (
                                            <option key={option.id} value={option.id} className="bg-[#0a0a0f]">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Job Type
                                    </label>
                                    <select
                                        value={formData.jobType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value }))}
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10">
                                        {jobTypeOptions.map((option) => (
                                            <option key={option.id} value={option.id} className="bg-[#0a0a0f]">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-white">
                                        Experience
                                    </label>
                                    <select
                                        value={formData.experienceLevel}
                                        onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                                        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10">
                                        {experienceLevelOptions.map((option) => (
                                            <option key={option.id} value={option.id} className="bg-[#0a0a0f]">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Schedule */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-medium text-white">
                                    Run Schedule
                                </label>
                                <div className="space-y-1.5">
                                    {scheduleOptions.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setFormData(prev => ({ ...prev, schedule: option.id }))}
                                            className={cn(
                                                'flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all',
                                                formData.schedule === option.id
                                                    ? 'border-white/20 bg-white/10'
                                                    : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5'
                                            )}>
                                            <div>
                                                <div className="text-sm font-medium text-white">{option.label}</div>
                                                <div className="text-xs text-white/40">{option.desc}</div>
                                            </div>
                                            <div
                                                className={cn(
                                                    'flex size-4 items-center justify-center rounded-full border-2 transition-all',
                                                    formData.schedule === option.id
                                                        ? 'border-white bg-white'
                                                        : 'border-white/20'
                                                )}>
                                                {formData.schedule === option.id && (
                                                    <Check className="size-2.5 text-black" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Summary */}
                    {currentStep === 5 && (
                        <div className="space-y-3">
                            <div className="rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-3">
                                <h4 className="mb-2 text-xs font-medium text-white">Search Summary</h4>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Name</span>
                                        <span className="text-white">{formData.name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Job Board</span>
                                        <span className="text-white">LinkedIn</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Job Title</span>
                                        <span className="text-white">{formData.jobTitle || 'Any'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Location</span>
                                        <span className="text-white">{formData.jobLocation || 'Any'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Companies</span>
                                        <span className="text-white">{formData.companies.length > 0 ? formData.companies.length + ' selected' : 'Any'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Total Rows</span>
                                        <span className="text-white">{formData.totalRows}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-white/40">Schedule</span>
                                        <span className="text-white capitalize">{formData.schedule}</span>
                                    </div>
                                </div>
                            </div>

                            {(() => {
                                const baseCredits = 5
                                const rowCredits = Math.ceil(formData.totalRows / 10)
                                const companyCredits = formData.companies.length * 2
                                const perRunCredits = baseCredits + rowCredits + companyCredits
                                const scheduleMultiplier = {
                                    once: 1,
                                    daily: 30,
                                    weekly: 4,
                                    monthly: 1
                                }[formData.schedule] || 1
                                const monthlyCredits = perRunCredits * scheduleMultiplier

                                return (
                                    <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            <div className="flex size-5 items-center justify-center rounded-full bg-cyan-500/20">
                                                <Sparkles className="size-2.5 text-cyan-400" />
                                            </div>
                                            <h4 className="text-xs font-medium text-white">Credit Estimation</h4>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-white/40">Per run</span>
                                                <span className="text-white">{perRunCredits} credits</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/40">Monthly estimate</span>
                                                <span className="font-medium text-cyan-400">{monthlyCredits.toLocaleString()} credits</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 rounded-md bg-white/5 px-2 py-1.5 text-[10px] text-white/40">
                                            Based on {formData.totalRows} rows{formData.companies.length > 0 ? ` and ${formData.companies.length} company filter${formData.companies.length !== 1 ? 's' : ''}` : ''}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30">
                        <ChevronLeft className="mr-1 size-3" />
                        Back
                    </Button>

                    {currentStep < 5 ? (
                        <Button
                            size="sm"
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
                            Next
                            <ChevronRight className="ml-1 size-3" />
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSubmit(false)}
                                disabled={isSubmitting}
                                className="h-7 px-3 text-xs text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50">
                                {isSubmitting ? 'Creating...' : 'Create Only'}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => handleSubmit(true)}
                                disabled={isSubmitting}
                                className="h-7 bg-gradient-to-r from-blue-500 to-cyan-500 px-3 text-xs text-white hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50">
                                <Sparkles className="mr-1.5 size-3" />
                                {isSubmitting ? 'Creating...' : 'Create & Run'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
