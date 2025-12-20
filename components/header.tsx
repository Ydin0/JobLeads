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
    { name: 'Pricing', href: '/pricing' },
]

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    React.useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMobileMenuOpen])

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-all duration-200',
                isScrolled
                    ? 'border-b border-black/5 bg-white/80 backdrop-blur-sm dark:border-white/5 dark:bg-[#0a0a0f]/80'
                    : 'bg-transparent'
            )}
        >
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <Logo className="h-6" />
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden items-center gap-8 md:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop CTA */}
                <div className="hidden items-center gap-3 md:flex">
                    <Link href="/sign-in">
                        <Button
                            variant="ghost"
                            className="h-9 rounded-full px-4 text-sm font-medium text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex size-10 items-center justify-center rounded-full text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5 md:hidden"
                    aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                    {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 top-16 z-40 bg-white dark:bg-[#0a0a0f] md:hidden">
                    <nav className="flex flex-col border-t border-black/5 dark:border-white/5">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="border-b border-black/5 px-6 py-4 text-base font-medium text-black dark:border-white/5 dark:text-white"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-3 p-6">
                            <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button
                                    variant="outline"
                                    className="h-11 w-full rounded-full border-black/10 text-sm font-medium dark:border-white/10"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="h-11 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
