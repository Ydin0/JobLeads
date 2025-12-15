import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CallToAction() {
    return (
        <section className="py-20">
            <div className="relative mx-auto max-w-5xl px-6">
                <div className="relative mx-auto max-w-2xl text-center">
                    <h2 className="text-balance text-4xl font-semibold md:text-5xl">
                        Ready to Find More <span className="bg-linear-to-b from-foreground/50 to-foreground/95 bg-clip-text text-transparent [-webkit-text-stroke:0.5px_var(--color-foreground)]">Clients?</span>
                    </h2>
                    <p className="text-muted-foreground mb-6 mt-4 text-balance">Join recruitment agencies already using RecLead to automate their lead generation. Start with 100 free leads.</p>

                    <Button
                        asChild
                        size="sm">
                        <Link href="#">Get Started Free</Link>
                    </Button>
                    <Button
                        asChild
                        className="bg-foreground/10 ring-foreground/20 hover:bg-foreground/15 ml-3 backdrop-blur"
                        variant="outline"
                        size="sm">
                        <Link href="#">Book a Demo</Link>
                    </Button>
                </div>
            </div>
        </section>
    )
}
