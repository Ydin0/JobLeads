'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Target,
    Briefcase,
    Code,
    Users,
    Check,
    X,
    Plus,
    Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'input' | 'suggestions' | 'review'

interface AISuggestion {
    icpName: string
    reasoning: string
    departments: string[]
    jobTitles: string[]
    techStack: string[]
    decisionMakers: string[]
    minJobs: number
}

const departmentOptions = [
    { value: 'engineering', label: 'Engineering', color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
    { value: 'sales', label: 'Sales', color: 'bg-green-500/10 text-green-400 ring-green-500/20' },
    { value: 'marketing', label: 'Marketing', color: 'bg-purple-500/10 text-purple-400 ring-purple-500/20' },
    { value: 'hr', label: 'HR', color: 'bg-pink-500/10 text-pink-400 ring-pink-500/20' },
    { value: 'finance', label: 'Finance', color: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
    { value: 'operations', label: 'Operations', color: 'bg-orange-500/10 text-orange-400 ring-orange-500/20' },
    { value: 'design', label: 'Design', color: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20' },
    { value: 'product', label: 'Product', color: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20' },
    { value: 'customer_success', label: 'Customer Success', color: 'bg-teal-500/10 text-teal-400 ring-teal-500/20' },
]

// Mock AI response - will be replaced with actual API call
const mockAISuggestion: AISuggestion = {
    icpName: 'Cloud Infrastructure Buyers',
    reasoning:
        'Companies hiring DevOps, SRE, and Platform Engineers are actively investing in infrastructure. This indicates budget allocation for cloud tools and platforms. These roles typically have buying authority or strong influence over infrastructure purchasing decisions.',
    departments: ['engineering', 'operations'],
    jobTitles: ['DevOps Engineer', 'SRE', 'Platform Engineer', 'Cloud Architect', 'Infrastructure Engineer'],
    techStack: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'Ansible'],
    decisionMakers: ['VP Engineering', 'CTO', 'Head of Infrastructure', 'Director of Platform'],
    minJobs: 3,
}

export default function SetupICPPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('input')
    const [productDescription, setProductDescription] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    // Editable fields based on AI suggestion
    const [icpName, setIcpName] = useState('')
    const [departments, setDepartments] = useState<string[]>([])
    const [jobTitles, setJobTitles] = useState<string[]>([])
    const [techStack, setTechStack] = useState<string[]>([])
    const [, setDecisionMakers] = useState<string[]>([])
    const [minJobs, setMinJobs] = useState(3)
    const [newJobTitle, setNewJobTitle] = useState('')
    const [newTech, setNewTech] = useState('')

    const handleGenerateSuggestions = async () => {
        if (!productDescription.trim()) return

        setIsGenerating(true)
        // Simulate API call - will be replaced with actual OpenAI call
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const result = mockAISuggestion
        setSuggestion(result)
        setIcpName(result.icpName)
        setDepartments(result.departments)
        setJobTitles(result.jobTitles)
        setTechStack(result.techStack)
        setDecisionMakers(result.decisionMakers)
        setMinJobs(result.minJobs)
        setIsGenerating(false)
        setStep('suggestions')
    }

    const handleCreateICP = async () => {
        setIsCreating(true)
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
        // Redirect to dashboard after creating ICP
        router.push('/dashboard/icps')
    }

    const toggleDepartment = (dept: string) => {
        setDepartments((prev) =>
            prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
        )
    }

    const removeItem = (list: string[], setList: (items: string[]) => void, item: string) => {
        setList(list.filter((i) => i !== item))
    }

    const addItem = (
        list: string[],
        setList: (items: string[]) => void,
        item: string,
        clearInput: () => void
    ) => {
        if (item.trim() && !list.includes(item.trim())) {
            setList([...list, item.trim()])
            clearInput()
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center px-6 py-12">
            <div className="w-full max-w-2xl">
                {/* Progress indicator */}
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div
                        className={cn(
                            'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                            step === 'input'
                                ? 'bg-purple-500 text-white'
                                : 'bg-purple-500/20 text-purple-400'
                        )}
                    >
                        {step !== 'input' ? <Check className="size-4" /> : '1'}
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <div
                        className={cn(
                            'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                            step === 'suggestions'
                                ? 'bg-purple-500 text-white'
                                : step === 'review'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-white/10 text-white/40'
                        )}
                    >
                        {step === 'review' ? <Check className="size-4" /> : '2'}
                    </div>
                    <div className="h-px w-12 bg-white/10" />
                    <div
                        className={cn(
                            'flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                            step === 'review'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 text-white/40'
                        )}
                    >
                        3
                    </div>
                </div>

                {/* Step 1: Input */}
                {step === 'input' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-inset ring-purple-500/20">
                                <Sparkles className="size-7 text-purple-400" />
                            </div>
                            <h1 className="mt-4 text-2xl font-semibold text-white">
                                What do you sell?
                            </h1>
                            <p className="mt-2 text-white/50">
                                Describe your product and AI will suggest the best hiring signals to track
                            </p>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="e.g., We sell cloud infrastructure monitoring tools to DevOps teams. Our platform helps companies track performance, detect anomalies, and reduce downtime."
                                className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none transition-colors focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            />

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => router.push('/onboarding')}
                                    className="flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60"
                                >
                                    <ArrowLeft className="size-4" />
                                    Back
                                </button>
                                <Button
                                    onClick={handleGenerateSuggestions}
                                    disabled={!productDescription.trim() || isGenerating}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 size-4" />
                                            Generate Suggestions
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Example prompts */}
                        <div className="space-y-2">
                            <p className="text-xs text-white/40">Try these examples:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'CRM software for sales teams',
                                    'Cloud security platform',
                                    'HR management software',
                                    'Marketing automation tools',
                                ].map((example) => (
                                    <button
                                        key={example}
                                        onClick={() => setProductDescription(example)}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Review Suggestions */}
                {step === 'suggestions' && suggestion && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-inset ring-purple-500/20">
                                <Target className="size-7 text-purple-400" />
                            </div>
                            <h1 className="mt-4 text-2xl font-semibold text-white">
                                Review your ICP
                            </h1>
                            <p className="mt-2 text-white/50">
                                Edit the suggestions below to match your ideal customer profile
                            </p>
                        </div>

                        {/* AI Reasoning */}
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-purple-400" />
                                <div>
                                    <p className="text-sm font-medium text-purple-300">AI Reasoning</p>
                                    <p className="mt-1 text-sm text-white/60">{suggestion.reasoning}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* ICP Name */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    ICP Name
                                </label>
                                <input
                                    type="text"
                                    value={icpName}
                                    onChange={(e) => setIcpName(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-white/30 outline-none transition-colors focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>

                            {/* Departments */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    <Briefcase className="mr-2 inline size-4" />
                                    Target Departments
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {departmentOptions.map((dept) => (
                                        <button
                                            key={dept.value}
                                            onClick={() => toggleDepartment(dept.value)}
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-sm font-medium transition-all ring-1 ring-inset',
                                                departments.includes(dept.value)
                                                    ? dept.color
                                                    : 'bg-white/5 text-white/40 ring-white/10 hover:bg-white/10'
                                            )}
                                        >
                                            {dept.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Job Titles */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    <Users className="mr-2 inline size-4" />
                                    Job Titles to Track
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {jobTitles.map((title) => (
                                        <span
                                            key={title}
                                            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white"
                                        >
                                            {title}
                                            <button
                                                onClick={() => removeItem(jobTitles, setJobTitles, title)}
                                                className="ml-1 text-white/40 hover:text-white"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newJobTitle}
                                            onChange={(e) => setNewJobTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    addItem(jobTitles, setJobTitles, newJobTitle, () =>
                                                        setNewJobTitle('')
                                                    )
                                                }
                                            }}
                                            placeholder="Add title..."
                                            className="w-28 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={() =>
                                                addItem(jobTitles, setJobTitles, newJobTitle, () =>
                                                    setNewJobTitle('')
                                                )
                                            }
                                            className="rounded-full bg-white/10 p-1 text-white/60 hover:bg-white/20 hover:text-white"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tech Stack */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    <Code className="mr-2 inline size-4" />
                                    Tech Stack Signals
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {techStack.map((tech) => (
                                        <span
                                            key={tech}
                                            className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-400"
                                        >
                                            {tech}
                                            <button
                                                onClick={() => removeItem(techStack, setTechStack, tech)}
                                                className="ml-1 text-cyan-400/60 hover:text-cyan-400"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={newTech}
                                            onChange={(e) => setNewTech(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    addItem(techStack, setTechStack, newTech, () => setNewTech(''))
                                                }
                                            }}
                                            placeholder="Add tech..."
                                            className="w-28 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={() =>
                                                addItem(techStack, setTechStack, newTech, () => setNewTech(''))
                                            }
                                            className="rounded-full bg-white/10 p-1 text-white/60 hover:bg-white/20 hover:text-white"
                                        >
                                            <Plus className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Min Jobs */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white">
                                    Minimum Active Jobs
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={minJobs}
                                        onChange={(e) => setMinJobs(parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="w-12 text-center text-sm font-medium text-white">
                                        {minJobs}+
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-white/40">
                                    Only show companies with at least this many matching job postings
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={() => setStep('input')}
                                className="flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60"
                            >
                                <ArrowLeft className="size-4" />
                                Back
                            </button>
                            <Button
                                onClick={handleCreateICP}
                                disabled={!icpName || departments.length === 0 || jobTitles.length === 0 || isCreating}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creating ICP...
                                    </>
                                ) : (
                                    <>
                                        Create ICP
                                        <ArrowRight className="ml-2 size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
