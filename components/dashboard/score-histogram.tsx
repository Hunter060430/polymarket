'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import type { NormalizedMarket } from '@/lib/types'

interface ScoreHistogramProps {
  markets: NormalizedMarket[]
}

function bucketColor(bucket: number): string {
  if (bucket >= 75) return 'var(--risk-low)'
  if (bucket >= 55) return 'var(--risk-medium)'
  if (bucket >= 38) return 'var(--risk-high)'
  return 'var(--risk-critical)'
}

interface TooltipPayloadItem {
  value: number
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}–{(label ?? 0) + 9}</p>
      <p className="text-muted-foreground mt-0.5">{payload[0].value} market{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function ScoreHistogram({ markets }: ScoreHistogramProps) {
  // Build 10 buckets: 0–9, 10–19, … 90–99
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    bucket: i * 10,
    label: `${i * 10}`,
    count: 0,
  }))

  for (const m of markets) {
    const idx = Math.min(Math.floor(m.score.totalScore / 10), 9)
    buckets[idx].count++
  }

  return (
    <div className="border border-border px-6 pt-5 pb-4">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-xs tracking-[0.12em] uppercase text-muted-foreground">Score Distribution</p>
          <p className="font-heading text-lg font-light text-foreground mt-0.5">
            {markets.length} markets across 10 score bands
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px] text-muted-foreground">
          {[
            { color: 'var(--risk-critical)', label: 'Critical' },
            { color: 'var(--risk-high)',     label: 'High'     },
            { color: 'var(--risk-medium)',   label: 'Medium'   },
            { color: 'var(--risk-low)',      label: 'Low'      },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="size-2 inline-block" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={buckets} barCategoryGap="20%" margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-secondary)', opacity: 0.4 }} />
          {/* minPointSize keeps low-count bands (e.g. the handful of critical-
              risk markets) visible. Without it, a band with ~3 markets next to
              one with ~6000 renders as sub-pixel and disappears. A negative
              value applies the minimum only to non-zero buckets, so truly empty
              bands stay empty. */}
          <Bar dataKey="count" radius={0} minPointSize={-3}>
            {buckets.map((entry) => (
              <Cell key={entry.bucket} fill={bucketColor(entry.bucket)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
        <span>Lower score = higher risk</span>
        <span>Higher score = clearer rules</span>
      </div>
    </div>
  )
}
