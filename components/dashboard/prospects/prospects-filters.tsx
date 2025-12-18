'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronDown,
  X,
  Search,
  Building2,
  Briefcase,
  MapPin,
  Users,
  GraduationCap,
  Check,
} from 'lucide-react'
import type { ProspectFilters } from '@/hooks/use-prospects'

interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterOptions {
  jobTitles: string[]
  seniorities: string[]
  departments: string[]
  industries: string[]
  sizes: string[]
  companies: { id: string; name: string }[]
}

interface ProspectsFiltersProps {
  view: 'people' | 'companies'
  filters: ProspectFilters
  onChange: (filters: ProspectFilters) => void
  options: FilterOptions
}

const seniorityLabels: Record<string, string> = {
  owner: 'Owner',
  founder: 'Founder',
  c_suite: 'C-Suite',
  partner: 'Partner',
  vp: 'VP',
  head: 'Head',
  director: 'Director',
  manager: 'Manager',
  senior: 'Senior',
  entry: 'Entry Level',
}

const departmentLabels: Record<string, string> = {
  engineering: 'Engineering',
  sales: 'Sales',
  marketing: 'Marketing',
  hr: 'Human Resources',
  finance: 'Finance',
  operations: 'Operations',
  design: 'Design',
  product: 'Product',
  customer_success: 'Customer Success',
  legal: 'Legal',
  other: 'Other',
}

