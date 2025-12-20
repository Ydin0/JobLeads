'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, MapPin, X } from 'lucide-react'
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

// Global location options organized by region
const locationRegions = [
    {
        region: 'Global',
        locations: ['Remote', 'Worldwide'],
    },
    {
        region: 'North America',
        locations: [
            'United States',
            'San Francisco, CA',
            'New York, NY',
            'Los Angeles, CA',
            'Seattle, WA',
            'Austin, TX',
            'Boston, MA',
            'Chicago, IL',
            'Denver, CO',
            'Miami, FL',
            'Atlanta, GA',
            'Dallas, TX',
            'San Diego, CA',
            'Phoenix, AZ',
            'Portland, OR',
            'Washington, DC',
            'Philadelphia, PA',
            'Minneapolis, MN',
            'Detroit, MI',
            'Salt Lake City, UT',
            'Canada',
            'Toronto, Canada',
            'Vancouver, Canada',
            'Montreal, Canada',
            'Calgary, Canada',
            'Ottawa, Canada',
        ],
    },
    {
        region: 'Europe',
        locations: [
            'United Kingdom',
            'London, UK',
            'Manchester, UK',
            'Edinburgh, UK',
            'Bristol, UK',
            'Cambridge, UK',
            'Germany',
            'Berlin, Germany',
            'Munich, Germany',
            'Frankfurt, Germany',
            'Hamburg, Germany',
            'France',
            'Paris, France',
            'Lyon, France',
            'Netherlands',
            'Amsterdam, Netherlands',
            'Ireland',
            'Dublin, Ireland',
            'Spain',
            'Barcelona, Spain',
            'Madrid, Spain',
            'Switzerland',
            'Zurich, Switzerland',
            'Sweden',
            'Stockholm, Sweden',
            'Denmark',
            'Copenhagen, Denmark',
            'Poland',
            'Warsaw, Poland',
            'Krakow, Poland',
            'Portugal',
            'Lisbon, Portugal',
            'Italy',
            'Milan, Italy',
            'Austria',
            'Vienna, Austria',
            'Belgium',
            'Brussels, Belgium',
            'Finland',
            'Helsinki, Finland',
            'Norway',
            'Oslo, Norway',
            'Czech Republic',
            'Prague, Czech Republic',
        ],
    },
    {
        region: 'Asia Pacific',
        locations: [
            'Australia',
            'Sydney, Australia',
            'Melbourne, Australia',
            'Brisbane, Australia',
            'Singapore',
            'Japan',
            'Tokyo, Japan',
            'India',
            'Bangalore, India',
            'Mumbai, India',
            'Delhi, India',
            'Hyderabad, India',
            'Pune, India',
            'Hong Kong',
            'South Korea',
            'Seoul, South Korea',
            'China',
            'Shanghai, China',
            'Beijing, China',
            'Shenzhen, China',
            'New Zealand',
            'Auckland, New Zealand',
            'Indonesia',
            'Jakarta, Indonesia',
            'Philippines',
            'Manila, Philippines',
            'Vietnam',
            'Ho Chi Minh City, Vietnam',
            'Thailand',
            'Bangkok, Thailand',
            'Malaysia',
            'Kuala Lumpur, Malaysia',
            'Taiwan',
            'Taipei, Taiwan',
        ],
    },
    {
        region: 'Middle East & Africa',
        locations: [
            'United Arab Emirates',
            'Dubai, UAE',
            'Abu Dhabi, UAE',
            'Israel',
            'Tel Aviv, Israel',
            'Saudi Arabia',
            'Riyadh, Saudi Arabia',
            'South Africa',
            'Cape Town, South Africa',
            'Johannesburg, South Africa',
            'Egypt',
            'Cairo, Egypt',
            'Nigeria',
            'Lagos, Nigeria',
            'Kenya',
            'Nairobi, Kenya',
        ],
    },
    {
        region: 'Latin America',
        locations: [
            'Brazil',
            'São Paulo, Brazil',
            'Rio de Janeiro, Brazil',
            'Mexico',
            'Mexico City, Mexico',
            'Guadalajara, Mexico',
            'Argentina',
            'Buenos Aires, Argentina',
            'Colombia',
            'Bogotá, Colombia',
            'Medellín, Colombia',
            'Chile',
            'Santiago, Chile',
            'Peru',
            'Lima, Peru',
            'Costa Rica',
            'San José, Costa Rica',
        ],
    },
]

