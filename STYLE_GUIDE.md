# RecLead Style Guide

This document defines the visual and UI standards for RecLead to ensure consistency across the application.

## Theme

**Mode:** Dark only (no light mode toggle)

The application uses a dark, glassy, futuristic aesthetic with a clean, minimal, premium SaaS feel.

## Design Principles

1. **Compact & Dense** - Use smaller fonts and tighter spacing for a data-rich, professional feel
2. **Glassy & Futuristic** - Low opacity backgrounds, blur effects, gradient accents
3. **Subtle Depth** - Use blur orbs and gradient lines to create visual hierarchy
4. **Minimal Chrome** - Let content breathe with subtle borders and backgrounds

## Colors

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0f` | Page backgrounds |
| `--foreground` | `white` | Primary text |
| `border-white/5` | 5% white | Subtle borders |
| `border-white/10` | 10% white | Standard borders |
| `border-white/20` | 20% white | Active/hover borders |
| `bg-white/[0.02]` | 2% white | Card backgrounds |
| `bg-white/[0.04]` | 4% white | Hover backgrounds |
| `bg-white/5` | 5% white | Input backgrounds |
| `bg-white/10` | 10% white | Active states |

### Text Opacity Scale

| Class | Usage |
|-------|-------|
| `text-white` | Primary text, headings, values |
| `text-white/70` | Secondary text, descriptions |
| `text-white/60` | Body text in cards |
| `text-white/40` | Labels, descriptions, muted text |
| `text-white/30` | Meta text, timestamps, placeholders |
| `text-white/20` | Dividers, very subtle text |

### Accent Colors

| Color | Gradient | Usage |
|-------|----------|-------|
| Purple/Blue | `from-purple-500 to-blue-500` | Enrich buttons, primary actions |
| Blue/Cyan | `from-blue-500 to-cyan-500` | Search-related, create actions |
| Green | `text-green-400`, `bg-green-500/10` | Success, new, active states |
| Yellow | `text-yellow-400`, `bg-yellow-500/10` | Warning, paused states |
| Red | `text-red-400`, `bg-red-500/10` | Error, rejected states |
| Purple | `text-purple-400`, `bg-purple-500/10` | Qualified, premium features |

## Typography

### Font Family
- **Sans:** Geist Sans (via `--font-geist-sans`)
- **Mono:** Geist Mono (via `--font-geist-mono`)

### Dashboard Font Sizes (Compact)

| Element | Size | Class |
|---------|------|-------|
| Page title | 20px | `text-xl` |
| Page description | 14px | `text-sm text-white/40` |
| Section title | 14px | `text-sm font-medium` |
| Card title | 14px | `text-sm font-medium` |
| Body text | 12px | `text-xs` |
| Meta text | 10px | `text-[10px]` |
| Tiny labels | 9px | `text-[9px]` |
| Stat values | 24px | `text-2xl font-semibold` |
| Modal stat values | 20px | `text-xl font-bold` |

### Font Weights
- `font-normal` - Body text
- `font-medium` - Labels, card titles, emphasis
- `font-semibold` - Page headings, stat values
- `font-bold` - Logo text, strong emphasis

## Spacing

### Dashboard Spacing (Compact)

| Context | Value | Class |
|---------|-------|-------|
| Page sections | 16px | `space-y-4` |
| Card grid | 12px | `gap-3` |
| Card padding | 12px | `p-3` |
| Card internal | 8px | `space-y-2` |
| Table row padding | 10px | `py-2.5 px-3` |
| Modal padding | 16px | `p-4` |
| Footer padding | 12px | `py-3 px-4` |

## Components

### Glassy Cards

```tsx
// Standard card
<div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  {/* Content */}
</div>

// Card with blur orb
<div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
  <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/5 blur-3xl" />
  <div className="relative">{/* Content */}</div>
</div>
```

### Modals

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

  {/* Modal */}
  <div className="relative flex h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
    {/* Gradient accents */}
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
    <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
    <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

    {/* Header */}
    <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
      <div>
        <h2 className="text-base font-semibold text-white">Modal Title</h2>
        <p className="text-xs text-white/40">Description text</p>
      </div>
      <button className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
        <X className="size-4" />
      </button>
    </div>

    {/* Content */}
    <div className="relative flex-1 overflow-y-auto p-4">
      {/* ... */}
    </div>

    {/* Footer */}
    <div className="relative flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
      {/* ... */}
    </div>
  </div>
</div>
```

### Buttons

