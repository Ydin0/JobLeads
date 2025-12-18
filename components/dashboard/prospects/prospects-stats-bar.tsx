'use client'

import { Users, Building2, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProspectStats } from '@/hooks/use-prospects'

interface ProspectsStatsBarProps {
  stats: ProspectStats
  view: 'people' | 'companies'
}

export function ProspectsStatsBar({ stats, view }: ProspectsStatsBarProps) {
  const statItems =
    view === 'people'
      ? [
          {
            label: 'Total People',
            value: stats.total,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Net New (7d)',
            value: stats.netNew,
            icon: Clock,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'With Email',
            value: stats.enriched,
            icon: Sparkles,
            color: 'from-cyan-500 to-blue-500',
          },
          {
            label: 'Already Leads',
            value: stats.leads,
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-500',
          },
        ]
      : [
          {
            label: 'Total Companies',
            value: stats.total,
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
          },
          {
            label: 'Net New (7d)',
            value: stats.netNew,
            icon: Clock,
            color: 'from-purple-500 to-pink-500',
          },
          {
            label: 'Enriched',
            value: stats.enriched,
            icon: Sparkles,
            color: 'from-green-500 to-emerald-500',
          },
        ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] p-3 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]"
        >
          <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                stat.color
              )}
            >
              <stat.icon className="size-4 text-white" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-sm text-black/40 dark:text-white/40">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
