'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Users,
    Code,
    Target,
    Loader2,
    Check,
    X,
    Plus,
    Zap,
    Brain,
    Rocket,
    Search,
    MapPin,
    Trash2,
    Globe,
    Settings2,
    Layers,
    GraduationCap,
    ListFilter,
    AlertCircle,
    Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { LocationCombobox, SingleLocationCombobox } from '@/components/ui/location-combobox'
import { useCredits } from '@/hooks/use-credits'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { jobBoardOptions } from '@/components/icons/job-boards'

// Department options with colors for both light and dark mode
const departments = [
    { id: 'engineering', label: 'Engineering', lightBg: 'bg-blue-100', lightText: 'text-blue-600', darkBg: 'dark:bg-blue-500/10', darkText: 'dark:text-blue-400' },
    { id: 'sales', label: 'Sales', lightBg: 'bg-green-100', lightText: 'text-green-600', darkBg: 'dark:bg-green-500/10', darkText: 'dark:text-green-400' },
    { id: 'marketing', label: 'Marketing', lightBg: 'bg-purple-100', lightText: 'text-purple-600', darkBg: 'dark:bg-purple-500/10', darkText: 'dark:text-purple-400' },
    { id: 'hr', label: 'HR & People', lightBg: 'bg-pink-100', lightText: 'text-pink-600', darkBg: 'dark:bg-pink-500/10', darkText: 'dark:text-pink-400' },
    { id: 'finance', label: 'Finance', lightBg: 'bg-yellow-100', lightText: 'text-yellow-600', darkBg: 'dark:bg-yellow-500/10', darkText: 'dark:text-yellow-400' },
    { id: 'operations', label: 'Operations', lightBg: 'bg-orange-100', lightText: 'text-orange-600', darkBg: 'dark:bg-orange-500/10', darkText: 'dark:text-orange-400' },
    { id: 'design', label: 'Design', lightBg: 'bg-indigo-100', lightText: 'text-indigo-600', darkBg: 'dark:bg-indigo-500/10', darkText: 'dark:text-indigo-400' },
    { id: 'product', label: 'Product', lightBg: 'bg-cyan-100', lightText: 'text-cyan-600', darkBg: 'dark:bg-cyan-500/10', darkText: 'dark:text-cyan-400' },
    { id: 'customer_success', label: 'Customer Success', lightBg: 'bg-teal-100', lightText: 'text-teal-600', darkBg: 'dark:bg-teal-500/10', darkText: 'dark:text-teal-400' },
]

// Common tech stack options
const techOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Go',
    'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform',
    'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'TypeScript',
    'Salesforce', 'HubSpot', 'Datadog', 'Snowflake',
]

interface ICPSuggestion {
    name: string
    departments: string[]
    jobTitles: string[]
    techStack: string[]
    minJobs: number
    decisionMakers: string[]
    reasoning: string
}

interface JobScraper {
    id: string
    jobTitle: string
    location: string
    experienceLevel: string
}

// Experience level options
const experienceLevelOptions = [
    { id: 'any', label: 'Any Level' },
    { id: 'entry', label: 'Entry Level' },
    { id: 'mid', label: 'Mid Level' },
    { id: 'senior', label: 'Senior' },
    { id: 'lead', label: 'Lead / Principal' },
    { id: 'executive', label: 'Executive' },
]

