'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface FilterComboboxProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
}

export function FilterCombobox({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    className,
}: FilterComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const isSelected = value !== 'all'
    const displayValue = isSelected ? value : placeholder

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-9 justify-between gap-2 border-black/10 bg-white text-sm font-normal hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                        isSelected && 'border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/10',
                        className
                    )}
                >
                    <span className={cn(
                        'truncate',
                        !isSelected && 'text-black/50 dark:text-white/50'
                    )}>
                        {displayValue}
                    </span>
                    {isSelected ? (
                        <X
                            className="size-3.5 shrink-0 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange('all')
                            }}
                        />
                    ) : (
                        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={() => {
                                        onChange(option === value ? 'all' : option)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 size-4',
                                            value === option ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <span className="truncate">{option}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
