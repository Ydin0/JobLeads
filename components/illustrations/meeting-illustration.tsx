import { Card } from '@/components/ui/card'
import { MESCHAC_AVATAR, BERNARD_AVATAR, THEO_AVATAR, GLODIE_AVATAR } from '@/lib/const'

const MainIllustration = () => {
    return (
        <Card
            aria-hidden
            className="relative aspect-video p-4 shadow-xl shadow-black/10">
            <div className="relative hidden h-fit">
                <div className="absolute -left-1.5 bottom-1.5 rounded-md border-t border-red-700 bg-red-500 px-1 py-px text-[10px] font-medium text-white shadow-md shadow-red-500/35">PDF</div>
                <div className="bg-linear-to-b h-10 w-8 rounded-md border from-zinc-100 to-zinc-200"></div>
            </div>
            <div className="mb-0.5 text-sm font-semibold">AI Strategy Meeting</div>
            <div className="mb-4 flex gap-2 text-sm">
                <span className="text-muted-foreground">2:30 - 3:45 PM</span>
            </div>
            <div className="mb-2 flex -space-x-1.5">
                <div className="flex -space-x-1.5">
                    {[
                        { src: MESCHAC_AVATAR, alt: 'Méschac Irung' },
                        { src: BERNARD_AVATAR, alt: 'Bernard Ngandu' },
                        { src: THEO_AVATAR, alt: 'Théo Balick' },
                        { src: GLODIE_AVATAR, alt: 'Glodie Lukose' },
                    ].map((avatar, index) => (
                        <div
                            key={index}
                            className="bg-background size-7 rounded-full border p-0.5 shadow shadow-zinc-950/5">
                            <img
                                className="aspect-square rounded-full object-cover"
                                src={avatar.src}
                                alt={avatar.alt}
                                height="460"
                                width="460"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className="text-muted-foreground text-sm font-medium">ML Pipeline Discussion</div>
        </Card>
    )
}

export const MeetingIllustration = () => {
    return (
        <div
            aria-hidden
            className="mask-radial-from-50% mask-radial-at-center mask-radial-to-[75%_50%] group relative -mx-8 max-md:-mx-6">
            <div className="grid grid-cols-5 items-center gap-2">
                <div className="*:ring-foreground/10 grid h-full grid-rows-[1fr_auto_1fr] space-y-2 *:rounded-xl *:ring-1">
                    <div></div>
                    <div className="bg-card/50 h-36"></div>
                    <div></div>
                </div>
                <div className="col-span-3 grid grid-rows-[1fr_auto_1fr] space-y-2">
                    <div className="bg-card/50 ring-foreground/10 flex rounded-b-xl p-6 ring-1"></div>
                    <div className="relative">
                        <div className="bg-linear-to-r absolute inset-4 from-indigo-900/50 via-emerald-500 to-indigo-500 opacity-40 blur-xl"></div>
                        <MainIllustration />
                    </div>
                    <div className="bg-card/50 ring-foreground/10 rounded-t-xl p-6 ring-1"></div>
                </div>
                <div className="*:ring-foreground/10 grid h-full grid-rows-[1fr_auto_1fr] space-y-2 *:rounded-xl *:ring-1">
                    <div></div>
                    <div className="bg-card/50 h-36"></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}