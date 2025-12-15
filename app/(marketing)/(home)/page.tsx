import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'

import { PlatformFeatures } from '@/app/(marketing)/(home)/sections/platform-features'
import { TestimonialsSection } from '@/components/testimonials-section'
import { CallToAction } from '@/components/call-to-action'
import { HeroIllustration } from '@/components/illustrations/hero-illustration'
import { LogoCloud } from '@/components/logo-cloud'
import { MoreFeatures } from '@/app/(marketing)/(home)/sections/more-features'
import { HowItWorks } from '@/app/(marketing)/(home)/sections/how-it-works'
import { StatsSection } from '@/app/(marketing)/(home)/sections/stats-section'

export default function Home() {
    return (
        <>
            <section className="bg-background relative overflow-hidden">
                <div className="mask-b-from-55% dither mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-3/2 absolute inset-0 opacity-15">
                    <Image
                        src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759207511/constellation_uvxuml.webp"
                        alt="gradient background"
                        className="size-full object-cover"
                        width={2342}
                        height={1561}
                        priority
                        fetchPriority="high"
                    />
                </div>
                <div className="mask-b-from-55% mask-b-to-75% mask-radial-from-45% mask-radial-at-bottom mask-radial-[125%_80%] lg:aspect-7/5 absolute inset-0">
                    <Image
                        src="https://res.cloudinary.com/dohqjvu9k/image/upload/v1759207511/constellation_uvxuml.webp"
                        alt="gradient background"
                        className="size-full object-cover"
                        width={2342}
                        height={1561}
                        priority
                        fetchPriority="high"
                    />
                </div>

                <div className="pb-20 pt-24 md:pt-32 lg:pt-48">
                    <div className="relative z-10 mx-auto grid max-w-5xl items-end gap-4 px-6">
                        <div>
                            <h1 className="text-balance text-5xl font-semibold md:max-w-4xl lg:text-6xl">
                                Turn Job Postings Into <span className="bg-linear-to-b from-foreground/50 to-foreground/95 bg-clip-text text-transparent [-webkit-text-stroke:0.5px_var(--color-foreground)]">Warm Leads</span>
                            </h1>
                        </div>
                        <div className="max-w-lg">
                            <p className="text-muted-foreground mb-6 text-balance text-lg lg:text-xl">Scrape jobs from LinkedIn, Indeed, Naukri and more. Enrich with contact data. Push to your CRM. Automatically.</p>
                            <Button
                                asChild
                                size="sm">
                                <Link href="/sign-up">Get Started Free</Link>
                            </Button>
                            <Button
                                asChild
                                className="bg-foreground/10 ring-foreground/20 hover:bg-foreground/15 ml-3 backdrop-blur"
                                variant="outline"
                                size="sm">
                                <Link href="#how-it-works">See How It Works</Link>
                            </Button>
                        </div>
                    </div>
                    <HeroIllustration />
                </div>
            </section>
            <LogoCloud />
            <HowItWorks />
            <PlatformFeatures />
            <MoreFeatures />
            <StatsSection />
            <TestimonialsSection />
            <CallToAction />
        </>
    )
}