export function ProspectsFilters({
  view,
  filters,
  onChange,
  options,
}: ProspectsFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['seniority', 'department'])
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const toggleArrayFilter = (
    key: keyof ProspectFilters,
    value: string
  ) => {
    const current = (filters[key] as string[]) || []
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: updated.length > 0 ? updated : undefined })
  }

  const setBooleanFilter = (
    key: keyof ProspectFilters,
    value: boolean | undefined
  ) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-col">
        {/* People-specific filters */}
        {view === 'people' && (
          <>
            {/* Job Title Filter */}
            <FilterSection
              title="Job Title"
              icon={<Briefcase className="size-3.5" />}
              isExpanded={expandedSections.includes('jobTitle')}
              onToggle={() => toggleSection('jobTitle')}
              activeCount={filters.jobTitles?.length}
            >
              <SearchableCheckboxList
                options={options.jobTitles.map((t) => ({ value: t, label: t }))}
                selected={filters.jobTitles || []}
                onToggle={(value) => toggleArrayFilter('jobTitles', value)}
                searchPlaceholder="Search titles..."
                searchTerm={searchTerms.jobTitle || ''}
                onSearchChange={(term) => setSearchTerms({ ...searchTerms, jobTitle: term })}
              />
            </FilterSection>

            {/* Seniority Filter */}
            <FilterSection
              title="Seniority"
              icon={<GraduationCap className="size-3.5" />}
              isExpanded={expandedSections.includes('seniority')}
              onToggle={() => toggleSection('seniority')}
              activeCount={filters.seniorities?.length}
            >
              <CheckboxList
                options={options.seniorities.map((s) => ({
                  value: s,
                  label: seniorityLabels[s] || s,
                }))}
                selected={filters.seniorities || []}
                onToggle={(value) => toggleArrayFilter('seniorities', value)}
              />
            </FilterSection>

            {/* Department Filter */}
            <FilterSection
              title="Department"
              icon={<Users className="size-3.5" />}
              isExpanded={expandedSections.includes('department')}
              onToggle={() => toggleSection('department')}
              activeCount={filters.departments?.length}
            >
              <CheckboxList
                options={options.departments.map((d) => ({
                  value: d,
                  label: departmentLabels[d] || d,
                }))}
                selected={filters.departments || []}
                onToggle={(value) => toggleArrayFilter('departments', value)}
              />
            </FilterSection>

            {/* Company Filter */}
            <FilterSection
              title="Company"
              icon={<Building2 className="size-3.5" />}
              isExpanded={expandedSections.includes('company')}
              onToggle={() => toggleSection('company')}
              activeCount={filters.companyIds?.length}
            >
              <SearchableCheckboxList
                options={options.companies.map((c) => ({ value: c.id, label: c.name }))}
                selected={filters.companyIds || []}
                onToggle={(value) => toggleArrayFilter('companyIds', value)}
                searchPlaceholder="Search companies..."
                searchTerm={searchTerms.company || ''}
                onSearchChange={(term) => setSearchTerms({ ...searchTerms, company: term })}
              />
            </FilterSection>

            {/* Lead Status Filter */}
            <FilterSection
              title="Lead Status"
              icon={<Check className="size-3.5" />}
              isExpanded={expandedSections.includes('leadStatus')}
              onToggle={() => toggleSection('leadStatus')}
              activeCount={filters.isShortlisted !== undefined ? 1 : 0}
            >
              <RadioList
                options={[
                  { value: 'all', label: 'All People' },
                  { value: 'available', label: 'Available' },
                  { value: 'leads', label: 'Already Leads' },
                ]}
                selected={
                  filters.isShortlisted === undefined
                    ? 'all'
                    : filters.isShortlisted
                      ? 'leads'
                      : 'available'
                }
                onChange={(value) => {
                  if (value === 'all') setBooleanFilter('isShortlisted', undefined)
                  else if (value === 'available') setBooleanFilter('isShortlisted', false)
                  else setBooleanFilter('isShortlisted', true)
                }}
              />
            </FilterSection>
          </>
        )}

        {/* Companies-specific filters */}
        {view === 'companies' && (
          <>
            {/* Industry Filter */}
            <FilterSection
              title="Industry"
              icon={<Building2 className="size-3.5" />}
              isExpanded={expandedSections.includes('industry')}
              onToggle={() => toggleSection('industry')}
              activeCount={filters.industries?.length}
            >
              <SearchableCheckboxList
                options={options.industries.map((i) => ({ value: i, label: i }))}
                selected={filters.industries || []}
                onToggle={(value) => toggleArrayFilter('industries', value)}
                searchPlaceholder="Search industries..."
                searchTerm={searchTerms.industry || ''}
                onSearchChange={(term) => setSearchTerms({ ...searchTerms, industry: term })}
              />
            </FilterSection>

            {/* Company Size Filter */}
            <FilterSection
              title="Company Size"
              icon={<Users className="size-3.5" />}
              isExpanded={expandedSections.includes('size')}
              onToggle={() => toggleSection('size')}
              activeCount={filters.sizes?.length}
            >
              <CheckboxList
                options={options.sizes.map((s) => ({ value: s, label: `${s} employees` }))}
                selected={filters.sizes || []}
                onToggle={(value) => toggleArrayFilter('sizes', value)}
              />
            </FilterSection>

            {/* Enrichment Status Filter */}
            <FilterSection
              title="Enrichment Status"
              icon={<Check className="size-3.5" />}
              isExpanded={expandedSections.includes('enriched')}
              onToggle={() => toggleSection('enriched')}
              activeCount={filters.isEnriched !== undefined ? 1 : 0}
            >
              <RadioList
                options={[
                  { value: 'all', label: 'All Companies' },
                  { value: 'enriched', label: 'Enriched' },
                  { value: 'not_enriched', label: 'Not Enriched' },
                ]}
                selected={
                  filters.isEnriched === undefined
                    ? 'all'
                    : filters.isEnriched
                      ? 'enriched'
                      : 'not_enriched'
                }
                onChange={(value) => {
                  if (value === 'all') setBooleanFilter('isEnriched', undefined)
                  else if (value === 'enriched') setBooleanFilter('isEnriched', true)
                  else setBooleanFilter('isEnriched', false)
                }}
              />
            </FilterSection>

            {/* Has Contacts Filter */}
            <FilterSection
              title="Has Contacts"
              icon={<Users className="size-3.5" />}
              isExpanded={expandedSections.includes('hasContacts')}
              onToggle={() => toggleSection('hasContacts')}
              activeCount={filters.hasContacts ? 1 : 0}
            >
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2">
                <input
                  type="checkbox"
                  checked={filters.hasContacts || false}
                  onChange={(e) => setBooleanFilter('hasContacts', e.target.checked || undefined)}
                  className="size-4 rounded border-black/20 text-purple-500 focus:ring-purple-500 dark:border-white/20"
                />
                <span className="text-xs text-black/70 dark:text-white/70">
                  Only show companies with contacts
                </span>
              </label>
            </FilterSection>
          </>
        )}

        {/* Location Filter (both views) */}
        <FilterSection
          title="Location"
          icon={<MapPin className="size-3.5" />}
          isExpanded={expandedSections.includes('location')}
          onToggle={() => toggleSection('location')}
          activeCount={filters.locations?.length}
        >
          <div className="px-3 pb-2">
            <input
              type="text"
              placeholder="Enter location..."
              value={searchTerms.locationInput || ''}
              onChange={(e) => setSearchTerms({ ...searchTerms, locationInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerms.locationInput?.trim()) {
                  const newLocation = searchTerms.locationInput.trim()
                  if (!filters.locations?.includes(newLocation)) {
                    onChange({
                      ...filters,
                      locations: [...(filters.locations || []), newLocation],
                    })
                  }
                  setSearchTerms({ ...searchTerms, locationInput: '' })
                }
              }}
              className="w-full rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs text-black placeholder:text-black/40 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
            />
            {filters.locations && filters.locations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {filters.locations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300"
                  >
                    {loc}
                    <button
                      onClick={() => toggleArrayFilter('locations', loc)}
                      className="hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </FilterSection>
    </div>
  )
}

