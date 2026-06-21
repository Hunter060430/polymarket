import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog — Verdict',
  description: 'What has changed in the Verdict prediction market clarity platform.',
}

type Tag = 'New' | 'Improved' | 'Fixed' | 'Data'

interface ChangeEntry {
  date: string        // Display date
  isoDate: string     // For <time> element
  title: string
  body: string
  tags: Tag[]
}

const TAG_STYLES: Record<Tag, string> = {
  New:      'border-[var(--risk-low)]      text-[var(--risk-low)]',
  Improved: 'border-[var(--risk-medium)]   text-[var(--risk-medium)]',
  Fixed:    'border-[var(--risk-high)]     text-[var(--risk-high)]',
  Data:     'border-primary               text-primary',
}

const CHANGELOG: ChangeEntry[] = [
  {
    date: 'June 2025',
    isoDate: '2025-06-01',
    title: 'AI Market Assistant — Ask Verdict',
    tags: ['New'],
    body: 'Launched the Ask AI page, powered by DeepSeek. Load all active markets into a live context window and ask plain-English questions: which markets have the highest dispute risk, which sectors have the clearest rules, or why a specific market scored the way it did. Rate-limited to 5 questions per device per day.',
  },
  {
    date: 'June 2025',
    isoDate: '2025-06-01',
    title: 'Dispute Signal detection for resolved markets',
    tags: ['Fixed', 'Data'],
    body: 'Fixed a field-name bug (umaResolutionStatus vs umaResolutionStatuses) that caused Dispute Signals to display as 0 on the Resolved Markets page. The Gamma API returns the UMA lifecycle as a JSON-stringified array; the parser now correctly parses it and flags any market that contains a "disputed" step. The resolved page now accurately reflects 66 disputed markets (~3% dispute rate).',
  },
  {
    date: 'May 2025',
    isoDate: '2025-05-01',
    title: 'Score histogram Y-axis and range labels',
    tags: ['Fixed', 'Improved'],
    body: 'The dashboard score distribution chart had an inverted Y-axis caused by an invalid negative minPointSize prop. Bars for low-count risk bands (Critical, High) were sub-pixel and invisible. Fixed axis rendering, added proper k-formatted tick labels (6k instead of 6000), correct score-range labels on the X-axis (0–10, 10–20, …), and a minimum bar height so every band is always visible.',
  },
  {
    date: 'May 2025',
    isoDate: '2025-05-01',
    title: 'Resolved Markets page with oracle analytics',
    tags: ['New'],
    body: 'New /markets/resolved page showing the full archive of closed Polymarket markets scored by Verdict. Includes aggregate statistics: markets analysed, dispute signals, dispute rate, and a resolution timeline. The page uses the same clarity scoring system as active markets.',
  },
  {
    date: 'May 2025',
    isoDate: '2025-05-01',
    title: 'Market detail Share to X button',
    tags: ['Improved'],
    body: 'The share controls on every market detail page now include a one-click "Share on X" button. The tweet is pre-filled with the market question, Verdict clarity score, risk level, and a @GetVerdictHQ tag — turning every shared score into organic distribution.',
  },
  {
    date: 'April 2025',
    isoDate: '2025-04-01',
    title: 'Embed widget for market scores',
    tags: ['New'],
    body: 'Every market page now has an Embed button that generates a responsive iframe snippet. Third-party sites and newsletters can embed live Verdict clarity scores without sending users away.',
  },
  {
    date: 'April 2025',
    isoDate: '2025-04-01',
    title: 'Six-dimension scoring breakdown',
    tags: ['New'],
    body: 'Replaced the single composite score with a six-dimension scoring trace: Resolution Clarity, Time Specificity, Oracle Reliability, Data Source Quality, Edge Case Coverage, and Historical Precedent. Each dimension is independently weighted and fully documented in /methodology.',
  },
  {
    date: 'March 2025',
    isoDate: '2025-03-01',
    title: 'Verdict launches in public beta',
    tags: ['New'],
    body: 'Initial public release. Verdict scores every active Polymarket market on rule clarity before any money is at risk. Founded by Hunter Guo (King\'s College London) after personally experiencing a controversial Polymarket settlement. The scoring engine, methodology, and full source are available via the public REST API.',
  },
]

function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-[10px] tracking-[0.14em] uppercase font-medium ${TAG_STYLES[tag]}`}
    >
      {tag}
    </span>
  )
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-16">

        {/* Header */}
        <div className="border-b border-border pb-10 mb-12">
          <p className="text-xs tracking-[0.18em] uppercase text-primary mb-3">What&apos;s New</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-foreground text-balance">
            Changelog
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl text-pretty">
            A running record of meaningful changes to the Verdict platform — new features, data
            fixes, and scoring improvements.
          </p>
        </div>

        {/* Entries */}
        <ol className="relative flex flex-col gap-0" aria-label="Changelog entries">
          {CHANGELOG.map((entry, i) => (
            <li
              key={i}
              className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-6 sm:gap-10 border-b border-border last:border-b-0 py-10 first:pt-0"
            >
              {/* Date column */}
              <div className="pt-0.5">
                <time
                  dateTime={entry.isoDate}
                  className="text-xs tracking-[0.1em] uppercase text-muted-foreground font-medium leading-relaxed"
                >
                  {entry.date}
                </time>
              </div>

              {/* Content column */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {entry.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
                <h2 className="font-heading text-xl font-light text-foreground leading-snug">
                  {entry.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {entry.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

      </main>

      <PageFooter />
    </div>
  )
}