export default function NewICPPage() {
    const router = useRouter()
    const { icpRemaining, isLoading: isLoadingCredits } = useCredits()
    const [step, setStep] = useState<'input' | 'generating' | 'review' | 'scrapers'>('input')
    const [productDescription, setProductDescription] = useState('')
    const [suggestion, setSuggestion] = useState<ICPSuggestion | null>(null)
    const [loadingText, setLoadingText] = useState('Analyzing your product...')
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    // Target locations (selected in step 1)
    const [targetLocations, setTargetLocations] = useState<string[]>(['United States', 'Remote'])

    // Editable fields
    const [icpName, setIcpName] = useState('')
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
    const [jobTitles, setJobTitles] = useState<string[]>([])
    const [newJobTitle, setNewJobTitle] = useState('')
    const [selectedTech, setSelectedTech] = useState<string[]>([])
    const [minJobs, setMinJobs] = useState(3)
    const [isSaving, setIsSaving] = useState(false)

    // Scraper state
    const [scrapers, setScrapers] = useState<JobScraper[]>([])
    const [newScraperTitle, setNewScraperTitle] = useState('')
    const [newScraperLocation, setNewScraperLocation] = useState('United States')
    const [newScraperExperience, setNewScraperExperience] = useState('any')

    // Scraper config state
    const [selectedJobBoards, setSelectedJobBoards] = useState<string[]>(['linkedin', 'indeed'])
    const [maxRows, setMaxRows] = useState(100)

    // Animated loading text
    useEffect(() => {
        if (step !== 'generating') return

        const texts = [
            'Analyzing your product...',
            'Identifying target buyers...',
            'Finding hiring signals...',
            'Building your ICP...',
        ]
        let index = 0
        const interval = setInterval(() => {
            index = (index + 1) % texts.length
            setLoadingText(texts[index])
        }, 1500)

        return () => clearInterval(interval)
    }, [step])

    const [generateError, setGenerateError] = useState<string | null>(null)

    const generateICP = async () => {
        if (!productDescription.trim()) return

        setStep('generating')
        setGenerateError(null)

        try {
            const response = await fetch('/api/icps/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productDescription }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to generate ICP')
            }

            const aiSuggestion = await response.json()

            setSuggestion(aiSuggestion)
            setIcpName(aiSuggestion.name)
            setSelectedDepartments(aiSuggestion.departments)
            setJobTitles(aiSuggestion.jobTitles)
            setSelectedTech(aiSuggestion.techStack || [])
            setMinJobs(aiSuggestion.minJobs)

            // Generate scrapers from AI suggestions or job titles using target locations
            let generatedScrapers: JobScraper[] = []
            const locationsToUse = targetLocations.length > 0 ? targetLocations : ['United States', 'Remote']

            if (aiSuggestion.suggestedScrapers && aiSuggestion.suggestedScrapers.length > 0) {
                // Use AI-suggested job titles with user's target locations
                const suggestedTitles = aiSuggestion.suggestedScrapers.map((s: { jobTitle: string }) => s.jobTitle)
                generatedScrapers = suggestedTitles.flatMap((title: string, titleIndex: number) =>
                    locationsToUse.map((location, locIndex) => ({
                        id: `scraper-${titleIndex}-${locIndex}`,
                        jobTitle: title,
                        location,
                        experienceLevel: 'any',
                    }))
                )
            } else {
                // Fallback: Generate from job titles with user's target locations
                generatedScrapers = aiSuggestion.jobTitles.flatMap((title: string, titleIndex: number) =>
                    locationsToUse.map((location, locIndex) => ({
                        id: `scraper-${titleIndex}-${locIndex}`,
                        jobTitle: title,
                        location,
                        experienceLevel: 'any',
                    }))
                )
            }

            setScrapers(generatedScrapers)
            setStep('review')
        } catch (error) {
            console.error('Error generating ICP:', error)
            setGenerateError(error instanceof Error ? error.message : 'Failed to generate ICP')
            setStep('input')
        }
    }

    const toggleDepartment = (id: string) => {
        setSelectedDepartments(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        )
    }

    const toggleTech = (tech: string) => {
        setSelectedTech(prev =>
            prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
        )
    }

    const addJobTitle = () => {
        if (newJobTitle.trim() && !jobTitles.includes(newJobTitle.trim())) {
            setJobTitles(prev => [...prev, newJobTitle.trim()])
            setNewJobTitle('')
        }
    }

    const removeJobTitle = (title: string) => {
        setJobTitles(prev => prev.filter(t => t !== title))
    }

    const addScraper = () => {
        if (newScraperTitle.trim()) {
            const newScraper: JobScraper = {
                id: `scraper-${Date.now()}`,
                jobTitle: newScraperTitle.trim(),
                location: newScraperLocation,
                experienceLevel: newScraperExperience,
            }
            setScrapers(prev => [...prev, newScraper])
            setNewScraperTitle('')
            setNewScraperExperience('any')
        }
    }

    const removeScraper = (id: string) => {
        setScrapers(prev => prev.filter(s => s.id !== id))
    }

    const toggleJobBoard = (id: string) => {
        setSelectedJobBoards(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        )
    }

    // Run immediately option state
    const [runImmediately, setRunImmediately] = useState(true)

    const saveICP = async () => {
        setIsSaving(true)
        try {
            // Create the search/ICP record
            const response = await fetch('/api/searches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: icpName,
                    description: suggestion?.reasoning || productDescription,
                    filters: {
                        jobTitles: jobTitles,
                        departments: selectedDepartments,
                        techStack: selectedTech,
                        minJobs: minJobs,
                        scrapers: scrapers.map(s => ({
                            jobTitle: s.jobTitle,
                            location: s.location,
                            experienceLevel: s.experienceLevel,
                        })),
                        jobBoards: selectedJobBoards,
                        maxRows: maxRows,
                    },
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create ICP')
            }

            const newSearch = await response.json()

            toast.success('ICP created successfully!', {
                description: runImmediately
                    ? 'Starting scrapers...'
                    : 'Navigate to the ICP to run scrapers.',
            })

            // If run immediately is enabled, trigger the scrapers
            if (runImmediately) {
                // Don't await - let it run in background
                fetch(`/api/searches/${newSearch.id}/run`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                }).then(res => {
                    if (res.ok) {
                        toast.success('Scrapers completed!', {
                            description: 'Check the ICP page for results.',
                        })
                    }
                }).catch(() => {
                    toast.error('Scraper run failed', {
                        description: 'You can retry from the ICP page.',
                    })
                })
            }

            // Navigate to the new ICP detail page
            router.push(`/dashboard/icps/${newSearch.id}`)
        } catch (error) {
            console.error('Error creating ICP:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create ICP')
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-10rem)]">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/dashboard/icps"
                        className="flex size-8 items-center justify-center rounded-lg border border-black/10 bg-white/50 text-black/40 transition-all hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-black dark:text-white">Create New ICP</h1>
                        <p className="text-xs text-black/50 dark:text-white/40">
                            Define your Ideal Customer Profile with AI
                        </p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-2">
                        {[
                            { id: 'input', label: 'Describe', icon: Brain },
                            { id: 'generating', label: 'Generate', icon: Sparkles },
                            { id: 'review', label: 'Customize', icon: Target },
                            { id: 'scrapers', label: 'Scrapers', icon: Search },
                        ].map((s, index) => {
                            const stepOrder = ['input', 'generating', 'review', 'scrapers']
                            const currentIndex = stepOrder.indexOf(step)
                            const isActive = step === s.id
                            const isPast = index < currentIndex
                            const Icon = s.icon

                            return (
                                <div key={s.id} className="flex items-center gap-2">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div
                                            className={cn(
                                                'flex size-8 items-center justify-center rounded-lg border transition-colors',
                                                isActive
                                                    ? 'border-black bg-black/5 dark:border-white dark:bg-white/10'
                                                    : isPast
                                                      ? 'border-green-500 bg-green-500/10'
                                                      : 'border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]'
                                            )}
                                        >
                                            {isPast && !isActive ? (
                                                <Check className="size-3.5 text-green-500" />
                                            ) : (
                                                <Icon className={cn(
                                                    'size-3.5',
                                                    isActive ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/40'
                                                )} />
                                            )}
                                        </div>
                                        <span className={cn(
                                            'text-[9px] font-medium',
                                            isActive ? 'text-black dark:text-white' : isPast ? 'text-green-500' : 'text-black/40 dark:text-white/40'
                                        )}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {index < 3 && (
                                        <div className={cn(
                                            'h-px w-6',
                                            isPast ? 'bg-green-500' : 'bg-black/10 dark:bg-white/10'
                                        )} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Main Input Card with gradient border */}
                        <div className="rounded-2xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                            <div className="rounded-2xl bg-white p-5 dark:bg-[#0a0a0f]">
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <div className="rounded-xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-white dark:bg-[#0a0a0f]">
                                                    <Brain className="size-5 text-black/60 dark:text-white/60" />
                                                </div>
                                            </div>
                                            <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-black text-[8px] font-bold text-white dark:bg-white dark:text-black">
                                                AI
                                            </div>
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-semibold text-black dark:text-white">What do you sell?</h2>
                                            <p className="text-xs text-black/50 dark:text-white/50">
                                                Describe your product and AI will identify hiring signals to track
                                            </p>
                                        </div>
                                    </div>

                                    {/* Textarea */}
                                    <div className="relative">
                                        <textarea
                                            value={productDescription}
                                            onChange={(e) => setProductDescription(e.target.value)}
                                            placeholder="e.g., We sell cloud cost optimization software that helps DevOps teams reduce AWS spend..."
                                            className="h-28 w-full resize-none rounded-xl border border-black/10 bg-black/[0.02] p-3 text-sm text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                                        />
                                        <div className="absolute bottom-2.5 right-3">
                                            <span className={cn(
                                                'text-[10px]',
                                                productDescription.length > 20 ? 'text-green-500' : 'text-black/30 dark:text-white/30'
                                            )}>
                                                {productDescription.length > 20 ? 'Ready' : 'Keep typing...'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Error Display */}
                                    {generateError && (
                                        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                                            {generateError}
                                        </div>
                                    )}

                                    {/* Generate Button */}
                                    <Button
                                        onClick={generateICP}
                                        disabled={productDescription.length < 20}
                                        className="h-9 w-full rounded-full bg-black text-sm text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                    >
                                        <Sparkles className="mr-1.5 size-3.5" />
                                        Generate ICP with AI
                                    </Button>

                                    {/* Powered by note */}
                                    <p className="text-center text-[10px] text-black/30 dark:text-white/30">
                                        Powered by GPT-4o mini
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Example Prompts */}
                        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="mb-3 flex items-center gap-1.5">
                                <Zap className="size-3 text-black/50 dark:text-white/50" />
                                <h3 className="text-xs font-medium text-black dark:text-white">Quick Examples</h3>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    { text: 'Developer tools for React teams', icon: Code },
                                    { text: 'Recruiting software for startups', icon: Users },
                                    { text: 'Sales training for SDR teams', icon: Target },
                                    { text: 'Cloud infrastructure monitoring', icon: Briefcase },
                                ].map((example) => (
                                    <button
                                        key={example.text}
                                        onClick={() => setProductDescription(example.text)}
                                        className="group flex items-center gap-2 rounded-lg border border-black/10 bg-black/[0.02] p-2.5 text-left transition-colors hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/5"
                                    >
                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-black/5 transition-colors group-hover:bg-black/10 dark:bg-white/5 dark:group-hover:bg-white/10">
                                            <example.icon className="size-3.5 text-black/40 transition-colors group-hover:text-black/60 dark:text-white/40 dark:group-hover:text-white/60" />
                                        </div>
                                        <span className="text-xs text-black/60 transition-colors group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">
                                            {example.text}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Locations */}
                        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="mb-3 flex items-center gap-1.5">
                                <MapPin className="size-3 text-black/50 dark:text-white/50" />
                                <h3 className="text-xs font-medium text-black dark:text-white">Target Markets</h3>
                            </div>

                            <LocationCombobox
                                selectedLocations={targetLocations}
                                onLocationsChange={setTargetLocations}
                                placeholder="Search and select locations..."
                            />

                            {/* Helper text */}
                            <p className="mt-3 text-[10px] text-black/40 dark:text-white/40">
                                These locations will be used to generate job scrapers for your ICP
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 2: Generating */}
                {step === 'generating' && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="size-16 rounded-full border-2 border-black/10 dark:border-white/10" />
                            <div className="absolute inset-0 size-16 animate-spin rounded-full border-2 border-transparent border-t-black dark:border-t-white" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Brain className="size-6 text-black/50 dark:text-white/50 animate-pulse" />
                            </div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-sm font-medium text-black dark:text-white">{loadingText}</h2>
                            <p className="mt-1 text-xs text-black/40 dark:text-white/40">This takes a few seconds</p>
                        </div>

                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="size-1.5 rounded-full bg-black dark:bg-white animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Customize */}
                {step === 'review' && suggestion && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* AI Insight Card */}
                        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="flex items-start gap-2.5">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
                                    <Sparkles className="size-3.5 text-black/50 dark:text-white/50" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-black dark:text-white">AI Insight</h3>
                                    <p className="mt-0.5 text-xs leading-relaxed text-black/60 dark:text-white/60">{suggestion.reasoning}</p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Cards */}
                        <div className="grid gap-3">
                            {/* ICP Name */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <label className="mb-1.5 block text-xs font-medium text-black dark:text-white">ICP Name</label>
                                <input
                                    type="text"
                                    value={icpName}
                                    onChange={(e) => setIcpName(e.target.value)}
                                    className="w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm font-medium text-black focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20"
                                />
                            </div>

                            {/* Target Departments */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <Briefcase className="size-3 text-black/40 dark:text-white/40" />
                                    <label className="text-xs font-medium text-black dark:text-white">Target Departments</label>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {departments.map((dept) => {
                                        const isSelected = selectedDepartments.includes(dept.id)
                                        return (
                                            <button
                                                key={dept.id}
                                                onClick={() => toggleDepartment(dept.id)}
                                                className={cn(
                                                    'rounded-md px-2 py-1 text-[10px] font-medium transition-all',
                                                    isSelected
                                                        ? `${dept.lightBg} ${dept.lightText} ${dept.darkBg} ${dept.darkText} ring-1 ring-current/20`
                                                        : 'bg-black/5 text-black/50 hover:bg-black/10 dark:bg-white/5 dark:text-white/50 dark:hover:bg-white/10'
                                                )}
                                            >
                                                {isSelected && <Check className="mr-0.5 inline size-2.5" />}
                                                {dept.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Job Titles */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <Users className="size-3 text-black/40 dark:text-white/40" />
                                    <label className="text-xs font-medium text-black dark:text-white">Job Titles to Track</label>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {jobTitles.map((title) => (
                                        <span
                                            key={title}
                                            className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                        >
                                            {title}
                                            <button
                                                onClick={() => removeJobTitle(title)}
                                                className="rounded p-0.5 opacity-60 transition-opacity hover:bg-blue-200 hover:opacity-100 dark:hover:bg-blue-500/20"
                                            >
                                                <X className="size-2" />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-0.5">
                                        <input
                                            type="text"
                                            value={newJobTitle}
                                            onChange={(e) => setNewJobTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
                                            placeholder="Add..."
                                            className="w-16 rounded-md border border-black/10 bg-white/80 px-1.5 py-0.5 text-[10px] text-black placeholder:text-black/30 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                                        />
                                        <button
                                            onClick={addJobTitle}
                                            className="rounded-md bg-black/5 p-1 text-black/40 transition-all hover:bg-black/10 hover:text-black dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            <Plus className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <Code className="size-3 text-black/40 dark:text-white/40" />
                                    <label className="text-xs font-medium text-black dark:text-white">Tech Stack Signals</label>
                                    <span className="text-[10px] text-black/30 dark:text-white/30">(optional)</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {techOptions.map((tech) => {
                                        const isSelected = selectedTech.includes(tech)
                                        return (
                                            <button
                                                key={tech}
                                                onClick={() => toggleTech(tech)}
                                                className={cn(
                                                    'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all',
                                                    isSelected
                                                        ? 'bg-cyan-100 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400'
                                                        : 'bg-black/5 text-black/40 hover:bg-black/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10'
                                                )}
                                            >
                                                {tech}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Minimum Jobs */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Zap className="size-3 text-black/40 dark:text-white/40" />
                                        <label className="text-xs font-medium text-black dark:text-white">Minimum Jobs</label>
                                    </div>
                                    <div className="rounded-md bg-black/5 px-2 py-0.5 dark:bg-white/10">
                                        <span className="text-xs font-semibold text-black dark:text-white">{minJobs}+</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={minJobs}
                                    onChange={(e) => setMinJobs(parseInt(e.target.value))}
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-black/10 accent-black dark:bg-white/10 dark:accent-white"
                                />
                                <p className="mt-1.5 text-[10px] text-black/40 dark:text-white/40">
                                    Only show companies with at least {minJobs} matching job postings
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('input')}
                                className="h-8 text-xs text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <ArrowLeft className="mr-1 size-3" />
                                Start Over
                            </Button>
                            <Button
                                onClick={() => setStep('scrapers')}
                                disabled={!icpName.trim() || selectedDepartments.length === 0}
                                className="h-9 rounded-full bg-black px-5 text-sm text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                            >
                                Configure Scrapers
                                <ArrowRight className="ml-1.5 size-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Configure Scrapers */}
                {step === 'scrapers' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Header Info */}
                        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="flex items-start gap-2.5">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-black/10 dark:border-white/10">
                                    <Settings2 className="size-3.5 text-black/50 dark:text-white/50" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-medium text-black dark:text-white">Configure Job Scrapers</h3>
                                    <p className="mt-0.5 text-xs leading-relaxed text-black/60 dark:text-white/60">
                                        Set up the scrapers that will monitor job boards for matching companies. Each scraper searches for specific job titles in specific locations.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Global Scraper Settings */}
                        <div className="grid gap-3 sm:grid-cols-2">
                            {/* Job Boards */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <Layers className="size-3 text-black/40 dark:text-white/40" />
                                    <label className="text-xs font-medium text-black dark:text-white">Job Boards</label>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {jobBoardOptions.map((board) => {
                                        const isSelected = selectedJobBoards.includes(board.id)
                                        return (
                                            <button
                                                key={board.id}
                                                onClick={() => toggleJobBoard(board.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all',
                                                    isSelected
                                                        ? 'bg-[#F8F7FF] text-black ring-1 ring-black/10 dark:bg-white/10 dark:text-white dark:ring-white/10'
                                                        : 'bg-black/[0.02] text-black/50 hover:bg-black/5 dark:bg-white/[0.02] dark:text-white/50 dark:hover:bg-white/5'
                                                )}
                                            >
                                                <board.Icon className={cn('size-3.5', isSelected ? board.color : 'text-black/30 dark:text-white/30')} />
                                                {board.label}
                                                {isSelected && <Check className="ml-0.5 size-2.5 text-black dark:text-white" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Max Rows */}
                            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <ListFilter className="size-3 text-black/40 dark:text-white/40" />
                                        <label className="text-xs font-medium text-black dark:text-white">Max Results</label>
                                    </div>
                                    <div className="rounded-md bg-black/5 px-2 py-0.5 dark:bg-white/10">
                                        <span className="text-xs font-semibold text-black dark:text-white">{maxRows}</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="25"
                                    max="500"
                                    step="25"
                                    value={maxRows}
                                    onChange={(e) => setMaxRows(parseInt(e.target.value))}
                                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-black/10 accent-black dark:bg-white/10 dark:accent-white"
                                />
                                <p className="mt-1.5 text-[10px] text-black/40 dark:text-white/40">
                                    Maximum companies to return per scraper run
                                </p>
                            </div>
                        </div>

                        {/* Scrapers List */}
                        <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Search className="size-3.5 text-black/40 dark:text-white/40" />
                                    <h3 className="text-xs font-semibold text-black dark:text-white">Job Scrapers</h3>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-2 py-0.5 dark:bg-white/10">
                                    <Globe className="size-3 text-black/50 dark:text-white/50" />
                                    <span className="text-[10px] font-medium text-black/70 dark:text-white/70">{scrapers.length} scrapers</span>
                                </div>
                            </div>

                            {/* Scraper Grid */}
                            <div className="mb-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                                {scrapers.map((scraper) => {
                                    const expLabel = experienceLevelOptions.find(e => e.id === scraper.experienceLevel)?.label || 'Any Level'
                                    return (
                                        <div
                                            key={scraper.id}
                                            className="group flex items-center justify-between gap-2 rounded-lg border border-black/5 bg-white/80 p-2 transition-all hover:border-black/10 dark:border-white/5 dark:bg-white/[0.03] dark:hover:border-white/10"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-500/10">
                                                    <Briefcase className="size-3.5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-[11px] font-medium text-black dark:text-white">{scraper.jobTitle}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                        <div className="flex items-center gap-0.5">
                                                            <MapPin className="size-2.5 text-black/30 dark:text-white/30" />
                                                            <span className="text-[9px] text-black/40 dark:text-white/40">{scraper.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            <GraduationCap className="size-2.5 text-black/30 dark:text-white/30" />
                                                            <span className="text-[9px] text-black/40 dark:text-white/40">{expLabel}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeScraper(scraper.id)}
                                                className="rounded-md p-1 text-black/30 opacity-0 transition-all hover:bg-red-100 hover:text-red-500 group-hover:opacity-100 dark:text-white/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        </div>
                                    )
                                })}
                                {scrapers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-black/10 py-8 dark:border-white/10">
                                        <Search className="mb-2 size-6 text-black/20 dark:text-white/20" />
                                        <p className="text-xs text-black/40 dark:text-white/40">No scrapers configured</p>
                                        <p className="text-[10px] text-black/30 dark:text-white/30">Add scrapers below to start monitoring jobs</p>
                                    </div>
                                )}
                            </div>

                            {/* Add New Scraper */}
                            <div className="rounded-lg border border-black/10 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="mb-2.5 flex items-center gap-1.5">
                                    <Plus className="size-3 text-black/50 dark:text-white/50" />
                                    <span className="text-[10px] font-semibold text-black/70 dark:text-white/70">Add New Scraper</span>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-1 block text-[9px] font-medium text-black/40 dark:text-white/40">Job Title</label>
                                        <input
                                            type="text"
                                            value={newScraperTitle}
                                            onChange={(e) => setNewScraperTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addScraper()}
                                            placeholder="e.g., DevOps Engineer"
                                            className="w-full rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-[11px] text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[9px] font-medium text-black/40 dark:text-white/40">Location</label>
                                        <SingleLocationCombobox
                                            value={newScraperLocation}
                                            onChange={setNewScraperLocation}
                                            placeholder="Select location..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[9px] font-medium text-black/40 dark:text-white/40">Experience Level</label>
                                        <select
                                            value={newScraperExperience}
                                            onChange={(e) => setNewScraperExperience(e.target.value)}
                                            className="w-full rounded-md border border-black/10 bg-white px-2 py-1.5 text-[11px] text-black focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20"
                                        >
                                            {experienceLevelOptions.map((exp) => (
                                                <option key={exp.id} value={exp.id}>{exp.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={addScraper}
                                            disabled={!newScraperTitle.trim()}
                                            className="flex h-[30px] w-full items-center justify-center gap-1 rounded-md bg-black/10 text-[11px] font-medium text-black/70 transition-colors hover:bg-black/20 disabled:opacity-50 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                                        >
                                            <Plus className="size-3" />
                                            Add Scraper
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credit Estimation */}
                        {(() => {
                            // Formula: 1 ICP credit per company returned
                            // Estimated companies = scrapers × job boards × max results per scraper
                            const estimatedCompanies = scrapers.length * selectedJobBoards.length * maxRows
                            const estimatedCredits = estimatedCompanies
                            const currentBalance = isLoadingCredits ? 0 : icpRemaining
                            const balanceAfter = currentBalance - estimatedCredits
                            const hasEnoughCredits = balanceAfter >= 0

                            return (
                                <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    {/* Header with gradient badge */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                                <div className="flex size-7 items-center justify-center rounded-lg bg-white dark:bg-[#0a0a0f]">
                                                    <Target className="size-3.5 text-violet-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-semibold text-black dark:text-white">Estimated Credit Usage</h3>
                                                <p className="text-[10px] text-black/40 dark:text-white/40">1 credit per company returned</p>
                                            </div>
                                        </div>
                                        {/* Estimated total badge */}
                                        <div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 dark:bg-[#0a0a0f]">
                                                <Target className="size-3 text-violet-500" />
                                                <span className="text-sm font-bold text-black dark:text-white">
                                                    {estimatedCredits.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calculation Breakdown */}
                                    <div className="mb-4 space-y-2 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-black/60 dark:text-white/60">Job Scrapers</span>
                                            <span className="font-medium text-black dark:text-white">{scrapers.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-black/60 dark:text-white/60">Job Boards</span>
                                            <span className="font-medium text-black dark:text-white">{selectedJobBoards.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-black/60 dark:text-white/60">Max Results per Scraper</span>
                                            <span className="font-medium text-black dark:text-white">{maxRows}</span>
                                        </div>
                                        <div className="my-2 h-px bg-black/10 dark:bg-white/10" />
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-black/60 dark:text-white/60">Calculation</span>
                                            <span className="font-mono text-[10px] text-black/50 dark:text-white/50">
                                                {scrapers.length} × {selectedJobBoards.length} × {maxRows} = {estimatedCompanies.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Balance Before/After */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between rounded-lg bg-black/[0.02] px-3 py-2 dark:bg-white/[0.02]">
                                            <span className="text-[11px] text-black/60 dark:text-white/60">Current Balance</span>
                                            <div className="flex items-center gap-1.5">
                                                <Target className="size-3 text-violet-500" />
                                                <span className="text-xs font-semibold text-black dark:text-white">
                                                    {isLoadingCredits ? '...' : currentBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            'flex items-center justify-between rounded-lg px-3 py-2',
                                            hasEnoughCredits
                                                ? 'bg-green-500/10 dark:bg-green-500/10'
                                                : 'bg-red-500/10 dark:bg-red-500/10'
                                        )}>
                                            <span className="text-[11px] text-black/60 dark:text-white/60">Balance After</span>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Target className={cn(
                                                        'size-3',
                                                        hasEnoughCredits ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    )} />
                                                    <span className={cn(
                                                        'text-xs font-semibold',
                                                        hasEnoughCredits ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                    )}>
                                                        {balanceAfter.toLocaleString()}
                                                    </span>
                                                </div>
                                                {hasEnoughCredits ? (
                                                    <Check className="size-3.5 text-green-600 dark:text-green-400" />
                                                ) : (
                                                    <AlertCircle className="size-3.5 text-red-600 dark:text-red-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info note */}
                                    <div className="mt-3 flex items-start gap-1.5">
                                        <Info className="mt-0.5 size-3 shrink-0 text-black/30 dark:text-white/30" />
                                        <p className="text-[9px] leading-relaxed text-black/40 dark:text-white/40">
                                            This is an estimate. Actual credit usage depends on companies found. If 540 companies are returned, 540 ICP credits will be consumed.
                                        </p>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Run Immediately Option */}
                        <div className="mt-4 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <button
                                onClick={() => setRunImmediately(!runImmediately)}
                                className="flex w-full items-center gap-3"
                            >
                                <div className={cn(
                                    "flex size-5 items-center justify-center rounded border transition-colors",
                                    runImmediately
                                        ? "border-green-500 bg-green-500"
                                        : "border-black/20 dark:border-white/20"
                                )}>
                                    {runImmediately && <Check className="size-3 text-white" />}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-xs font-medium text-black dark:text-white">Run scrapers immediately</div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40">
                                        Start discovering companies right after creation
                                    </div>
                                </div>
                                <Zap className={cn(
                                    "size-4 transition-colors",
                                    runImmediately ? "text-green-500" : "text-black/20 dark:text-white/20"
                                )} />
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('review')}
                                className="h-8 text-xs text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <ArrowLeft className="mr-1 size-3" />
                                Back
                            </Button>
                            <Button
                                onClick={() => {
                                    if (runImmediately) {
                                        setShowConfirmDialog(true)
                                    } else {
                                        saveICP()
                                    }
                                }}
                                disabled={scrapers.length === 0 || selectedJobBoards.length === 0 || isSaving}
                                className="h-9 rounded-full bg-black px-5 text-sm text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                                        {runImmediately ? 'Launching...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="mr-1.5 size-3.5" />
                                        {runImmediately ? 'Launch & Run' : 'Launch ICP'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <div className="rounded-lg bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-white dark:bg-[#0a0a0f]">
                                    <Rocket className="size-4 text-violet-500" />
                                </div>
                            </div>
                            Confirm Launch
                        </DialogTitle>
                        <DialogDescription className="text-sm text-black/60 dark:text-white/60">
                            You&apos;re about to launch your ICP and run the scrapers immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Estimated Credits */}
                        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="mb-3 text-center">
                                <p className="text-[11px] text-black/50 dark:text-white/50">Estimated Credit Usage</p>
                                <div className="mt-2 inline-flex rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                    <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 dark:bg-[#0a0a0f]">
                                        <Target className="size-4 text-violet-500" />
                                        <span className="text-xl font-bold text-black dark:text-white">
                                            {(scrapers.length * selectedJobBoards.length * maxRows).toLocaleString()}
                                        </span>
                                        <span className="text-sm text-black/50 dark:text-white/50">ICP Credits</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-black/60 dark:text-white/60">Current Balance</span>
                                    <div className="flex items-center gap-1">
                                        <Target className="size-3 text-violet-500" />
                                        <span className="font-semibold text-black dark:text-white">
                                            {isLoadingCredits ? '...' : icpRemaining.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-black/60 dark:text-white/60">Balance After (estimated)</span>
                                    <div className="flex items-center gap-1">
                                        <Target className={cn(
                                            'size-3',
                                            (icpRemaining - scrapers.length * selectedJobBoards.length * maxRows) >= 0
                                                ? 'text-green-500'
                                                : 'text-red-500'
                                        )} />
                                        <span className={cn(
                                            'font-semibold',
                                            (icpRemaining - scrapers.length * selectedJobBoards.length * maxRows) >= 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                        )}>
                                            {(icpRemaining - scrapers.length * selectedJobBoards.length * maxRows).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 dark:bg-amber-500/10">
                            <Info className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
                                Actual credit usage depends on companies found. Credits are consumed based on results returned, not estimates.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowConfirmDialog(false)}
                            className="h-9 text-sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setShowConfirmDialog(false)
                                saveICP()
                            }}
                            className="h-9 rounded-full bg-black px-5 text-sm text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            <Rocket className="mr-1.5 size-3.5" />
                            Launch & Run
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
