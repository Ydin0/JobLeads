import { ChevronsUpDown, Globe, Languages } from 'lucide-react'

export const LanguagesIllustration = () => (
    <div aria-hidden>
        <div className="relative mx-4">
            <div className="border-foreground/15 absolute -inset-x-6 inset-y-0 border-y border-dashed"></div>
            <div className="border-foreground/15 absolute -inset-y-6 inset-x-0 border-x border-dashed"></div>
            <div className="ring-foreground/75 relative w-full rounded-xl border border-white/25 bg-zinc-700 p-1 shadow-xl shadow-black/35 ring">
                <ul
                    role="list"
                    className="text-sm text-white">
                    {[
                        { flag: '🇨🇩', label: 'Lingala' },
                        { flag: '🇺🇸', label: 'English' },
                        { flag: '🇫🇷', label: 'French' },
                        { flag: '🇨🇳', label: 'Chinese' },
                    ].map((lang, index) => (
                        <li
                            key={index}
                            className="hover:bg-background/10 not-first:opacity-80 active:scale-99 flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-1.5 duration-200 hover:opacity-100">
                            <span className="text-xl">{lang.flag}</span>
                            <span className="font-medium">{lang.label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        <div className="bg-muted border-foreground/5 mx-auto my-4 flex h-8 w-fit items-center gap-2 rounded-md border px-3">
            <Languages className="size-4" />
            <p className="text-muted-foreground text-sm">Lingala</p>
            <ChevronsUpDown className="ml-6 size-3" />
        </div>

        <div className="text-muted-foreground flex items-center justify-center gap-2">
            <Globe className="size-3" />
            <span className="text-xs">More than 100 languages</span>
        </div>
    </div>
)