import { cn } from '@/lib/utils'
import { SHADCN_AVATAR } from '@/lib/const'

type IllustrationProps = {
    className?: string
    variant?: 'elevated' | 'outlined' | 'mixed'
    shortText?: boolean
}

export const AddCommentIllustration = ({ className, variant = 'elevated', shortText = false }: IllustrationProps) => {
    return (
        <div
            aria-hidden
            className={cn('relative self-center', className)}>
            <div className="mb-18 space-y-1.5">
                <div className="flex items-center gap-1">
                    <div className="bg-border h-1 w-1/5 rounded-full"></div>
                    <div className="bg-border h-1 w-2/5 rounded-full"></div>
                </div>
                <div className="flex items-center gap-1">
                    <div className="bg-border h-1 w-1/5 rounded-full"></div>
                    <div className="bg-border h-1 w-4/5 rounded-full"></div>
                </div>
            </div>
            <div className="relative">
                <div
                    data-theme="dark"
                    className={cn('bg-background absolute w-full -translate-x-12 -translate-y-[110%] rounded-xl p-0.5', {
                        'shadow-black-950/10 shadow-lg': variant === 'elevated',
                        'border-foreground/10 border': variant === 'outlined',
                        'ring-foreground/10 shadow-xl shadow-black/30 ring-1': variant === 'mixed',
                    })}>
                    <div className="bg-muted flex h-10 items-center gap-2.5 rounded-lg border px-3">
                        <img
                            className="size-6 rounded-full"
                            src={SHADCN_AVATAR}
                            alt="Shadcn avatar"
                            width={460}
                            height={460}
                        />

                        <span className="text-muted-foreground block pl-px text-sm">Add a comment...</span>
                    </div>
                </div>

                <span>
                    <span className="bg-linear-to-r border-b-2 border-blue-400 from-blue-500 via-sky-500 to-purple-500 bg-clip-text py-1 text-transparent">Tomorrow 8:30 pm</span> is our highest priority.
                </span>
            </div>

            <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                    <div className="bg-border h-1 w-full rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <div className="bg-border h-1 w-2/3 rounded-full"></div>
                        <div className="bg-border h-1 w-1/3 rounded-full"></div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="bg-border h-1 w-4/5 rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <div className="bg-border h-1 w-2/5 rounded-full"></div>
                        <div className="bg-border h-1 w-1/5 rounded-full"></div>
                        <div className="bg-border h-1 w-1/5 rounded-full"></div>
                    </div>
                </div>
                {!shortText && (
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-1">
                            <div className="bg-border h-1 w-2/5 rounded-full"></div>
                            <div className="bg-border h-1 w-1/5 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="bg-border h-1 w-1/5 rounded-full"></div>
                            <div className="bg-border h-1 w-4/5 rounded-full"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}