interface LocationComboboxProps {
    selectedLocations: string[]
    onLocationsChange: (locations: string[]) => void
    placeholder?: string
    className?: string
}

export function LocationCombobox({
    selectedLocations,
    onLocationsChange,
    placeholder = 'Select locations...',
    className,
}: LocationComboboxProps) {
    const [open, setOpen] = React.useState(false)

    const toggleLocation = (location: string) => {
        if (selectedLocations.includes(location)) {
            onLocationsChange(selectedLocations.filter((l) => l !== location))
        } else {
            onLocationsChange([...selectedLocations, location])
        }
    }

    const removeLocation = (location: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onLocationsChange(selectedLocations.filter((l) => l !== location))
    }

    return (
        <div className={cn('space-y-2', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-auto min-h-[42px] w-full justify-between border border-black/10 bg-white px-3 py-2 text-left font-normal ring-0 shadow-none hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/5"
                    >
                        <div className="flex flex-1 flex-wrap gap-1">
                            {selectedLocations.length === 0 ? (
                                <span className="text-sm text-black/40 dark:text-white/40">
                                    {placeholder}
                                </span>
                            ) : (
                                selectedLocations.slice(0, 3).map((location) => (
                                    <span
                                        key={location}
                                        className="inline-flex items-center gap-1 rounded-full bg-[#F8F7FF] px-2 py-0.5 text-[10px] font-medium text-black dark:bg-white/10 dark:text-white"
                                    >
                                        <MapPin className="size-2.5" />
                                        {location}
                                        <button
                                            onClick={(e) => removeLocation(location, e)}
                                            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/20"
                                        >
                                            <X className="size-2.5" />
                                        </button>
                                    </span>
                                ))
                            )}
                            {selectedLocations.length > 3 && (
                                <span className="inline-flex items-center rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                    +{selectedLocations.length - 3} more
                                </span>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-black/30 dark:text-white/30" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search locations..." className="h-9" />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty>No location found.</CommandEmpty>
                            {locationRegions.map((region) => (
                                <CommandGroup key={region.region} heading={region.region}>
                                    {region.locations.map((location) => {
                                        const isSelected = selectedLocations.includes(location)
                                        return (
                                            <CommandItem
                                                key={location}
                                                value={location}
                                                onSelect={() => toggleLocation(location)}
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
                                                <MapPin className="mr-2 size-3.5 text-black/40 dark:text-white/40" />
                                                {location}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected locations chips (full list below dropdown) */}
            {selectedLocations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedLocations.map((location) => (
                        <span
                            key={location}
                            className="inline-flex items-center gap-1 rounded-full bg-[#F8F7FF] px-2 py-1 text-[10px] font-medium text-black dark:bg-white/10 dark:text-white"
                        >
                            <MapPin className="size-2.5" />
                            {location}
                            <button
                                onClick={(e) => removeLocation(location, e)}
                                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/20"
                            >
                                <X className="size-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// Single-select location combobox for compact use cases
interface SingleLocationComboboxProps {
    value: string
    onChange: (location: string) => void
    placeholder?: string
    className?: string
}

export function SingleLocationCombobox({
    value,
    onChange,
    placeholder = 'Select location...',
    className,
}: SingleLocationComboboxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'h-[30px] w-full justify-between border border-black/10 bg-white px-2.5 text-left text-[11px] font-normal ring-0 shadow-none hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/5',
                        className
                    )}
                >
                    <span className={cn(
                        'truncate',
                        value ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30'
                    )}>
                        {value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-1 size-3 shrink-0 text-black/30 dark:text-white/30" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search locations..." className="h-8 text-xs" />
                    <CommandList className="max-h-[250px]">
                        <CommandEmpty>No location found.</CommandEmpty>
                        {locationRegions.map((region) => (
                            <CommandGroup key={region.region} heading={region.region}>
                                {region.locations.map((location) => {
                                    const isSelected = value === location
                                    return (
                                        <CommandItem
                                            key={location}
                                            value={location}
                                            onSelect={() => {
                                                onChange(location)
                                                setOpen(false)
                                            }}
                                            className="cursor-pointer text-xs"
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 size-3',
                                                    isSelected ? 'opacity-100' : 'opacity-0'
                                                )}
                                            />
                                            <MapPin className="mr-1.5 size-3 text-black/40 dark:text-white/40" />
                                            {location}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// Export the location data for use elsewhere
export { locationRegions }
export const allLocations = locationRegions.flatMap((r) => r.locations)
