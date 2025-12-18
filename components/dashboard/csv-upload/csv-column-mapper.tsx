'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ArrowRight, Check, AlertCircle } from 'lucide-react'
import { CSV_FIELDS, type ColumnMapping } from '@/lib/csv-import'

interface CSVColumnMapperProps {
  headers: string[]
  mapping: ColumnMapping
  onMappingChange: (mapping: ColumnMapping) => void
}

export function CSVColumnMapper({ headers, mapping, onMappingChange }: CSVColumnMapperProps) {
  const companyFields = CSV_FIELDS.filter((f) => f.type === 'company')
  const contactFields = CSV_FIELDS.filter((f) => f.type === 'contact')

  const handleFieldChange = (fieldKey: string, columnIndex: number | null) => {
    onMappingChange({
      ...mapping,
      [fieldKey]: columnIndex,
    })
  }

  // Check which required fields are mapped
  const requiredFieldStatus = useMemo(() => {
    return CSV_FIELDS.filter((f) => f.required).map((f) => ({
      key: f.key,
      label: f.label,
      isMapped: mapping[f.key] !== null && mapping[f.key] !== undefined,
    }))
  }, [mapping])

  const allRequiredMapped = requiredFieldStatus.every((f) => f.isMapped)

  return (
    <div className="space-y-6">
      {/* Required Fields Status */}
      <div
        className={cn(
          'rounded-lg border p-3',
          allRequiredMapped
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-amber-500/20 bg-amber-500/5'
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          {allRequiredMapped ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <AlertCircle className="size-4 text-amber-500" />
          )}
          <span className="text-xs font-medium text-black dark:text-white">Required Fields</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {requiredFieldStatus.map((field) => (
            <span
              key={field.key}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                field.isMapped
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}
            >
              {field.isMapped && <Check className="size-2.5" />}
              {field.label}
            </span>
          ))}
        </div>
      </div>

      {/* Company Fields */}
      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Company Fields
        </h3>
        <div className="space-y-2">
          {companyFields.map((field) => (
            <FieldMapping
              key={field.key}
              field={field}
              headers={headers}
              selectedColumn={mapping[field.key] ?? null}
              onChange={(colIndex) => handleFieldChange(field.key, colIndex)}
            />
          ))}
        </div>
      </div>

      {/* Contact Fields */}
      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Contact Fields
        </h3>
        <div className="space-y-2">
          {contactFields.map((field) => (
            <FieldMapping
              key={field.key}
              field={field}
              headers={headers}
              selectedColumn={mapping[field.key] ?? null}
              onChange={(colIndex) => handleFieldChange(field.key, colIndex)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface FieldMappingProps {
  field: (typeof CSV_FIELDS)[0]
  headers: string[]
  selectedColumn: number | null
  onChange: (columnIndex: number | null) => void
}

function FieldMapping({ field, headers, selectedColumn, onChange }: FieldMappingProps) {
  const isMapped = selectedColumn !== null

  return (
    <div className="flex items-center gap-3">
      {/* System Field */}
      <div
        className={cn(
          'flex min-w-[140px] items-center gap-2 rounded-lg border px-3 py-2',
          isMapped
            ? 'border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 dark:border-purple-500/20 dark:bg-purple-500/5'
            : 'border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]'
        )}
      >
        <span className="text-xs text-black dark:text-white">{field.label}</span>
        {field.required && <span className="text-[10px] text-red-500">*</span>}
      </div>

      {/* Arrow */}
      <ArrowRight className="size-4 shrink-0 text-black/20 dark:text-white/20" />

      {/* CSV Column Selector */}
      <select
        value={selectedColumn ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : parseInt(e.target.value))}
        className={cn(
          'min-w-[180px] flex-1 rounded-lg border bg-transparent px-3 py-2 text-xs outline-none transition-colors',
          isMapped
            ? 'border-[var(--theme-accent)]/20 text-black dark:border-purple-500/20 dark:text-white'
            : 'border-black/10 text-black/60 dark:border-white/10 dark:text-white/60',
          'hover:border-black/20 focus:border-[var(--theme-accent)] dark:hover:border-white/20 dark:focus:border-purple-500'
        )}
      >
        <option value="">-- Select column --</option>
        {headers.map((header, index) => (
          <option key={index} value={index}>
            {header || `Column ${index + 1}`}
          </option>
        ))}
      </select>
    </div>
  )
}
