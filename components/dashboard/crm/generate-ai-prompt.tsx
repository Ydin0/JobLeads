'use client'

import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Brain, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GenerateAIPromptProps {
    type: 'insights' | 'playbook'
    isLoading: boolean
    onGenerate: () => void
    error?: string | null
    className?: string
}

export function GenerateAIPrompt({
    type,
    isLoading,
    onGenerate,
    error,
    className,
}: GenerateAIPromptProps) {
    const isInsights = type === 'insights'

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-8 text-center',
                className
            )}
        >
            {/* Icon with gradient border */}
            <div className="rounded-xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                <div className="flex size-12 items-center justify-center rounded-xl bg-white dark:bg-[#0a0a0f]">
                    {isInsights ? (
                        <Brain className="size-6 text-black/60 dark:text-white/60" />
                    ) : (
                        <MessageSquare className="size-6 text-black/60 dark:text-white/60" />
                    )}
                </div>
            </div>

            {/* Title */}
            <h4 className="mt-4 text-sm font-medium text-black dark:text-white">
                {isInsights ? 'Generate AI Insights' : 'Generate Outreach Playbook'}
            </h4>

            {/* Description */}
            <p className="mt-1.5 max-w-xs text-xs text-black/50 dark:text-white/50">
                {isInsights
                    ? 'Get AI-powered company analysis, decision-maker insights, timing signals, and competitive intelligence.'
                    : 'Get personalized cold call scripts, email templates, and objection handlers tailored to this company.'}
            </p>

            {/* Error message */}
            {error && (
                <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Generate Button with gradient border */}
            <div className="mt-4 rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                <Button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 size-4" />
                            Generate with AI
                        </>
                    )}
                </Button>
            </div>

            {/* Powered by note */}
            <p className="mt-3 text-[10px] text-black/30 dark:text-white/30">
                Powered by GPT-4o mini
            </p>
        </div>
    )
}
