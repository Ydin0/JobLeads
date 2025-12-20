import { Logo } from '@/components/logo'
import Link from 'next/link'

const links = [
    {
        group: 'Product',
        items: [
            { title: 'Features', href: '#features' },
            { title: 'How It Works', href: '#how-it-works' },
            { title: 'Pricing', href: '/pricing' },
        ],
    },
    {
        group: 'Company',
        items: [
            { title: 'About', href: '#' },
            { title: 'Privacy', href: '#' },
            { title: 'Terms', href: '#' },
        ],
    },
]

export default function FooterSection() {
    return (
        <footer
            role="contentinfo"
            className="border-t border-black/5 bg-white py-12 dark:border-white/5 dark:bg-[#0a0a0f] md:py-16"
        >
            <div className="mx-auto max-w-6xl px-6">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Logo and description */}
                    <div className="space-y-4 md:col-span-2">
                        <Link href="/" aria-label="go home" className="block w-fit">
                            <Logo className="h-6" />
                        </Link>
                        <p className="max-w-xs text-sm text-black/60 dark:text-white/60">
                            Turn job postings into qualified leads. Scrape, enrich, and export to your CRM automatically.
                        </p>
                    </div>

                    {/* Links */}
                    {links.map((link, index) => (
                        <div key={index} className="space-y-3">
                            <span className="block text-sm font-medium text-black dark:text-white">
                                {link.group}
                            </span>
                            <div className="flex flex-col gap-2">
                                {link.items.map((item, itemIndex) => (
                                    <Link
                                        key={itemIndex}
                                        href={item.href}
                                        className="text-sm text-black/60 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 dark:border-white/5 sm:flex-row">
                    <span className="text-sm text-black/40 dark:text-white/40">
                        &copy; {new Date().getFullYear()} RecLead. All rights reserved.
                    </span>

                    <div className="flex items-center gap-4">
                        <Link
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X/Twitter"
                            className="text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                        >
                            <svg
                                className="size-5"
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"
                                />
                            </svg>
                        </Link>
                        <Link
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
                        >
                            <svg
                                className="size-5"
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
