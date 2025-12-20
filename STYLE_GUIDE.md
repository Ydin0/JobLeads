# RecLead Style Guide

A Contra-inspired design system with minimal aesthetics, black primary actions, subtle lavender accents for selections, and compact typography.

## Design Philosophy

1. **Minimal**: Clean white backgrounds, subtle borders, no decorative elements
2. **Black & White**: Primary actions use solid black, not colored buttons
3. **Subtle Accents**: Light lavender (`#F8F7FF`) for selected/active states only
4. **Compact**: Tight typography and spacing for information density
5. **Consistent**: Uniform patterns across all pages

## Colors

### Primary Actions - Black
| Context | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Button | `bg-black` | `bg-white` |
| Button Text | `text-white` | `text-black` |
| Button Hover | `hover:bg-black/80` | `hover:bg-white/90` |

### Selected/Active States - Lavender
| Context | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | `#F8F7FF` or `bg-[#F8F7FF]` | `bg-white/10` |
| Text | `text-black` (NOT purple) | `text-white` |
| Tab Underline | `bg-black` | `bg-white` |

### Badge Colors
| Badge | Light Mode | Dark Mode |
|-------|-----------|-----------|
| NEW | `bg-[#EDE9FE] text-[#7C3AED]` | `bg-purple-500/20 text-purple-300` |
| Count (active) | `bg-black text-white` | `bg-white text-black` |
| Count (inactive) | `bg-black/5 text-black/60` | `bg-white/5 text-white/60` |

### Core Palette - Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#ffffff` | Page backgrounds |
| Card | `#ffffff` | Card backgrounds |
| Border | `rgba(0,0,0,0.1)` or `border-black/10` | Borders, dividers |
| Border Light | `rgba(0,0,0,0.05)` or `border-black/5` | Subtle dividers |
| Text Primary | `#000000` or `text-black` | Headings, primary text |
| Text Secondary | `rgba(0,0,0,0.6)` or `text-black/60` | Body text |
| Text Muted | `rgba(0,0,0,0.4)` or `text-black/40` | Placeholder, labels |
| Text Faint | `rgba(0,0,0,0.5)` or `text-black/50` | Descriptions |

### Core Palette - Dark Mode
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0a0f` | Page backgrounds |
| Card | `rgba(255,255,255,0.02)` or `bg-white/[0.02]` | Card backgrounds |
| Border | `rgba(255,255,255,0.1)` or `border-white/10` | Borders, dividers |
| Text Primary | `#ffffff` or `text-white` | Headings, primary text |
| Text Secondary | `rgba(255,255,255,0.6)` or `text-white/60` | Body text |
| Text Muted | `rgba(255,255,255,0.4)` or `text-white/40` | Placeholder, labels |

### Status Colors
| Status | Light Mode | Dark Mode |
|--------|-----------|-----------|
| Success | `text-green-600` | `text-green-400` |
| Error | `text-red-600` | `text-red-400` |
| Warning | `text-amber-600` | `text-amber-400` |

## Typography

### Font Family
- **Primary:** Halenoir (via `--font-halenoir`)
- **Mono:** System monospace

### Font Sizes (Compact)
| Element | Size | Class |
|---------|------|-------|
| Page title | 18px | `text-lg font-semibold` |
| Section label | 10px | `text-[10px] font-semibold uppercase tracking-wider` |
| Nav items | 13px | `text-[13px] font-medium` |
| Body text | 13px-14px | `text-[13px]` or `text-sm` |
| Small text | 12px | `text-xs` |
| Tiny text | 10px | `text-[10px]` |
| Large stats | 30px | `text-3xl font-semibold` |

## Components

### Buttons

```tsx
// Primary button (Black - rounded-full)
<Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
  Action
</Button>

// Secondary/Outline button (rounded-full)
<Button variant="outline" className="h-9 rounded-full border-black/10 px-4 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
  Secondary
</Button>

// Ghost button
<Button variant="ghost" className="text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
  Ghost
</Button>

// Icon button
<Button variant="ghost" size="icon" className="size-8 rounded-full text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
  <Icon className="size-4" />
</Button>
```

