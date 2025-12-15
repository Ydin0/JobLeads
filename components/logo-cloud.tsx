'use client'

const jobBoards = [
    { name: 'LinkedIn', abbr: 'in' },
    { name: 'Indeed', abbr: 'I' },
    { name: 'Naukri', abbr: 'N' },
    { name: 'Glassdoor', abbr: 'G' },
    { name: 'Monster', abbr: 'M' },
    { name: 'ZipRecruiter', abbr: 'Z' },
]

export function LogoCloud() {
    return (
        <section className="bg-background pb-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto mb-12 max-w-xl text-balance text-center md:mb-16">
                    <p className="text-muted-foreground text-lg">
                        Scrape job postings from <span className="text-foreground">20+ job boards</span> including
                    </p>
                </div>
                <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 md:gap-12">
                    {jobBoards.map((board) => (
                        <div
                            key={board.name}
                            className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-300">
                            <span className="flex size-8 items-center justify-center rounded border border-zinc-700 text-sm font-bold">
                                {board.abbr}
                            </span>
                            <span className="text-lg font-medium">{board.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
