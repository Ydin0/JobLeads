'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Mic,
    MicOff,
    PhoneOff,
    ChevronRight,
    ChevronLeft,
    Building2,
    CheckCircle2,
    Circle,
    MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock call data
const mockCallData = {
    company: 'Acme Corporation',
    contact: 'Sarah Johnson',
    contactTitle: 'VP of Sales Operations',
    talkingPoints: [
        'Address manual data entry pain point',
        'Mention integration capabilities',
        'Highlight ROI metrics',
        'Discuss Q1 implementation timeline',
    ],
    objectionHandlers: [
        { objection: "We're using Salesforce", short: "Integration compatible" },
        { objection: "No budget", short: "3x ROI in Q1" },
        { objection: "Too busy", short: "Send 2-min video" },
        { objection: "Send email", short: "Ask about challenges first" },
    ],
}

// Animated waveform that updates periodically
function LiveWaveform({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) {
    const [bars, setBars] = useState<number[]>(Array(40).fill(20))
    const animationRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (isActive) {
            const animate = () => {
                setBars(
                    Array(40)
                        .fill(0)
                        .map(() => {
                            const base = isSpeaking ? 40 : 30
                            const variance = isSpeaking ? 50 : 40
                            return Math.random() * variance + base
                        })
                )
            }

            animate()
            animationRef.current = setInterval(animate, 150)

            return () => {
                if (animationRef.current) {
                    clearInterval(animationRef.current)
                }
            }
        } else {
            setBars(Array(40).fill(20))
        }
    }, [isActive, isSpeaking])

    return (
        <div className="flex h-32 items-center justify-center gap-[3px]">
            {bars.map((height, i) => (
                <div
                    key={i}
                    className={cn(
                        'w-1.5 rounded-full transition-all duration-150',
                        isActive
                            ? isSpeaking
                                ? 'bg-purple-400 dark:bg-purple-400'
                                : 'bg-emerald-400 dark:bg-emerald-400'
                            : 'bg-black/10 dark:bg-white/10'
                    )}
                    style={{
                        height: `${height}%`,
                        opacity: isActive ? 0.4 + (height / 100) * 0.6 : 1,
                    }}
                />
            ))}
        </div>
    )
}

