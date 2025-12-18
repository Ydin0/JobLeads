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
            {/* Icon */}
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-accent)]/20 to-red-500/20 dark:from-purple-500/20 dark:to-blue-500/20">
                {isInsights ? (
                    <Brain className="size-6 text-[var(--theme-accent)] dark:text-purple-400" />
                ) : (
                    <MessageSquare className="size-6 text-[var(--theme-accent)] dark:text-purple-400" />
                )}
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

            {/* Generate Button */}
            <Button
                onClick={onGenerate}
                disabled={isLoading}
                className="mt-4 h-9 bg-gradient-to-r from-[var(--theme-accent)] to-red-500 px-4 text-sm text-white shadow-lg shadow-[var(--theme-accent)]/25 hover:from-[var(--theme-accent)]/90 hover:to-red-500/90 dark:from-purple-500 dark:to-blue-500 dark:shadow-purple-500/25 dark:hover:from-purple-600 dark:hover:to-blue-600"
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

            {/* Powered by note */}
            <p className="mt-3 text-[10px] text-black/30 dark:text-white/30">
                Powered by GPT-5 mini
            </p>
        </div>
    )
}
