import { Sparkle, PenLine, Lightbulb, Search } from 'lucide-react'

export const AiOverviewIllustration = () => (
    <div
        aria-hidden
        className="relative mt-6">
        <div className="z-1 scale-80 absolute -top-6 bottom-0 left-6 right-0 origin-top-right sm:left-[7rem]">
            <div className="bg-card/75 ring-border-illustration flex flex-col rounded-2xl border border-transparent p-4 shadow-2xl shadow-blue-950/25 ring-1 backdrop-blur-lg">
                <div>
                    <div className="animate-hue-rotate relative size-fit">
                        <div className="bg-conic/decreasing relative flex size-5 items-center justify-center rounded-full from-violet-500 via-lime-300 to-violet-400 blur-md"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkle className="size-4 fill-white stroke-white drop-shadow-sm" />
                        </div>
                    </div>
                    <p className="mt-3 text-balance text-sm leading-tight">Hi Irung, how can I help you today?</p>
                </div>

                <div className="my-6 text-sm">
                    <div className="text-muted-foreground text-xs">Suggesttions</div>
                    <div className="-mx-2 mt-2 cursor-pointer">
                        <div className="hover:bg-foreground/5 flex items-center gap-2 rounded-lg px-2 py-1.5">
                            <Search className="size-4" />
                            <span>Ask Anything</span>
                        </div>
                        <div className="hover:bg-foreground/5 flex items-center gap-2 rounded-lg px-2 py-1.5">
                            <PenLine className="size-4" />
                            <span>Write a cover letter</span>
                        </div>
                        <div className="hover:bg-foreground/5 flex items-center gap-2 rounded-lg px-2 py-1.5">
                            <Lightbulb className="size-4" />
                            <span>Explore ideas</span>
                        </div>
                    </div>
                </div>
                <div className="bg-foreground/3 ring-border-illustration mt-auto overflow-hidden rounded-lg shadow shadow-indigo-950/10 ring-1">
                    <div className="text-muted-foreground bg-foreground/3 border-foreground/5 rounded-lg border-b p-3 text-xs">
                        <span>Added corresponding “ghost” stroke lines for both series.</span>
                    </div>

                    <div className="text-muted-foreground px-3 py-2 text-xs">
                        <span>Reply...</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="mask-b-from-50% rounded-xl border">
            <div className="absolute inset-y-0 left-0 w-[8rem] border-r">
                <div className="flex gap-1.5 px-4 pt-4">
                    <div className="bg-foreground/5 border-foreground/5 size-2 rounded-full border"></div>
                    <div className="bg-foreground/5 border-foreground/5 size-2 rounded-full border"></div>
                    <div className="bg-foreground/5 border-foreground/5 size-2 rounded-full border"></div>
                </div>
            </div>
            <div className="ml-auto w-[calc(100%-8rem)]">
                <div className="h-11 border-b"></div>
                <div className="relative h-52">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_6px)] opacity-50"></div>
                </div>
            </div>
        </div>
    </div>
)