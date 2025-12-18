'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Target,
    Briefcase,
    MapPin,
    GraduationCap,
    Trash2,
    Plus,
    Code,
    Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ScraperConfig {
    jobTitle: string
    location: string
    experienceLevel: string
}

interface SearchFilters {
    jobTitles?: string[]
    departments?: string[]
    techStack?: string[]
    minJobs?: number
    scrapers?: ScraperConfig[]
    jobBoards?: string[]
    maxRows?: number
    enrichmentFilters?: {
        decisionMakerTitles?: string[]
        decisionMakerSeniorities?: string[]
    }
}

interface ICPData {
    id: string
    name: string
    description: string | null
    filters: SearchFilters | null
    status: string
}

interface EditICPModalProps {
    icp: ICPData
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

const departments = [
    { id: 'engineering', label: 'Engineering' },
    { id: 'sales', label: 'Sales' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'hr', label: 'HR & People' },
    { id: 'finance', label: 'Finance' },
    { id: 'operations', label: 'Operations' },
    { id: 'design', label: 'Design' },
    { id: 'product', label: 'Product' },
    { id: 'customer_success', label: 'Customer Success' },
]

const experienceLevelOptions = [
    { id: 'any', label: 'Any Level' },
    { id: 'entry', label: 'Entry Level' },
    { id: 'mid', label: 'Mid Level' },
    { id: 'senior', label: 'Senior' },
    { id: 'lead', label: 'Lead / Principal' },
    { id: 'executive', label: 'Executive' },
]

const locationOptions = [
    'United States',
    'San Francisco, CA',
    'New York, NY',
    'Austin, TX',
    'Seattle, WA',
    'Los Angeles, CA',
    'Boston, MA',
    'Denver, CO',
    'Chicago, IL',
    'Remote',
    'United Kingdom',
    'London, UK',
    'Germany',
    'Canada',
    'Toronto, Canada',
]

const techOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java', 'Go',
    'AWS', 'GCP', 'Azure', 'Kubernetes', 'Docker', 'Terraform',
    'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'TypeScript',
    'Salesforce', 'HubSpot', 'Datadog', 'Snowflake',
]

