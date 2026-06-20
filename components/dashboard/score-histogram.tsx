'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
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

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} barCategoryGap="18%" margin={{ top: 16, right: 0, left: -10, bottom: 0 }}>
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
            width={36}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-secondary)', opacity: 0.4 }} />
          {/* minPointSize={4} ensures non-zero buckets (e.g. 3 critical markets)
              are always visible even next to a 6000-bar. */}
          <Bar dataKey="count" radius={[2, 2, 0, 0]} minPointSize={4}>
            {buckets.map((entry) => (
              <Cell key={entry.bucket} fill={bucketColor(entry.bucket)} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              formatter={(v: number) => v > 0 ? (v >= 1000 ? `${(v/1000).toFixed(1)}k` : v) : ''}
              style={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
            />
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