export default function ActiveCallPage() {
    const params = useParams()
    const router = useRouter()
    const callId = params.id as string

    const [callState, setCallState] = useState<'connecting' | 'ringing' | 'active' | 'ended'>('connecting')
    const [isMuted, setIsMuted] = useState(false)
    const [aiSpeaking, setAiSpeaking] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [checkedPoints, setCheckedPoints] = useState<number[]>([])

    // Simulate call progression
    useEffect(() => {
        const connectingTimer = setTimeout(() => {
            setCallState('ringing')
        }, 1500)

        const ringingTimer = setTimeout(() => {
            setCallState('active')
        }, 4000)

        return () => {
            clearTimeout(connectingTimer)
            clearTimeout(ringingTimer)
        }
    }, [])

    // Timer for active call
    useEffect(() => {
        if (callState === 'active') {
            const timer = setInterval(() => {
                setElapsedTime((prev) => prev + 1)
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [callState])

    // Simulate AI speaking alternation
    useEffect(() => {
        if (callState === 'active') {
            const speakingInterval = setInterval(() => {
                setAiSpeaking((prev) => !prev)
            }, 3000 + Math.random() * 2000)

            return () => clearInterval(speakingInterval)
        }
    }, [callState])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleEndCall = () => {
        setCallState('ended')
        setTimeout(() => {
            router.push(`/dashboard/trainer/call/${callId}/results`)
        }, 1000)
    }

    const togglePoint = (index: number) => {
        setCheckedPoints((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        )
    }

    const getStatusText = () => {
        switch (callState) {
            case 'connecting':
                return 'Connecting...'
            case 'ringing':
                return 'Ringing...'
            case 'active':
                return aiSpeaking ? 'AI Speaking...' : 'Listening...'
            case 'ended':
                return 'Call Ended'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0a0a0f] dark:to-[#0f0f18]">
            {/* Main Call Area */}
            <div className="flex flex-1 flex-col items-center justify-center p-8">
                {/* Company & Contact Info */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-black/50 dark:text-white/50">
                        <Building2 className="size-4" />
                        {mockCallData.company}
                    </div>
                    <h1 className="mt-2 text-3xl font-semibold text-black dark:text-white">
                        {mockCallData.contact}
                    </h1>
                    <p className="mt-1 text-black/50 dark:text-white/50">
                        {mockCallData.contactTitle}
                    </p>
                </div>

                {/* Timer */}
                <div className="mt-8 text-5xl font-light tabular-nums text-black dark:text-white">
                    {formatTime(elapsedTime)}
                </div>

                {/* Status */}
                <div
                    className={cn(
                        'mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium',
                        callState === 'connecting' && 'bg-gradient-to-r from-orange-50 to-amber-50/50 text-orange-600 dark:from-orange-500/10 dark:to-amber-500/5 dark:text-orange-400',
                        callState === 'ringing' && 'bg-gradient-to-r from-purple-50 to-violet-50/50 text-purple-600 dark:from-purple-500/10 dark:to-violet-500/5 dark:text-purple-400',
                        callState === 'active' && aiSpeaking && 'bg-gradient-to-r from-purple-50 to-violet-50/50 text-purple-600 dark:from-purple-500/10 dark:to-violet-500/5 dark:text-purple-400',
                        callState === 'active' && !aiSpeaking && 'bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-600 dark:from-emerald-500/10 dark:to-teal-500/5 dark:text-emerald-400',
                        callState === 'ended' && 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60'
                    )}
                >
                    <span
                        className={cn(
                            'size-2 rounded-full',
                            callState === 'connecting' && 'animate-pulse bg-orange-500',
                            callState === 'ringing' && 'animate-pulse bg-purple-500',
                            callState === 'active' && aiSpeaking && 'bg-purple-500',
                            callState === 'active' && !aiSpeaking && 'bg-emerald-500',
                            callState === 'ended' && 'bg-black/40 dark:bg-white/40'
                        )}
                    />
                    {getStatusText()}
                </div>

                {/* Waveform */}
                <div className="mt-8 w-full max-w-md">
                    <LiveWaveform
                        isActive={callState === 'active'}
                        isSpeaking={aiSpeaking}
                    />
                </div>

                {/* Controls */}
                <div className="mt-12 flex items-center gap-4">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={cn(
                            'flex size-14 items-center justify-center rounded-full transition-all',
                            isMuted
                                ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                                : 'bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10'
                        )}
                    >
                        {isMuted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl"
                    >
                        <PhoneOff className="size-7" />
                    </button>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="flex size-14 items-center justify-center rounded-full bg-black/5 text-black/60 transition-all hover:bg-black/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
                    >
                        <MessageSquare className="size-6" />
                    </button>
                </div>
            </div>

            {/* Quick Reference Sidebar */}
            <div
                className={cn(
                    'flex flex-col border-l border-black/10 bg-white transition-all duration-300 dark:border-white/10 dark:bg-[#0a0a0f]',
                    sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
                )}
            >
                <div className="flex items-center justify-between border-b border-black/10 p-4 dark:border-white/10">
                    <h2 className="font-semibold text-black dark:text-white">Quick Reference</h2>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                    >
                        <ChevronRight className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {/* Talking Points Checklist */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                            Talking Points
                        </h3>
                        <ul className="mt-3 space-y-2">
                            {mockCallData.talkingPoints.map((point, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => togglePoint(index)}
                                        className="flex items-start gap-2 text-left"
                                    >
                                        {checkedPoints.includes(index) ? (
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                                        ) : (
                                            <Circle className="mt-0.5 size-4 shrink-0 text-black/20 dark:text-white/20" />
                                        )}
                                        <span
                                            className={cn(
                                                'text-sm',
                                                checkedPoints.includes(index)
                                                    ? 'text-black/40 line-through dark:text-white/40'
                                                    : 'text-black/70 dark:text-white/70'
                                            )}
                                        >
                                            {point}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Objection Responses */}
                    <div className="mt-6">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                            Quick Responses
                        </h3>
                        <div className="mt-3 space-y-2">
                            {mockCallData.objectionHandlers.map((handler, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-black/5 p-2 dark:border-white/5"
                                >
                                    <div className="text-xs font-medium text-black/60 dark:text-white/60">
                                        &quot;{handler.objection}&quot;
                                    </div>
                                    <div className="mt-1 text-xs text-black/50 dark:text-white/50">
                                        → {handler.short}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Toggle (when closed) */}
            {!sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg dark:bg-[#1a1a24]"
                >
                    <ChevronLeft className="size-5 text-black/60 dark:text-white/60" />
                </button>
            )}
        </div>
    )
}