export function EditICPModal({
    icp,
    open,
    onOpenChange,
    onSuccess,
}: EditICPModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
    const [jobTitles, setJobTitles] = useState<string[]>([])
    const [newJobTitle, setNewJobTitle] = useState('')
    const [selectedTech, setSelectedTech] = useState<string[]>([])
    const [minJobs, setMinJobs] = useState(3)
    const [scrapers, setScrapers] = useState<(ScraperConfig & { id: string })[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // New scraper form
    const [newScraperTitle, setNewScraperTitle] = useState('')
    const [newScraperLocation, setNewScraperLocation] = useState('United States')
    const [newScraperExperience, setNewScraperExperience] = useState('any')

    // Initialize form from ICP data
    useEffect(() => {
        if (open && icp) {
            setName(icp.name || '')
            setDescription(icp.description || '')
            setSelectedDepartments(icp.filters?.departments || [])
            setJobTitles(icp.filters?.jobTitles || [])
            setSelectedTech(icp.filters?.techStack || [])
            setMinJobs(icp.filters?.minJobs || 3)
            setScrapers(
                (icp.filters?.scrapers || []).map((s, i) => ({
                    ...s,
                    id: `scraper-${i}`,
                }))
            )
        }
    }, [open, icp])

    if (!open) return null

    const toggleDepartment = (id: string) => {
        setSelectedDepartments((prev) =>
            prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
        )
    }

    const toggleTech = (tech: string) => {
        setSelectedTech((prev) =>
            prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
        )
    }

    const addJobTitle = () => {
        if (newJobTitle.trim() && !jobTitles.includes(newJobTitle.trim())) {
            setJobTitles([...jobTitles, newJobTitle.trim()])
            setNewJobTitle('')
        }
    }

    const removeJobTitle = (title: string) => {
        setJobTitles(jobTitles.filter((t) => t !== title))
    }

    const addScraper = () => {
        if (!newScraperTitle.trim()) {
            toast.error('Please enter a job title for the scraper')
            return
        }
        setScrapers([
            ...scrapers,
            {
                id: `scraper-${Date.now()}`,
                jobTitle: newScraperTitle.trim(),
                location: newScraperLocation,
                experienceLevel: newScraperExperience,
            },
        ])
        setNewScraperTitle('')
        setNewScraperLocation('United States')
        setNewScraperExperience('any')
    }

    const removeScraper = (id: string) => {
        setScrapers(scrapers.filter((s) => s.id !== id))
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Please enter an ICP name')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch(`/api/searches/${icp.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    filters: {
                        ...icp.filters,
                        departments: selectedDepartments,
                        jobTitles,
                        techStack: selectedTech,
                        minJobs,
                        scrapers: scrapers.map(({ jobTitle, location, experienceLevel }) => ({
                            jobTitle,
                            location,
                            experienceLevel,
                        })),
                    },
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update ICP')
            }

            toast.success('ICP updated successfully')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Error updating ICP:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update ICP')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-6 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                            <Target className="size-5 text-black dark:text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-black dark:text-white">
                                Edit ICP
                            </h2>
                            <p className="text-xs text-black/50 dark:text-white/50">
                                Modify your Ideal Customer Profile settings
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    {/* Name & Description */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                                ICP Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Enterprise SaaS Buyers"
                                className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                                Description (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe this ICP..."
                                rows={2}
                                className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                            />
                        </div>
                    </div>

                    {/* Departments */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <Users className="size-3.5 text-black/40 dark:text-white/40" />
                            Target Departments
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {departments.map((dept) => (
                                <button
                                    key={dept.id}
                                    onClick={() => toggleDepartment(dept.id)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                        selectedDepartments.includes(dept.id)
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                                    )}
                                >
                                    {dept.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Job Titles to Track */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <Briefcase className="size-3.5 text-black/40 dark:text-white/40" />
                            Job Titles to Track
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newJobTitle}
                                onChange={(e) => setNewJobTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addJobTitle()}
                                placeholder="Add a job title..."
                                className="h-9 flex-1 rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                            />
                            <Button
                                onClick={addJobTitle}
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-lg border-black/10 px-3 dark:border-white/10"
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>
                        {jobTitles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {jobTitles.map((title) => (
                                    <span
                                        key={title}
                                        className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs text-black/70 dark:bg-white/5 dark:text-white/70"
                                    >
                                        {title}
                                        <button
                                            onClick={() => removeJobTitle(title)}
                                            className="ml-1 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tech Stack */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <Code className="size-3.5 text-black/40 dark:text-white/40" />
                            Tech Stack Signals
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {techOptions.map((tech) => (
                                <button
                                    key={tech}
                                    onClick={() => toggleTech(tech)}
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                                        selectedTech.includes(tech)
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                                    )}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Min Jobs */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                            Minimum Job Postings
                        </label>
                        <input
                            type="number"
                            value={minJobs}
                            onChange={(e) => setMinJobs(parseInt(e.target.value) || 1)}
                            min={1}
                            max={50}
                            className="h-10 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:focus:border-white/20"
                        />
                        <p className="mt-1 text-xs text-black/40 dark:text-white/40">
                            Only include companies with at least this many matching jobs
                        </p>
                    </div>

                    {/* Scrapers */}
                    <div>
                        <label className="mb-3 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <Briefcase className="size-3.5 text-black/40 dark:text-white/40" />
                            Job Scrapers ({scrapers.length})
                        </label>

                        {/* Existing scrapers */}
                        {scrapers.length > 0 && (
                            <div className="mb-4 space-y-2">
                                {scrapers.map((scraper) => (
                                    <div
                                        key={scraper.id}
                                        className="flex items-center justify-between rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 dark:border-white/10 dark:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="size-4 text-black/40 dark:text-white/40" />
                                            <div>
                                                <div className="text-sm font-medium text-black dark:text-white">
                                                    {scraper.jobTitle}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                                                    <MapPin className="size-3" />
                                                    {scraper.location}
                                                    <span className="text-black/20 dark:text-white/20">•</span>
                                                    <GraduationCap className="size-3" />
                                                    {experienceLevelOptions.find((e) => e.id === scraper.experienceLevel)?.label || 'Any'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeScraper(scraper.id)}
                                            className="rounded p-1.5 text-black/30 hover:bg-red-50 hover:text-red-500 dark:text-white/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add new scraper */}
                        <div className="rounded-lg border border-dashed border-black/10 p-4 dark:border-white/10">
                            <p className="mb-3 text-xs font-medium text-black/60 dark:text-white/60">
                                Add new scraper
                            </p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <input
                                    type="text"
                                    value={newScraperTitle}
                                    onChange={(e) => setNewScraperTitle(e.target.value)}
                                    placeholder="Job title"
                                    className="h-9 rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                                />
                                <select
                                    value={newScraperLocation}
                                    onChange={(e) => setNewScraperLocation(e.target.value)}
                                    className="h-9 rounded-lg border border-black/10 bg-white px-2 text-sm focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:focus:border-white/20"
                                >
                                    {locationOptions.map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={newScraperExperience}
                                    onChange={(e) => setNewScraperExperience(e.target.value)}
                                    className="h-9 rounded-lg border border-black/10 bg-white px-2 text-sm focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:focus:border-white/20"
                                >
                                    {experienceLevelOptions.map((level) => (
                                        <option key={level.id} value={level.id}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                onClick={addScraper}
                                variant="outline"
                                size="sm"
                                className="mt-3 h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                            >
                                <Plus className="mr-1 size-3" />
                                Add Scraper
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-black/[0.02] px-6 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
