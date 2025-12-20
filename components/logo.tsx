import { cn } from '@/lib/utils'
import Image from 'next/image'

export const Logo = ({ className }: { className?: string }) => {
    return (
        <>
            <Image
                src="/LogoLight.svg"
                alt="RecLead"
                width={120}
                height={32}
                className={cn('h-8 w-auto dark:hidden', className)}
            />
            <Image
                src="/LogoDark.svg"
                alt="RecLead"
                width={120}
                height={32}
                className={cn('hidden h-8 w-auto dark:block', className)}
            />
        </>
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <>
            <Image
                src="/LogoLight.svg"
                alt="RecLead"
                width={32}
                height={32}
                className={cn('size-8 dark:hidden', className)}
            />
            <Image
                src="/LogoDark.svg"
                alt="RecLead"
                width={32}
                height={32}
                className={cn('hidden size-8 dark:block', className)}
            />
        </>
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return (
        <>
            <Image
                src="/LogoLight.svg"
                alt="RecLead"
                width={28}
                height={28}
                className={cn('size-7 dark:hidden', className)}
            />
            <Image
                src="/LogoDark.svg"
                alt="RecLead"
                width={28}
                height={28}
                className={cn('hidden size-7 dark:block', className)}
            />
        </>
    )
}