### Navigation Section Labels

```tsx
// Section label (Contra-style small caps)
<div className="px-3 py-1.5">
  <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
    SECTION NAME
  </span>
</div>
```

### Navigation Items

```tsx
// Active nav item (Lavender background, BLACK text)
<Link className="flex items-center gap-3 rounded-lg bg-[#F8F7FF] px-3 py-2 text-[13px] font-medium text-black dark:bg-white/10 dark:text-white">
  <Icon className="size-4 text-black dark:text-white" />
  <span>Label</span>
</Link>

// Inactive nav item
<Link className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-black/60 hover:bg-black/[0.02] hover:text-black dark:text-white/60 dark:hover:bg-white/[0.02] dark:hover:text-white">
  <Icon className="size-4 text-black/40 dark:text-white/40" />
  <span>Label</span>
</Link>
```

### Badges

```tsx
// NEW badge (Lavender with purple text)
<span className="ml-auto rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:bg-purple-500/20 dark:text-purple-300">
  NEW
</span>

// Active count badge (Black)
<span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-black">
  24
</span>

// Inactive count badge
<span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/5 dark:text-white/60">
  12
</span>
```

### Tabs

```tsx
// Tab navigation with underline
<div className="flex gap-6 border-b border-black/5 dark:border-white/5">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={cn(
        'relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors',
        activeTab === tab.id
          ? 'text-black dark:text-white'
          : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
      )}
    >
      <tab.icon className="size-4" />
      {tab.label}
      <span className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium',
        activeTab === tab.id
          ? 'bg-black text-white dark:bg-white dark:text-black'
          : 'bg-black/5 text-black/60 dark:bg-white/5 dark:text-white/60'
      )}>
        {tab.count}
      </span>
      {activeTab === tab.id && (
        <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-black dark:bg-white" />
      )}
    </button>
  ))}
</div>
```

### Cards

```tsx
// Standard card
<div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.02]">
  {/* Content */}
</div>

// Interactive card (with hover)
<div className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20">
  {/* Content */}
</div>

// Add new placeholder card (dashed border)
<div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-black/10 bg-black/[0.01] p-6 transition-colors hover:border-black/20 hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.01] dark:hover:border-white/20">
  <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
    <Plus className="size-6 text-black/40 dark:text-white/40" />
  </div>
  <span className="mt-3 text-sm font-medium text-black/60 dark:text-white/60">
    Add new item
  </span>
</div>
```

### Stats Row

```tsx
// Horizontal stats display
<div className="flex items-center gap-8 border-b border-black/5 pb-6 dark:border-white/5">
  <div>
    <div className="text-3xl font-semibold text-black dark:text-white">24</div>
    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Total Items</div>
  </div>
  <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
  <div>
    <div className="text-3xl font-semibold text-black dark:text-white">156</div>
    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Processed</div>
  </div>
  {/* More stats... */}
</div>
```

### Promotional Card (Sidebar)

```tsx
// Minimal upgrade card
<div className="rounded-xl border border-black/5 bg-[#FAFAFA] p-4 dark:border-white/5 dark:bg-white/[0.02]">
  <div className="flex items-center gap-2">
    <Sparkles className="size-4 text-black/40 dark:text-white/40" />
    <span className="text-xs font-medium text-black/60 dark:text-white/60">
      Free Plan
    </span>
  </div>
  <p className="mt-2 text-[13px] font-medium text-black dark:text-white">
    Unlock unlimited leads
  </p>
  <p className="mt-1 text-xs text-black/50 dark:text-white/50">
    Get advanced filters and CRM sync
  </p>
  <button className="mt-3 w-full rounded-full bg-black py-2 text-xs font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
    Upgrade to Pro
  </button>
</div>
```

