import { MESCHAC_AVATAR } from '@/lib/const'

export const MessageIllustration = () => (
    <div aria-hidden>
        <div className="flex items-center gap-2">
            <img
                src={MESCHAC_AVATAR}
                className="size-6 rounded-full"
                alt="Méschac    Irung"
                width="460"
                height="460"
                loading="lazy"
            />
            <span className="text-muted-foreground text-sm">Méschac Irung</span>
        </div>

        <div className="bg-linear-to-b from-card ring-foreground/10 inset-ring inset-ring-background/50 ml-4 mt-2 w-fit rounded-b-2xl rounded-br-2xl rounded-tl rounded-tr-2xl to-sky-50 p-3 text-sm text-sky-950 shadow-md shadow-sky-600/10 ring-1">
            Hey <span className="text-foreground font-medium">@bernard</span>, I&apos;ve updated the dashboard metrics.
        </div>
    </div>
)