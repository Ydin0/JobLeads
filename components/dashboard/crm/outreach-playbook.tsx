'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Phone,
    Mail,
    Copy,
    Check,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Sparkles,
    RefreshCw,
} from 'lucide-react'
import type { OutreachPlaybook } from '@/lib/mock-ai-content'

interface OutreachPlaybookProps {
    playbook: OutreachPlaybook
    className?: string
    onRegenerate?: () => void
    isRegenerating?: boolean
}

function CopyableContent({
    title,
    content,
    className,
}: {
    title: string
    content: string
    className?: string
}) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={cn('rounded-lg border border-black/5 bg-black/[0.01] dark:border-white/5 dark:bg-white/[0.01]', className)}>
            <div className="flex items-center justify-between border-b border-black/5 px-3 py-2 dark:border-white/5">
                <span className="text-xs font-medium text-black dark:text-white">{title}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2 text-[10px]"
                >
                    {copied ? (
                        <>
                            <Check className="mr-1 size-3 text-green-500" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="mr-1 size-3" />
                            Copy
                        </>
                    )}
                </Button>
            </div>
            <div className="p-3">
                <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-black/60 dark:text-white/60">
                    {content}
                </pre>
            </div>
        </div>
    )
}

function ObjectionHandler({
    objection,
    response,
}: {
    objection: string
    response: string
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(response)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="rounded-lg border border-black/5 bg-black/[0.01] dark:border-white/5 dark:bg-white/[0.01]">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
            >
                <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3 shrink-0 text-yellow-500" />
                    <span className="text-xs text-black dark:text-white">&ldquo;{objection}&rdquo;</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="size-3 text-black/40 dark:text-white/40" />
                ) : (
                    <ChevronDown className="size-3 text-black/40 dark:text-white/40" />
                )}
            </button>
            {isExpanded && (
                <div className="border-t border-black/5 px-3 py-2 dark:border-white/5">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] leading-relaxed text-black/60 dark:text-white/60">
                            {response}
                        </p>
                        <button
                            onClick={handleCopy}
                            className="shrink-0 rounded p-1 text-black/30 hover:bg-black/5 hover:text-black/60 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                            title="Copy response"
                        >
                            {copied ? (
                                <Check className="size-3 text-green-500" />
                            ) : (
                                <Copy className="size-3" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

type EmailTab = 'initial' | 'followUp' | 'breakup'

export function OutreachPlaybookComponent({ playbook, className, onRegenerate, isRegenerating }: OutreachPlaybookProps) {
    const [emailTab, setEmailTab] = useState<EmailTab>('initial')
    const [showAllObjections, setShowAllObjections] = useState(false)

    const emailTabs: { id: EmailTab; label: string }[] = [
        { id: 'initial', label: 'Initial' },
        { id: 'followUp', label: 'Follow-up' },
        { id: 'breakup', label: 'Break-up' },
    ]

    const visibleObjections = showAllObjections
        ? playbook.objectionHandlers
        : playbook.objectionHandlers.slice(0, 3)

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--theme-accent)] to-red-500 dark:from-purple-500 dark:to-blue-500">
                    <Sparkles className="size-3 text-white" />
                </div>
                <span className="text-xs font-medium text-black dark:text-white">
                    Outreach Playbook
                </span>
                <span className="rounded-full bg-[var(--theme-accent)]/10 px-1.5 py-0.5 text-[9px] font-medium text-[var(--theme-accent)] dark:bg-purple-500/10 dark:text-purple-400">
                    GPT-5 mini
                </span>
                {onRegenerate && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="ml-auto h-6 px-2 text-[10px]"
                    >
                        <RefreshCw className={cn('mr-1 size-3', isRegenerating && 'animate-spin')} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                )}
            </div>

            {/* Cold Call Script */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Phone className="size-3.5 text-green-500" />
                    <span className="text-xs font-medium text-black dark:text-white">
                        Cold Call Script
                    </span>
                </div>
                <CopyableContent title="Script" content={playbook.coldCallScript} />
            </div>

            {/* Email Templates */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <Mail className="size-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-black dark:text-white">
                        Email Templates
                    </span>
                </div>

                {/* Tabs */}
                <div className="mb-2 flex gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
                    {emailTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setEmailTab(tab.id)}
                            className={cn(
                                'flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors',
                                emailTab === tab.id
                                    ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                    : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <CopyableContent
                    title={`${emailTabs.find((t) => t.id === emailTab)?.label} Email`}
                    content={playbook.emailTemplates[emailTab]}
                />
            </div>

            {/* Objection Handlers */}
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="size-3.5 text-orange-500" />
                    <span className="text-xs font-medium text-black dark:text-white">
                        Objection Handlers
                    </span>
                </div>

                <div className="space-y-2">
                    {visibleObjections.map((handler, index) => (
                        <ObjectionHandler
                            key={index}
                            objection={handler.objection}
                            response={handler.response}
                        />
                    ))}

                    {playbook.objectionHandlers.length > 3 && (
                        <button
                            onClick={() => setShowAllObjections(!showAllObjections)}
                            className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-black/40 transition-colors hover:bg-black/[0.02] hover:text-black/60 dark:text-white/40 dark:hover:bg-white/[0.02] dark:hover:text-white/60"
                        >
                            {showAllObjections ? (
                                <>
                                    <ChevronUp className="size-3" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="size-3" />
                                    Show all {playbook.objectionHandlers.length} objections
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