### Dialogs / Modals

```tsx
// Two-column dialog with decorative side panel
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="gap-0 overflow-hidden border-black/10 bg-white p-0 dark:border-white/10 dark:bg-[#0a0a0f] sm:max-w-2xl">
    <div className="grid md:grid-cols-2">
      {/* Left side - Form */}
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <span className="text-xs font-medium text-black/40 dark:text-white/40">
            Label
          </span>
          <h3 className="mt-1 text-xl font-semibold text-black dark:text-white">
            Dialog Title
          </h3>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Description text here.
          </p>
        </div>
        {/* Form content */}
      </div>

      {/* Right side - Decorative */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#f8f8f8] to-[#f0f0f0] dark:from-[#131318] dark:to-[#0a0a0f] md:block">
        {/* Gradient orbs */}
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-violet-300/40 to-purple-400/30 blur-3xl dark:from-violet-500/20 dark:to-purple-600/10" />
        <div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-400/30 blur-3xl dark:from-rose-500/20 dark:to-pink-600/10" />

        {/* Content card */}
        <div className="relative flex h-full flex-col items-center justify-center p-8">
          <div className="rounded-2xl border border-black/5 bg-white/80 p-5 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            {/* Card content */}
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### Form Inputs with Icons

```tsx
// Input with leading icon
<div className="space-y-1.5">
  <label className="text-xs font-medium text-black/70 dark:text-white/70">
    Field Label
  </label>
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
    <Input
      placeholder="Placeholder"
      className="h-11 rounded-xl border-black/10 bg-black/[0.02] pl-10 text-black placeholder:text-black/40 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40"
    />
  </div>
</div>
```

### Gradient Orbs (Decorative Backgrounds)

```tsx
// Violet/purple orb
<div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-violet-300/40 to-purple-400/30 blur-3xl dark:from-violet-500/20 dark:to-purple-600/10" />

