'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import React from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Pricing', href: '#pricing' },
]

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    React.useEffect(() => {
        const originalOverflow = document.body.style.overflow

        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [isMobileMenuOpen])

    return (
        <header
            role="banner"
            data-state={isMobileMenuOpen ? 'active' : 'inactive'}
            {...(isScrolled && { 'data-scrolled': true })}
            className="fixed inset-x-0 top-0 z-50">
            <div
                className={cn(
                    'absolute inset-x-0 top-0 z-50 h-14 border-b border-border/50 ring-1 ring-transparent transition-all duration-300',
                    'in-data-scrolled:ring-border/50 in-data-scrolled:border-transparent in-data-scrolled:bg-background/75 in-data-scrolled:backdrop-blur',
                    'max-lg:in-data-[state=active]:h-screen max-lg:in-data-[state=active]:bg-background/95 max-lg:in-data-[state=active]:backdrop-blur max-lg:h-14 max-lg:overflow-hidden max-lg:border-b'
                )}>
                <div className="mx-auto max-w-5xl px-6">
                    <div className="relative flex flex-wrap items-center justify-between lg:py-3">
                        <div className="flex items-center justify-between gap-8 max-lg:h-14 max-lg:w-full max-lg:border-b max-lg:border-transparent">
                            <Link
                                href="/"
                                aria-label="home">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label={isMobileMenuOpen == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-3 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-5 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-5 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <nav className="hidden items-center gap-8 lg:flex">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    {link.name}
                                </Link>
                            ))}
                        </nav>

                        {isMobileMenuOpen && (
                            <nav className="w-full py-6 lg:hidden">
                                <div className="flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.name}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-lg text-muted-foreground transition-colors hover:text-foreground">
                                            {link.name}
                                        </Link>
                                    ))}
                                    <div className="mt-4 flex flex-col gap-3">
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm">
                                            <Link href="/sign-in">Sign In</Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm">
                                            <Link href="/sign-up">Get Started</Link>
                                        </Button>
                                    </div>
                                </div>
                            </nav>
                        )}

                        <div className="hidden items-center gap-3 lg:flex">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm">
                                <Link href="/sign-in">Sign In</Link>
                            </Button>
                            <Button
                                asChild
                                size="sm">
                                <Link href="/sign-up">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
