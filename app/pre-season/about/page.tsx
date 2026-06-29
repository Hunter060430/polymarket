import { Nav, PageFooter } from '@/components/nav'
import type { Metadata } from 'next'
import Link from 'next/link'
import { TASKS, GENESIS_BADGES } from '@/lib/pre-season'

export const metadata: Metadata = {
  title: 'Pre-Season — How It Works | Verdict',
  description:
    'Everything you need to know about the Verdict Pre-Season: tasks, Genesis badges, points, and important disclaimers about future rewards.',
}

const TASK_CATEGORIES = [
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'analysis',   label: 'Analysis'   },
  { key: 'community',  label: 'Community'  },
  { key: 'streak',     label: 'Streak'     },
] as const

export default function PreSeasonAboutPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-10" aria-label="Breadcrumb">
          <Link href="/pre-season" className="hover:text-foreground transition-colors">Pre-Season</Link>
          <span>/</span>
          <span className="text-foreground">How It Works</span>
        </nav>

        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary font-medium mb-5 tracking-[0.08em]">
            PRE-SEASON DOCUMENTATION
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-balance mb-4">
            How Pre-Season Works
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            The Verdict Pre-Season is an early-access participation window running until{' '}
            <strong className="text-foreground">September 1, 2026</strong>. It exists to reward
            users who help build and validate the platform before Season 1 officially launches.
          </p>
        </div>

        {/* Important disclaimer — top placement */}
        <section className="border border-amber-500/40 bg-amber-500/5 p-6 mb-12">
          <h2 className="text-sm font-semibold text-amber-500 tracking-[0.08em] uppercase mb-3">
            Important Disclaimer
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Pre-Season points and Genesis badges are not financial instruments.</strong>{' '}
              They carry no monetary value and confer no legal rights or claims against Verdict or
              its operators.
            </p>
            <p>
              Verdict <strong className="text-foreground">does not guarantee</strong> that Pre-Season
              points or Genesis badges will ever be convertible to tokens, cryptocurrency, equity,
              cash, or any other form of value. Any future utility is entirely at the discretion
              of the Verdict team and subject to change or cancellation without notice.
            </p>
            <p>
              We may explore future reward structures — including but not limited to platform
              credits, fee discounts, or governance participation — but <strong className="text-foreground">
              no promise or commitment is made here or elsewhere</strong>. Do not participate in the
              Pre-Season with any expectation of financial return.
            </p>
            <p>
              Genesis badges are cosmetic recognition of early participation. Supply limits exist
              to preserve their significance, not to create scarcity value.
            </p>
          </div>
        </section>

        {/* Section 1 — What is Pre-Season */}
        <Section num="01" title="What Is Pre-Season?">
          <p>
            Pre-Season is a structured early-access period for Verdict. During this window, registered
            users can earn <strong className="text-foreground">Verdict Points</strong> by interacting
            with the platform — voting on market risk, posting analysis, using AI tools, and building
            their watchlist.
          </p>
          <p>
            At the end of Pre-Season, a snapshot of all points and completed tasks is taken. This
            snapshot determines Genesis badge eligibility and will inform how Verdict designs Season 1
            incentive structures.
          </p>
          <p>
            Pre-Season is also a feedback mechanism. Your activity — which markets you vote on, which
            you comment on, where you run AI analysis — helps the team understand what the community
            cares about most.
          </p>
        </Section>

        {/* Section 2 — How to earn points */}
        <Section num="02" title="Earning Points">
          <p>
            Points are awarded automatically when you complete predefined tasks. Each task can only
            be completed once (unless marked as repeatable). Points are added to your total immediately
            after the qualifying action is confirmed server-side.
          </p>

          {TASK_CATEGORIES.map(cat => {
            const tasks = TASKS.filter(t => t.category === cat.key)
            if (tasks.length === 0) return null
            return (
              <div key={cat.key} className="mt-6">
                <h3 className="text-xs tracking-[0.1em] uppercase text-muted-foreground mb-3">
                  {cat.label}
                </h3>
                <div className="border border-border divide-y divide-border">
                  {tasks.map(task => (
                    <div key={task.key} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{task.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                      </div>
                      <span className="text-sm font-semibold text-primary tabular-nums shrink-0">
                        +{task.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <p className="text-sm text-muted-foreground">
            Total possible points:{' '}
            <strong className="text-foreground">
              {TASKS.reduce((s, t) => s + t.points, 0).toLocaleString()} pts
            </strong>
          </p>
        </Section>

        {/* Section 3 — Genesis Badges */}
        <Section num="03" title="Genesis Badges">
          <p>
            Genesis badges are permanent on-platform recognition markers for early Verdict users.
            Each badge has a fixed supply cap — once all slots are filled, no further claims are
            possible. Badge eligibility is assessed at the end of Pre-Season using the final
            points snapshot.
          </p>
          <p>
            Eligibility does not guarantee a badge. If the number of eligible users exceeds the
            supply cap, allocation priority is determined by registration date (earliest first)
            and then by total points (highest first).
          </p>

          <div className="border border-border divide-y divide-border mt-6">
            {GENESIS_BADGES.map(badge => (
              <div key={badge.key} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-semibold text-foreground">{badge.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Supply: {badge.supply === 1 ? '1 (unique)' : badge.supply.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                {badge.pointsRequired > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum points required:{' '}
                    <span className="text-foreground font-medium">{badge.pointsRequired.toLocaleString()} pts</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Section 4 — Leaderboard */}
        <Section num="04" title="Leaderboard">
          <p>
            The leaderboard ranks all Pre-Season participants by total points in real time. It is
            updated immediately after each point award. The leaderboard resets to zero when Season 1
            begins — Pre-Season points do not carry over.
          </p>
          <p>
            Rank is used to determine eligibility for supply-limited badges (Oracle Elite, The
            Architect). Your rank at the <strong className="text-foreground">final snapshot
            moment</strong> is what counts, not your rank at any earlier point during Pre-Season.
          </p>
        </Section>

        {/* Section 5 — Data and privacy */}
        <Section num="05" title="Data and Fairness">
          <p>
            Points are recorded server-side and cannot be self-reported or manipulated through
            client-side requests alone. Each task completion is validated against real platform
            actions (a vote, a comment, an AI analysis run) before points are awarded.
          </p>
          <p>
            Verdict reserves the right to void points from accounts found to be abusing the system
            through automation, multi-accounting, or other inauthentic behavior. Enforcement
            decisions are at the sole discretion of the Verdict team and are not subject to appeal.
          </p>
          <p>
            Participation data (points, tasks, badges) may be used in aggregate to understand
            platform growth. No personal data is sold or shared with third parties. See our{' '}
            <Link href="/privacy" className="text-primary hover:opacity-70 transition-opacity">
              Privacy Policy
            </Link>{' '}
            for full details.
          </p>
        </Section>

        {/* Section 6 — Changes */}
        <Section num="06" title="Changes to Pre-Season">
          <p>
            Verdict may modify task definitions, point values, badge criteria, or the Pre-Season
            end date at any time. Significant changes will be announced on this page and on the
            main Pre-Season dashboard. Continued participation after a change constitutes
            acceptance of the updated terms.
          </p>
          <p>
            Pre-Season may be terminated early if required by legal or operational constraints.
            In such a case, the final snapshot will be taken at the termination date rather than
            September 1, 2026.
          </p>
        </Section>

        {/* Footer disclaimer repeat */}
        <div className="mt-16 pt-8 border-t border-border text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            <strong className="text-foreground">No token or financial reward is promised.</strong>{' '}
            Pre-Season points and Genesis badges are non-transferable platform recognition only.
            This document is informational and does not constitute a legal agreement, offer of
            securities, or financial advice.
          </p>
          <p>Last updated: June 2026</p>
        </div>

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/pre-season"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Pre-Season Dashboard
          </Link>
        </div>

      </main>

      <PageFooter />
    </div>
  )
}

function Section({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-xs font-mono text-muted-foreground">{num}</span>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  )
}
