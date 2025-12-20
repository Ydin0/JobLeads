'use client'

import React from 'react'
import Image from 'next/image'
import { Zap, Sparkles, Users, User, Mail, Building2, Briefcase, Lock, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { useClerk, useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const features = [
    {
        icon: Zap,
        title: 'Smart Automation',
        description: 'Scrape jobs and enrich leads automatically',
    },
    {
        icon: Sparkles,
        title: 'AI Insights',
        description: 'Get intelligent recommendations for outreach',
    },
    {
        icon: Users,
        title: 'Team Collaboration',
        description: 'Share ICPs and manage credits together',
    },
]

const avatars = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
]

export default function Home() {
    const clerk = useClerk()
    const { signIn, setActive, isLoaded } = useSignIn()
    const router = useRouter()

    // Waitlist dialog state
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isSubmitted, setIsSubmitted] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        company: '',
        role: '',
    })

    // Sign in dialog state
    const [isSignInDialogOpen, setIsSignInDialogOpen] = React.useState(false)
    const [isSigningIn, setIsSigningIn] = React.useState(false)
    const [signInError, setSignInError] = React.useState<string | null>(null)
    const [signInStep, setSignInStep] = React.useState<'email' | 'otp' | 'forgot' | 'reset'>('email')
    const [signInEmail, setSignInEmail] = React.useState('')
    const [otpCode, setOtpCode] = React.useState('')
    const [newPassword, setNewPassword] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.email || !formData.name) return

        setIsSubmitting(true)
        setError(null)

        try {
            // Join the Clerk waitlist using the dedicated waitlist API
            await clerk.joinWaitlist({
                emailAddress: formData.email,
            })
            setIsSubmitted(true)
        } catch (err: unknown) {
            const clerkError = err as { errors?: Array<{ message: string }> }
            setError(clerkError.errors?.[0]?.message || 'Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }))
    }

    // Step 1: Request OTP code
    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !signIn || !signInEmail) return

        setIsSigningIn(true)
        setSignInError(null)

        try {
            const result = await signIn.create({
                identifier: signInEmail,
            })

            const emailCodeFactor = result.supportedFirstFactors?.find(
                (factor) => factor.strategy === 'email_code'
            )

            if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
                await signIn.prepareFirstFactor({
                    strategy: 'email_code',
                    emailAddressId: emailCodeFactor.emailAddressId,
                })
                setSignInStep('otp')
            } else {
                setSignInError('Email sign-in is not available for this account.')
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: Array<{ message: string }> }
            setSignInError(clerkError.errors?.[0]?.message || 'Failed to send verification code.')
        } finally {
            setIsSigningIn(false)
        }
    }

    // Step 2: Verify OTP code
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !signIn || !otpCode) return

        setIsSigningIn(true)
        setSignInError(null)

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'email_code',
                code: otpCode,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/dashboard')
            } else {
                setSignInError('Verification failed. Please try again.')
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: Array<{ message: string }> }
            setSignInError(clerkError.errors?.[0]?.message || 'Invalid verification code.')
        } finally {
            setIsSigningIn(false)
        }
    }

    // Forgot password: Request reset code
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !signIn || !signInEmail) return

        setIsSigningIn(true)
        setSignInError(null)

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: signInEmail,
            })
            setSignInStep('reset')
        } catch (err: unknown) {
            const clerkError = err as { errors?: Array<{ message: string }> }
            setSignInError(clerkError.errors?.[0]?.message || 'Failed to send reset code.')
        } finally {
            setIsSigningIn(false)
        }
    }

    // Forgot password: Reset with new password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !signIn || !otpCode || !newPassword) return

        setIsSigningIn(true)
        setSignInError(null)

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: otpCode,
                password: newPassword,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/dashboard')
            } else {
                setSignInError('Password reset failed. Please try again.')
            }
        } catch (err: unknown) {
            const clerkError = err as { errors?: Array<{ message: string }> }
            setSignInError(clerkError.errors?.[0]?.message || 'Failed to reset password.')
        } finally {
            setIsSigningIn(false)
        }
    }

    // Reset sign-in dialog state
    const resetSignInDialog = () => {
        setSignInStep('email')
        setSignInEmail('')
        setOtpCode('')
        setNewPassword('')
        setSignInError(null)
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#f8f8f8] dark:bg-[#0a0a0f]">
            {/* Header */}
            <header className="relative flex items-center justify-center px-6 py-6">
                <Image
                    src="/LogoLight.svg"
                    alt="Leadey"
                    width={120}
                    height={32}
                    className="h-8 w-auto dark:hidden"
                />
                <Image
                    src="/LogoDark.svg"
                    alt="Leadey"
                    width={120}
                    height={32}
                    className="hidden h-8 w-auto dark:block"
                />
                <div className="absolute right-6">
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
                {/* Beta Badge */}
                <div className="mb-8 flex items-center gap-2">
                    <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-medium text-black/70 dark:text-white/70">
                        Beta version 1.0.0
                    </span>
                </div>

                {/* Headline */}
                <h1 className="max-w-2xl text-center text-4xl font-semibold tracking-tight text-black dark:text-white md:text-5xl lg:text-6xl">
                    Early Access to the Future of{' '}
                    <span className="italic">Lead Gen</span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto mt-6 max-w-lg text-center text-black/60 dark:text-white/60">
                    Turn job postings into qualified leads. Scrape, enrich, and export to your CRM — all in one place.
                </p>

                {/* CTA Buttons */}
                <div className="mt-10 flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            resetSignInDialog()
                            setIsSignInDialogOpen(true)
                        }}
                        className="h-11 rounded-full border-black/10 px-6 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                    >
                        Sign In
                    </Button>
                    <Button
                        onClick={() => {
                            setError(null)
                            setIsDialogOpen(true)
                        }}
                        className="h-11 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        Join Waitlist
                    </Button>
                </div>

                {/* Social Proof */}
                <div className="mt-6 flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {avatars.map((avatar, i) => (
                            <Image
                                key={i}
                                src={avatar}
                                alt=""
                                width={32}
                                height={32}
                                className="size-8 rounded-full border-2 border-[#f8f8f8] object-cover dark:border-[#0a0a0f]"
                            />
                        ))}
                    </div>
                    <span className="text-sm text-black/60 dark:text-white/60">
                        Join 500+ sales teams on the waitlist
                    </span>
                </div>

                {/* Features */}
                <div className="mt-16 grid w-full max-w-3xl gap-8 md:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group flex flex-col items-center text-center"
                        >
                            {/* Gradient outline icon */}
                            <div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-px transition-transform duration-300 group-hover:scale-110 dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                <div className="flex size-12 items-center justify-center rounded-full bg-[#f8f8f8] dark:bg-[#0a0a0f]">
                                    <feature.icon className="size-5 text-black/70 dark:text-white/70" />
                                </div>
                            </div>
                            <h3 className="mt-4 font-semibold text-black dark:text-white">
                                {feature.title}
                            </h3>
                            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Waitlist Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="gap-0 overflow-hidden border-black/10 bg-white p-0 dark:border-white/10 dark:bg-[#0a0a0f] sm:max-w-2xl">
                    <div className="grid md:grid-cols-2">
                        {/* Left side - Form */}
                        <div className="p-6 md:p-8">
                            {isSubmitted ? (
                                <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                                    <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-500/20 dark:to-emerald-600/20">
                                        <svg className="size-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-black dark:text-white">
                                        You&apos;re on the list!
                                    </h3>
                                    <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                                        Thanks for signing up! We&apos;ll notify you when we launch.
                                    </p>
                                    <Button
                                        onClick={() => {
                                            setIsDialogOpen(false)
                                            setIsSubmitted(false)
                                            setFormData({ name: '', email: '', company: '', role: '' })
                                        }}
                                        className="mt-6 h-10 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                    >
                                        Done
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                            Early Access
                                        </span>
                                        <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
                                            Join the Waitlist
                                        </h3>
                                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                            Be the first to know when we launch.
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    name="name"
                                                    placeholder="John Doe"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Work Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    name="email"
                                                    type="email"
                                                    placeholder="john@company.com"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Company Name
                                            </label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    name="company"
                                                    placeholder="Acme Inc."
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Your Role
                                            </label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    name="role"
                                                    placeholder="Sales Manager"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                />
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                {error}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="mt-2 h-11 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </div>

                        {/* Right side - Decorative */}
                        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] dark:from-[#131318] dark:to-[#0a0a0f] md:block">
                            {/* Gradient orbs */}
                            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-violet-300/40 to-purple-400/30 blur-3xl dark:from-violet-500/20 dark:to-purple-600/10" />
                            <div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-400/30 blur-3xl dark:from-rose-500/20 dark:to-pink-600/10" />

                            {/* Content */}
                            <div className="relative flex h-full flex-col items-center justify-center p-8">
                                <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-black dark:bg-white">
                                            <Image
                                                src="/LogoIcon.svg"
                                                alt=""
                                                width={20}
                                                height={20}
                                                className="size-5"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-black dark:text-white">Leadey AI</p>
                                            <p className="text-xs text-black/50 dark:text-white/50">Your lead gen assistant</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm text-black/70 dark:text-white/70">
                                        Ready to help you find qualified leads from job postings. Let&apos;s get you set up!
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {avatars.map((avatar, i) => (
                                            <Image
                                                key={i}
                                                src={avatar}
                                                alt=""
                                                width={28}
                                                height={28}
                                                className="size-7 rounded-full border-2 border-white object-cover dark:border-[#131318]"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-black/50 dark:text-white/50">
                                        500+ already joined
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sign In Dialog */}
            <Dialog open={isSignInDialogOpen} onOpenChange={setIsSignInDialogOpen}>
                <DialogContent className="gap-0 overflow-hidden border-black/10 bg-white p-0 dark:border-white/10 dark:bg-[#0a0a0f] sm:max-w-2xl">
                    <div className="grid md:grid-cols-2">
                        {/* Left side - Form */}
                        <div className="flex min-h-[420px] flex-col p-6 md:p-8">
                            {/* Step 1: Enter Email */}
                            {signInStep === 'email' && (
                                <>
                                    <div className="mb-6">
                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                            Welcome Back
                                        </span>
                                        <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
                                            Sign In
                                        </h3>
                                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                            Enter your email to receive a sign-in code.
                                        </p>
                                    </div>

                                    <form onSubmit={handleRequestOtp} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    type="email"
                                                    placeholder="john@company.com"
                                                    value={signInEmail}
                                                    onChange={(e) => setSignInEmail(e.target.value)}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {signInError && (
                                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                {signInError}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSigningIn}
                                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            {isSigningIn ? (
                                                'Sending code...'
                                            ) : (
                                                <>
                                                    Continue
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignInError(null)
                                                setSignInStep('forgot')
                                            }}
                                            className="text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-black/50 dark:text-white/50">
                                            Don&apos;t have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsSignInDialogOpen(false)
                                                    setIsDialogOpen(true)
                                                }}
                                                className="font-medium text-black hover:underline dark:text-white"
                                            >
                                                Join Waitlist
                                            </button>
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* Step 2: Enter OTP */}
                            {signInStep === 'otp' && (
                                <>
                                    <div className="mb-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignInStep('email')
                                                setOtpCode('')
                                                setSignInError(null)
                                            }}
                                            className="mb-4 flex items-center gap-1 text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            <ArrowLeft className="size-4" />
                                            Back
                                        </button>
                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                            Verify Your Email
                                        </span>
                                        <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
                                            Enter Code
                                        </h3>
                                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                            We sent a code to <span className="font-medium text-black dark:text-white">{signInEmail}</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Verification Code
                                            </label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-center text-lg tracking-widest text-black placeholder:text-sm placeholder:tracking-normal placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {signInError && (
                                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                {signInError}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSigningIn}
                                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            {isSigningIn ? (
                                                'Verifying...'
                                            ) : (
                                                <>
                                                    Sign In
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleRequestOtp({ preventDefault: () => {} } as React.FormEvent)}
                                            className="text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            Resend code
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Forgot Password: Enter Email */}
                            {signInStep === 'forgot' && (
                                <>
                                    <div className="mb-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignInStep('email')
                                                setSignInError(null)
                                            }}
                                            className="mb-4 flex items-center gap-1 text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            <ArrowLeft className="size-4" />
                                            Back to sign in
                                        </button>
                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                            Reset Password
                                        </span>
                                        <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
                                            Forgot Password?
                                        </h3>
                                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                            Enter your email to receive a password reset code.
                                        </p>
                                    </div>

                                    <form onSubmit={handleForgotPassword} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    type="email"
                                                    placeholder="john@company.com"
                                                    value={signInEmail}
                                                    onChange={(e) => setSignInEmail(e.target.value)}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {signInError && (
                                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                {signInError}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSigningIn}
                                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            {isSigningIn ? (
                                                'Sending code...'
                                            ) : (
                                                <>
                                                    Send Reset Code
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </>
                            )}

                            {/* Reset Password: Enter Code & New Password */}
                            {signInStep === 'reset' && (
                                <>
                                    <div className="mb-6">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignInStep('forgot')
                                                setOtpCode('')
                                                setNewPassword('')
                                                setSignInError(null)
                                            }}
                                            className="mb-4 flex items-center gap-1 text-sm text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            <ArrowLeft className="size-4" />
                                            Back
                                        </button>
                                        <span className="text-xs font-medium text-black/40 dark:text-white/40">
                                            Reset Password
                                        </span>
                                        <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
                                            Create New Password
                                        </h3>
                                        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                                            Enter the code sent to <span className="font-medium text-black dark:text-white">{signInEmail}</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                Reset Code
                                            </label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    type="text"
                                                    placeholder="Enter 6-digit code"
                                                    value={otpCode}
                                                    onChange={(e) => setOtpCode(e.target.value)}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-center text-lg tracking-widest text-black placeholder:text-sm placeholder:tracking-normal placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    maxLength={6}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-black/70 dark:text-white/70">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                                                <Input
                                                    type="password"
                                                    placeholder="Enter new password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {signInError && (
                                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                                {signInError}
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={isSigningIn}
                                            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            {isSigningIn ? (
                                                'Resetting...'
                                            ) : (
                                                <>
                                                    Reset Password & Sign In
                                                    <ArrowRight className="size-4" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </>
                            )}
                        </div>

                        {/* Right side - Decorative */}
                        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] dark:from-[#131318] dark:to-[#0a0a0f] md:block">
                            {/* Gradient orbs */}
                            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-violet-300/40 to-purple-400/30 blur-3xl dark:from-violet-500/20 dark:to-purple-600/10" />
                            <div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-400/30 blur-3xl dark:from-rose-500/20 dark:to-pink-600/10" />

                            {/* Content */}
                            <div className="relative flex h-full flex-col items-center justify-center p-8">
                                <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-black dark:bg-white">
                                            <Image
                                                src="/LogoIcon.svg"
                                                alt=""
                                                width={20}
                                                height={20}
                                                className="size-5"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-black dark:text-white">Leadey AI</p>
                                            <p className="text-xs text-black/50 dark:text-white/50">Your lead gen assistant</p>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm text-black/70 dark:text-white/70">
                                        {signInStep === 'forgot' || signInStep === 'reset'
                                            ? "No worries! We'll help you get back into your account securely."
                                            : "Welcome back! Sign in to access your leads and continue building your pipeline."}
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center gap-3">
                                    <div className="flex items-center gap-2 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/5">
                                        <span className="relative flex size-2">
                                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                                        </span>
                                        <span className="text-xs text-black/60 dark:text-white/60">
                                            {signInStep === 'otp' || signInStep === 'reset' ? 'Check your email' : 'System operational'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
