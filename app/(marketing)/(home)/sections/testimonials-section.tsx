import { Card } from '@/components/ui/card'
import { Stripe } from '@/components/ui/svgs/stripe'
import { Hulu } from '@/components/ui/svgs/hulu'
import { PrimeVideo } from '@/components/ui/svgs/primeVideo'
import { TailwindcssWordmark } from '@/components/ui/svgs/tailwindcssWordmark'

import { ADAM_AVATAR, SHADCN_AVATAR, GLODIE_AVATAR } from '@/lib/const'

const testimonialsData = [
    {
        id: 'tailwindcss' as const,
        LogoComponent: TailwindcssWordmark,
        cardLogoProps: { className: 'h-7 w-36' },
        buttonLogoProps: { height: 20, width: 56 },
        text: 'The component library from Tailark has been a game-changer for our development team. We can quickly build consistent interfaces across our payment platform with minimal effort. The documentation is excellent and the customization options are exactly what we needed.',
        avatar: ADAM_AVATAR,
        name: 'Adam Wathan',
        title: 'CEO, Tailwind Labs',
        brandColor: '#635bff',
        resultText: '40% Reduction in integration time for new merchants',
        resultText2: '50% faster onboarding for new clients',
    },

    {
        id: 'prime' as const,
        LogoComponent: PrimeVideo,
        cardLogoProps: { className: 'h-7 w-20' },
        buttonLogoProps: { height: 24, width: 64 },
        text: 'We needed a solution that could handle our complex UI requirements while maintaining performance. Tailark delivered exactly that - their component system integrated seamlessly with our existing architecture and helped us launch new features in record time.',
        avatar: GLODIE_AVATAR,
        name: 'Glodie Lukose',
        title: 'Frontend Engineer',
        brandColor: '#00A8E1',
        resultText: 'Content discovery increased by 35% using our engine',
        resultText2: '20% more time spent on the platform per user',
    },
    {
        id: 'hulu' as const,
        LogoComponent: Hulu,
        cardLogoProps: { className: 'h-7 w-16' },
        buttonLogoProps: { height: 20, width: 44 },
        text: 'Implementing Tailark components helped us create a more engaging streaming interface. The responsive design system works flawlessly across devices, and we were able to maintain our brand identity while leveraging their robust component architecture.',
        avatar: SHADCN_AVATAR,
        name: 'Shadcn',
        title: 'Design Engineer, Vercel',
        brandColor: '#1CE783',
        resultText: '25% Increase in total user engagement',
        resultText2: '30% higher retention rate for subscribers',
    },
    {
        id: 'stripe' as const,
        LogoComponent: Stripe,
        cardLogoProps: { className: 'h-7 w-16' },
        buttonLogoProps: { height: 20, width: 56 },
        text: 'The component library from Tailark has been a game-changer for our development team. We can quickly build consistent interfaces across our payment platform with minimal effort. The documentation is excellent and the customization options are exactly what we needed.',
        avatar: GLODIE_AVATAR,
        name: 'Glodie Lukose',
        title: 'Frontend Engineer',
        brandColor: '#635bff',
        resultText: '40% Reduction in integration time for new merchants',
        resultText2: '50% faster onboarding for new clients',
    },
]

export function TestimonialsSection() {
    return (
        <section className="pb-44 pt-24">
            <div className="mx-auto w-full max-w-5xl px-6">
                <span className="text-primary font-mono text-sm uppercase">Testimonials</span>

                <div className="mt-8 grid items-end gap-6 md:grid-cols-2">
                    <h2 className="text-foreground text-4xl font-semibold md:text-5xl">You&apos;re in good company</h2>
                    <div className="lg:pl-12">
                        <p className="text-muted-foreground text-balance">Join the increasing number of customers and advocates who rely on Tailark for seamless and effective user A/B testing.</p>
                    </div>
                </div>

                <div className="mt-16 grid gap-2 sm:gap-6 md:grid-cols-2 md:grid-rows-5 lg:-mx-8 lg:gap-8">
                    {testimonialsData.map((testimonial) => (
                        <Card
                            key={testimonial.id}
                            className="ring-foreground/10 lg:nth-3:ml-8 md:nth-3:shadow-none md:nth-3:bg-transparent md:nth-2:shadow-none md:nth-2:bg-transparent md:nth-2:col-start-2 md:nth-2:row-start-2 relative space-y-8 rounded-2xl p-10 shadow-lg shadow-black/5 first:col-start-1 first:row-start-1 md:row-span-2"
                            style={{ touchAction: 'none' }}>
                            <div>
                                <testimonial.LogoComponent {...testimonial.cardLogoProps} />
                            </div>
                            <p className='text-lg before:mr-1 before:font-serif before:content-["\201C"] after:ml-1 after:font-serif after:content-["\201D"]'>{testimonial.text}</p>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-3 pl-px">
                                <div className="ring-foreground/10 aspect-square size-12 overflow-hidden rounded-xl border border-transparent shadow-md shadow-black/15 ring-1">
                                    <img
                                        src={testimonial.avatar}
                                        alt={`Avatar of ${testimonial.name}`}
                                    />
                                </div>
                                <div className="space-y-0.5 text-base *:block">
                                    <span className="text-foreground font-medium">{testimonial.name}</span>
                                    <span className="text-muted-foreground text-sm">{testimonial.title}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                    <div
                        aria-hidden
                        className="ring-border-illustration col-start-2 row-start-1 w-2/3 rounded-2xl ring max-md:hidden"
                    />
                    <div
                        aria-hidden
                        className="ring-border-illustration ml-auto h-2/3 w-2/3 rounded-2xl ring max-md:hidden"
                    />
                </div>
            </div>
        </section>
    )
}