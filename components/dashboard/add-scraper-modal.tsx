'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus, MapPin, Briefcase, GraduationCap } from 'lucide-react'
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

interface AddScraperModalProps {
    icpId: string
    icpName: string
    existingScrapers: ScraperConfig[]
    existingFilters: SearchFilters
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

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

export function AddScraperModal({
    icpId,
    icpName,
    existingScrapers,
    existingFilters,
    open,
    onOpenChange,
    onSuccess,
}: AddScraperModalProps) {
    const [jobTitle, setJobTitle] = useState('')
    const [location, setLocation] = useState('United States')
    const [experienceLevel, setExperienceLevel] = useState('any')
    const [isSaving, setIsSaving] = useState(false)

    if (!open) return null

    const handleSave = async () => {
        if (!jobTitle.trim()) {
            toast.error('Please enter a job title')
            return
        }

        setIsSaving(true)
        try {
            const newScraper: ScraperConfig = {
                jobTitle: jobTitle.trim(),
                location,
                experienceLevel,
            }

            const updatedScrapers = [...existingScrapers, newScraper]

            const response = await fetch(`/api/searches/${icpId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filters: {
                        ...existingFilters,
                        scrapers: updatedScrapers,
                    },
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to add scraper')
            }

            toast.success('Scraper added successfully')
            onSuccess()
            onOpenChange(false)

            // Reset form
            setJobTitle('')
            setLocation('United States')
            setExperienceLevel('any')
        } catch (error) {
            console.error('Error adding scraper:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to add scraper')
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
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                            <Plus className="size-4 text-black dark:text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                Add Scraper
                            </h2>
                            <p className="text-xs text-black/50 dark:text-white/50">
                                Add a new job scraper to {icpName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 p-5">
                    {/* Job Title */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <Briefcase className="size-3.5 text-black/40 dark:text-white/40" />
                            Job Title
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., DevOps Engineer, Sales Manager"
                            className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <MapPin className="size-3.5 text-black/40 dark:text-white/40" />
                            Location
                        </label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:focus:border-white/20"
                        >
                            {locationOptions.map((loc) => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="mb-2 flex items-center gap-2 text-xs font-medium text-black dark:text-white">
                            <GraduationCap className="size-3.5 text-black/40 dark:text-white/40" />
                            Experience Level
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {experienceLevelOptions.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => setExperienceLevel(level.id)}
                                    className={cn(
                                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                        experienceLevel === level.id
                                            ? 'bg-black text-white dark:bg-white dark:text-black'
                                            : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                                    )}
                                >
                                    {level.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Current scrapers count */}
                    {existingScrapers.length > 0 && (
                        <div className="rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2 dark:border-white/5 dark:bg-white/[0.02]">
                            <p className="text-xs text-black/50 dark:text-white/50">
                                This ICP currently has {existingScrapers.length} scraper{existingScrapers.length !== 1 ? 's' : ''}.
                                Adding this will bring it to {existingScrapers.length + 1}.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !jobTitle.trim()}
                        className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        {isSaving ? 'Adding...' : 'Add Scraper'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