```tsx
// Primary button (compact)
<Button size="sm" className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
  Action
</Button>

// Gradient button
<Button size="sm" className="h-7 bg-gradient-to-r from-purple-500 to-blue-500 px-3 text-xs text-white hover:from-purple-600 hover:to-blue-600">
  <Sparkles className="mr-1.5 size-3" />
  Enrich
</Button>

// Ghost button
<Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
  Cancel
</Button>

// Outline button
<Button variant="outline" size="sm" className="h-7 border-white/10 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10">
  Secondary
</Button>
```

### Inputs

```tsx
// Standard input (compact)
<input
  type="text"
  placeholder="Placeholder..."
  className="h-8 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
/>

// Search input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
  <input className="h-8 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm ..." />
</div>

// Select dropdown
<select className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-white/20 focus:outline-none">
  <option className="bg-[#0a0a0f]">Option</option>
</select>
```

### Status Badges

```tsx
// Status badge (compact)
<span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
  <CheckCircle2 className="size-2.5" />
  Active
</span>

// Tag/chip
<span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/40">
  Technology
</span>

// Filter button
<button className={cn(
  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
  isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
)}>
  Filter
</button>
```

### Stats Cards

```tsx
<div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
  <div className="relative flex items-center gap-3">
    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
      <Icon className="size-4 text-white" />
    </div>
    <div>
      <div className="text-2xl font-semibold text-white">47</div>
      <div className="text-sm text-white/40">Stat Name</div>
    </div>
  </div>
</div>
```

### Tables

```tsx
<div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/5 bg-white/[0.02]">
        <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Column</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-white/5">
      <tr className="transition-colors hover:bg-white/[0.03]">
        <td className="px-3 py-2.5 text-xs text-white">Value</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Icons

Use Lucide icons with consistent sizing:

| Context | Size | Class |
|---------|------|-------|
| Inline with text-xs | 12px | `size-3` |
| Inline with text-sm | 14px | `size-3.5` |
| Button icons | 12px | `size-3` |
| Stat card icons | 16px | `size-4` |
| Avatar icons | 16-20px | `size-4` to `size-5` |

```tsx
import { Search, Users, Sparkles, Check } from 'lucide-react'

<Search className="size-3.5 text-white/30" />
<Check className="size-2.5 text-green-400" />
```

## Decorative Elements

### Blur Orbs

```tsx
// Corner blur orb
<div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />

// Centered blur orb
<div className="absolute -left-32 -top-32 size-64 rounded-full bg-blue-500/10 blur-3xl" />
```

### Gradient Lines

```tsx
// Top border accent
<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

// Subtle divider
<div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
```

### Gradient Backgrounds

```tsx
// Card with gradient
<div className="bg-gradient-to-br from-white/[0.05] to-transparent" />

// Accent card
<div className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5" />
```

## Animation

Use subtle, performant animations:
- `transition-colors` for hover states
- `transition-all` for complex state changes
- `duration-200` to `duration-300` for transitions
- Avoid heavy animations for data-dense UIs

## Accessibility

- Maintain sufficient color contrast (WCAG AA minimum)
- Use semantic HTML elements
- Include `aria-label` for icon-only buttons
- Ensure focus states are visible (`focus:ring-1 focus:ring-white/10`)

## File Naming Conventions

- Components: `kebab-case.tsx` (e.g., `pricing-modal.tsx`)
- Pages: `page.tsx` in route folders
- Layouts: `layout.tsx` in route folders

## Import Order

1. React/Next.js imports
2. Third-party libraries
3. Components (`@/components/...`)
4. Utilities (`@/lib/...`)
5. Types

## Quick Reference

### Common Classes Cheatsheet

```
// Backgrounds
bg-white/[0.02]    - Cards, surfaces
bg-white/[0.04]    - Hover states
bg-white/5         - Inputs, elevated
bg-white/10        - Active states
bg-[#0a0a0f]/95    - Modal backgrounds

// Borders
border-white/5     - Subtle borders
border-white/10    - Standard borders
border-white/20    - Active borders

// Text
text-white         - Primary
text-white/40      - Secondary/muted
text-white/30      - Meta/timestamps

// Sizing
h-7                - Compact buttons
h-8                - Standard inputs
h-9                - Form inputs
size-3             - Small icons
size-4             - Standard icons
size-8             - Card icons

// Spacing
p-3                - Card padding
p-4                - Modal sections
py-2.5 px-3        - Table cells
gap-2              - Tight grid
gap-3              - Standard grid
space-y-4          - Section spacing
```
