import { cn } from '@/lib/utils'
import Image from 'next/image'

export const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Image
                src="/Group.svg"
                alt="RecLead"
                width={32}
                height={32}
                className="size-8"
            />
            <span className="text-xl font-bold text-foreground">RecLead</span>
        </div>
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="/Group.svg"
            alt="RecLead"
            width={32}
            height={32}
            className={cn('size-8', className)}
        />
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return (
        <Image
            src="/Group.svg"
            alt="RecLead"
            width={28}
            height={28}
            className={cn('size-7', className)}
        />
    )
}
