import { cn } from '@/lib/utils'

export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="flex size-8 items-center justify-center rounded-lg bg-white">
                <span className="text-sm font-bold text-black">R</span>
            </div>
            <span className="text-xl font-bold text-foreground">RecLead</span>
        </div>
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex size-8 items-center justify-center rounded-lg bg-white', className)}>
            <span className="text-sm font-bold text-black">R</span>
        </div>
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex size-7 items-center justify-center rounded-lg border border-foreground/20', className)}>
            <span className="text-xs font-bold text-foreground">R</span>
        </div>
    )
}