// Filter Section Component
function FilterSection({
  title,
  icon,
  isExpanded,
  onToggle,
  activeCount,
  children,
}: {
  title: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  activeCount?: number
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-black/5 dark:border-white/5">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-2">
          <span className="text-black/40 dark:text-white/40">{icon}</span>
          <span className="text-xs font-medium text-black/70 dark:text-white/70">{title}</span>
          {activeCount !== undefined && activeCount > 0 && (
            <span className="rounded-full bg-purple-500 px-1.5 py-0.5 text-[9px] font-medium text-white">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-black/40 transition-transform dark:text-white/40',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      {isExpanded && <div className="pb-2">{children}</div>}
    </div>
  )
}

// Checkbox List Component
function CheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="max-h-48 space-y-0.5 overflow-y-auto px-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="size-3.5 rounded border-black/20 text-purple-500 focus:ring-purple-500 dark:border-white/20"
          />
          <span className="flex-1 truncate text-xs text-black/70 dark:text-white/70">
            {option.label}
          </span>
          {option.count !== undefined && (
            <span className="text-[10px] text-black/40 dark:text-white/40">{option.count}</span>
          )}
        </label>
      ))}
    </div>
  )
}

// Searchable Checkbox List Component
function SearchableCheckboxList({
  options,
  selected,
  onToggle,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
}: {
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  searchPlaceholder: string
  searchTerm: string
  onSearchChange: (term: string) => void
}) {
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="px-3">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-black/40 dark:text-white/40" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-black/10 bg-white py-1.5 pl-8 pr-3 text-xs text-black placeholder:text-black/40 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
        />
      </div>
      <div className="max-h-40 space-y-0.5 overflow-y-auto">
        {filteredOptions.slice(0, 20).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="size-3.5 rounded border-black/20 text-purple-500 focus:ring-purple-500 dark:border-white/20"
            />
            <span className="flex-1 truncate text-xs text-black/70 dark:text-white/70">
              {option.label}
            </span>
          </label>
        ))}
        {filteredOptions.length === 0 && (
          <p className="py-2 text-center text-xs text-black/40 dark:text-white/40">
            No results found
          </p>
        )}
        {filteredOptions.length > 20 && (
          <p className="py-1 text-center text-[10px] text-black/40 dark:text-white/40">
            +{filteredOptions.length - 20} more results
          </p>
        )}
      </div>
    </div>
  )
}

// Radio List Component
function RadioList({
  options,
  selected,
  onChange,
}: {
  options: FilterOption[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-0.5 px-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
        >
          <input
            type="radio"
            name="radio-filter"
            checked={selected === option.value}
            onChange={() => onChange(option.value)}
            className="size-3.5 border-black/20 text-purple-500 focus:ring-purple-500 dark:border-white/20"
          />
          <span className="text-xs text-black/70 dark:text-white/70">{option.label}</span>
        </label>
      ))}
    </div>
  )
}
