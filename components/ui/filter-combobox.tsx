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

interface MultiSelectFilterProps {
    options: string[]
    selectedValues: string[]
    onChange: (values: string[]) => void
    placeholder: string
    searchPlaceholder?: string
    emptyText?: string
    className?: string
}

export function MultiSelectFilter({
    options,
    selectedValues,
    onChange,
    placeholder,
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    className,
}: MultiSelectFilterProps) {
    const [open, setOpen] = React.useState(false)

    const toggleValue = (value: string) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((v) => v !== value))
        } else {
            onChange([...selectedValues, value])
        }
    }

    const removeValue = (value: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(selectedValues.filter((v) => v !== value))
    }

    const clearAll = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange([])
    }

    const hasSelection = selectedValues.length > 0

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-9 justify-between gap-2 border-black/10 bg-white text-sm font-normal hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10',
                        hasSelection && 'border-black/20 bg-black/5 dark:border-white/20 dark:bg-white/10',
                        className
                    )}
                >
                    <span className={cn(
                        'truncate',
                        !hasSelection && 'text-black/50 dark:text-white/50'
                    )}>
                        {hasSelection
                            ? `${selectedValues.length} selected`
                            : placeholder
                        }
                    </span>
                    {hasSelection ? (
                        <X
                            className="size-3.5 shrink-0 opacity-50 hover:opacity-100"
                            onClick={clearAll}
                        />
                    ) : (
                        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option)
                                return (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={() => toggleValue(option)}
                                        className="cursor-pointer"
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex size-4 items-center justify-center rounded border',
                                                isSelected
                                                    ? 'border-black bg-black dark:border-white dark:bg-white'
                                                    : 'border-black/20 dark:border-white/20'
                                            )}
                                        >
                                            {isSelected && (
                                                <Check className="size-3 text-white dark:text-black" />
                                            )}
                                        </div>
                                        <span className="truncate">{option}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
