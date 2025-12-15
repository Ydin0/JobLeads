'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Star, Zap } from 'lucide-react'
import { TextEffect } from '@/components/ui/text-effect'

const testimonialsData = [
    {
        id: 'sarah' as const,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        text: 'RecLead has completely transformed how we source new clients. We used to spend hours manually searching job boards - now we get fresh leads delivered to our CRM every morning. Our pipeline has never been fuller.',
        name: 'Sarah Mitchell',
        title: 'Director, TalentPro Recruiting',
        company: 'TalentPro',
        resultText: '3x more qualified leads per month',
        resultText2: '60% reduction in sourcing time',
    },
    {
        id: 'james' as const,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        text: 'The contact enrichment feature is a game-changer. We went from having just company names to having direct emails and phone numbers for hiring managers. Our response rates have skyrocketed.',
        name: 'James Rodriguez',
        title: 'Founder, Apex Staffing',
        company: 'Apex',
        resultText: '85% email deliverability rate',
        resultText2: '4x improvement in response rates',
    },
    {
        id: 'emily' as const,
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        text: 'We tried building our own scraping solution but it was a nightmare to maintain. RecLead just works - reliable data, great integrations, and their support team actually understands recruitment.',
        name: 'Emily Chen',
        title: 'Operations Lead, Swift Recruit',
        company: 'Swift',
        resultText: '500+ new leads weekly on autopilot',
        resultText2: 'ROI positive within first month',
    },
]

type TestimonialId = (typeof testimonialsData)[number]['id']

const animationVariants = {
    exit: { opacity: 0, y: 6 },
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0 },
}

export function TestimonialsSection() {
    const [testimonial, setTestimonial] = useState<TestimonialId>('sarah')

    return (
        <section className="@container py-24 md:py-40">
            <div className="mx-auto w-full max-w-5xl px-6">
                <div className="mb-16">
                    <span className="text-primary font-mono text-sm uppercase">Testimonials</span>
                    <h2 className="text-foreground mt-4 text-4xl font-semibold md:text-5xl">Trusted by recruitment agencies worldwide</h2>
                </div>
                <div className="relative">
                    {(() => {
                        const currentTestimonialData = testimonialsData.find((t) => t.id === testimonial)
                        if (!currentTestimonialData) return null
                        const { text, avatar, name, title, resultText, resultText2, id } = currentTestimonialData
                        return (
                            <div className="@2xl:grid-cols-3 grid">
                                <div className="row-span-3 grid grid-rows-subgrid gap-12">
                                    <div className="grid gap-3 self-start pl-px">
                                        <div className="before:border-foreground/25 before:inset-ring-1 before:inset-ring-black/25 relative aspect-square size-20 overflow-hidden rounded-xl shadow-md shadow-black/15 before:absolute before:inset-0 before:rounded-xl before:border before:ring-1">
                                            <img
                                                src={avatar}
                                                alt={`Avatar of ${name}`}
                                                height="460"
                                                width="460"
                                            />
                                        </div>
                                        <div className="space-y-0.5 text-base *:block">
                                            <span className="text-foreground font-medium">{name}</span>
                                            <span className="text-muted-foreground text-sm">{title}</span>
                                        </div>
                                    </div>

                                    <div className="@max-2xl:row-start-1 relative w-fit self-center py-0.5">
                                        <span className="border-foreground/10 mask-x-from-75% absolute -inset-x-12 inset-y-0 border-y"></span>
                                        <div className="flex items-center gap-3 py-1">
                                            {testimonialsData.map((t) => (
                                                <button
                                                    onClick={() => setTestimonial(t.id)}
                                                    key={t.id}
                                                    aria-label={t.name}
                                                    className={cn('relative aspect-square size-8 cursor-pointer overflow-hidden rounded-md shadow-md shadow-black/15 duration-200 ease-out', 'before:border-foreground/25 before:inset-ring-1 before:inset-ring-black/25 before:absolute before:inset-0 before:rounded-md before:border before:ring-1', t.id !== testimonial && 'grayscale-100 scale-98 opacity-50')}>
                                                    <img
                                                        src={t.avatar}
                                                        alt={`Avatar of ${t.name}`}
                                                        height="460"
                                                        width="460"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="@2xl:col-span-2 row-span-3 grid grid-rows-subgrid gap-12">
                                    <AnimatePresence
                                        initial={false}
                                        mode="wait">
                                        <motion.div
                                            key={id}
                                            variants={animationVariants}
                                            exit="exit"
                                            initial="initial"
                                            animate="animate"
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}>
                                            <p className='text-2xl before:mr-1 before:font-serif before:content-["\201C"] after:ml-1 after:font-serif after:content-["\201D"] lg:text-3xl'>{text}</p>
                                        </motion.div>
                                    </AnimatePresence>
                                    <div className="self-center"></div>

                                    <div className="relative">
                                        <PlusDecorator className="-translate-[calc(50%-0.5px)]" />
                                        <PlusDecorator className="right-0 -translate-y-[calc(50%-0.5px)] translate-x-[calc(50%-0.5px)]" />
                                        <PlusDecorator className="bottom-0 right-0 translate-x-[calc(50%-0.5px)] translate-y-[calc(50%-0.5px)]" />
                                        <PlusDecorator className="bottom-0 -translate-x-[calc(50%-0.5px)] translate-y-[calc(50%-0.5px)]" />
                                        <div className="relative grid grid-cols-2 border py-6">
                                            <span className="bg-foreground/10 border-background pointer-events-none absolute inset-y-4 left-1/2 w-0.5 rounded border-r"></span>

                                            <div className="space-y-4 px-6">
                                                <div
                                                    aria-hidden
                                                    className="flex justify-center gap-1">
                                                    <Star className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Star className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Star className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Star className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Star className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                </div>
                                                <TextEffect
                                                    preset="fade"
                                                    per="char"
                                                    delay={0.25}
                                                    speedReveal={5}
                                                    key={id}
                                                    className="text-muted-foreground text-balance text-center text-sm font-medium">
                                                    {resultText}
                                                </TextEffect>
                                            </div>
                                            <div className="space-y-4 px-6">
                                                <div
                                                    aria-hidden
                                                    className="flex justify-center gap-1">
                                                    <Zap className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Zap className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Zap className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Zap className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                    <Zap className="fill-muted-foreground stroke-muted-foreground size-5 drop-shadow" />
                                                </div>
                                                <TextEffect
                                                    preset="fade"
                                                    per="char"
                                                    delay={0.25}
                                                    speedReveal={5}
                                                    key={id}
                                                    className="text-muted-foreground text-balance text-center text-sm font-medium">
                                                    {resultText2}
                                                </TextEffect>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </section>
    )
}

const PlusDecorator = ({ className }: { className?: string }) => (
    <div
        aria-hidden
        className={cn('mask-radial-from-15% z-1 before:bg-foreground/25 after:bg-foreground/25 absolute size-3 before:absolute before:inset-0 before:m-auto before:h-px after:absolute after:inset-0 after:m-auto after:w-px', className)}
    />
)