// Rose/pink orb
<div className="absolute -bottom-10 -left-10 size-48 rounded-full bg-gradient-to-br from-rose-300/40 to-pink-400/30 blur-3xl dark:from-rose-500/20 dark:to-pink-600/10" />
```

### Gradient Outline (Credit Pills, Feature Icons)

```tsx
// Gradient outline pattern - outer wrapper with 1px padding
<div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-px dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
  <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 dark:bg-[#0a0a0f]">
    <Icon className="size-3 text-violet-500" />
    <span className="text-xs">Content</span>
  </div>
</div>

// Gradient outline icon (circular)
<div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-px transition-transform duration-300 hover:scale-110 dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
  <div className="flex size-12 items-center justify-center rounded-full bg-[#f8f8f8] dark:bg-[#0a0a0f]">
    <Icon className="size-5 text-black/70 dark:text-white/70" />
  </div>
</div>
```

### Inputs

```tsx
// Text input (minimal)
<input
  type="text"
  placeholder="Search..."
  className="w-full rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-sm text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/20"
/>

// Search input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full rounded-lg border border-black/10 bg-black/[0.02] py-2 pl-9 pr-3 text-sm text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
  />
</div>
```

### Tables

```tsx
// Minimal table
<table className="w-full">
  <thead>
    <tr className="border-b border-black/5 dark:border-white/5">
      <th className="pb-3 text-left text-xs font-medium text-black/40 dark:text-white/40">
        Column
      </th>
    </tr>
  </thead>
  <tbody className="divide-y divide-black/5 dark:divide-white/5">
    <tr className="group">
      <td className="py-3 text-sm text-black dark:text-white">
        Content
      </td>
    </tr>
  </tbody>
</table>
```

## Spacing

| Context | Value | Class |
|---------|-------|-------|
| Page sections | 24px | `space-y-6` |
| Stats gap | 32px | `gap-8` |
| Nav sections | 16px | `space-y-4` |
| Nav items | 2px | `space-y-0.5` |
| Card grid | 16px | `gap-4` |
| Card padding | 16-24px | `p-4` or `p-6` |
| Nav item padding | 8px/12px | `py-2 px-3` |

## Do's and Don'ts

### Do
- Use solid black for primary buttons
- Use subtle lavender (`#F8F7FF`) for selected states with BLACK text
- Use rounded-full for buttons
- Keep borders very subtle (5-10% opacity)
- Use horizontal stats rows for key metrics
- Use black underlines for active tabs
- Keep typography compact (13px for nav items)
- Use dashed borders for "add new" placeholder cards

### Don't
- Use purple/colored buttons for primary actions
- Use purple text for selected sidebar items (use black)
- Use gradient buttons or backgrounds (except gradient outlines)
- Add decorative blur orbs on main pages (only in modals/dialogs)
- Use heavy shadows on cards (except modal decorative panels)
- Use animated notification badges with colored pings
- Use backdrop-blur on main pages (only in modal decorative cards)
- Make typography too large

## Quick Reference

### Common Classes Cheatsheet

```
// Backgrounds
bg-white                    - Cards (light)
bg-white/[0.02]            - Cards (dark)
bg-[#F8F7FF]               - Selected states (light)
bg-white/10                - Selected states (dark)
bg-black/[0.02]            - Input backgrounds (light)
bg-white/5                 - Input backgrounds (dark)
bg-[#FAFAFA]               - Subtle card background (light)
bg-black/[0.01]            - Placeholder cards (light)

// Borders
border-black/10            - Standard borders (light)
border-white/10            - Standard borders (dark)
border-black/5             - Subtle dividers (light)
border-white/5             - Subtle dividers (dark)
border-dashed              - Placeholder card borders

// Text
text-black                 - Primary (light)
text-white                 - Primary (dark)
text-black/60              - Secondary (light)
text-white/60              - Secondary (dark)
text-black/40              - Muted/labels (light)
text-white/40              - Muted/labels (dark)
text-black/50              - Descriptions (light)
text-white/50              - Descriptions (dark)

// Buttons
bg-black text-white        - Primary button (light)
bg-white text-black        - Primary button (dark)
rounded-full               - Button border radius
h-9 px-4                   - Standard button size

// Sizing
h-8                        - Small buttons
h-9                        - Standard buttons
size-4                     - Standard icons
size-5                     - Larger icons

// Typography
text-[10px]                - Section labels, badges
text-[13px]                - Nav items, body
text-xs                    - Small text (12px)
text-sm                    - Body text (14px)
text-lg                    - Page titles
text-3xl                   - Large stats
```

## Page Layout Patterns

### List Page with Stats
```tsx
<div className="space-y-6">
  {/* Header with title and action button */}
  <div className="flex items-center justify-between">
    <h1 className="text-lg font-semibold">Page Title</h1>
    <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white">
      Add New
    </Button>
  </div>

  {/* Stats Row */}
  <div className="flex items-center gap-8 border-b border-black/5 pb-6">
    {/* Stats... */}
  </div>

  {/* Content Grid */}
  <div className="grid grid-cols-3 gap-4">
    {/* Cards... */}
  </div>
</div>
```

### Detail Page with Tabs
```tsx
<div className="space-y-6">
  {/* Back button and header */}
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon" className="size-8 rounded-full">
      <ArrowLeft className="size-4" />
    </Button>
    <h1 className="text-lg font-semibold">Item Name</h1>
    <div className="ml-auto flex items-center gap-2">
      {/* Action buttons */}
    </div>
  </div>

  {/* Stats Row */}
  <div className="flex items-center gap-8 border-b border-black/5 pb-6">
    {/* Stats... */}
  </div>

  {/* Tabs */}
  <div className="flex gap-6 border-b border-black/5">
    {/* Tab buttons with underline */}
  </div>

  {/* Tab Content */}
  <div>
    {/* Content based on active tab */}
  </div>
</div>
```
