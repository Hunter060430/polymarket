// Pre-Season configuration — task definitions, badge tiers, point values.
// This is the single source of truth; the API routes and UI both import from here.

export const PRESEASON_END = new Date('2026-09-01T00:00:00Z')

export interface TaskDef {
  key: string
  title: string
  description: string
  points: number
  category: 'onboarding' | 'analysis' | 'community' | 'streak'
  repeatable: boolean   // false = one-time task, true = awarded each time
  maxCount?: number     // for repeatable tasks: max times it can be awarded
}

export const TASKS: TaskDef[] = [
  // ── Onboarding (one-time) ──────────────────────────────────────────────
  { key: 'first_sign_in',      title: 'First Sign-In',                 description: 'Sign in to Verdict for the first time.',                     points: 20,  category: 'onboarding', repeatable: false },
  { key: 'complete_profile',   title: 'Complete Your Profile',         description: 'Set a username on your account.',                            points: 50,  category: 'onboarding', repeatable: false },
  { key: 'visit_methodology',  title: 'Read the Methodology',          description: 'Visit the Methodology page to understand how scoring works.', points: 30,  category: 'onboarding', repeatable: false },

  // ── Analysis milestones (one-time) ────────────────────────────────────
  { key: 'first_risk_vote',    title: 'Cast Your First Risk Vote',     description: 'Vote on the risk level of any market.',                      points: 20,  category: 'analysis',   repeatable: false },
  { key: 'risk_votes_10',      title: '10 Risk Votes',                 description: 'Cast risk votes on 10 different markets.',                   points: 80,  category: 'analysis',   repeatable: false },
  { key: 'risk_votes_50',      title: '50 Risk Votes',                 description: 'Cast risk votes on 50 different markets.',                   points: 300, category: 'analysis',   repeatable: false },
  { key: 'risk_votes_100',     title: '100 Risk Votes',                description: 'Cast risk votes on 100 different markets.',                  points: 500, category: 'analysis',   repeatable: false },
  { key: 'run_ai_analysis',    title: 'Run AI Analysis',               description: 'Trigger AI analysis on any market.',                         points: 50,  category: 'analysis',   repeatable: false },
  { key: 'ai_analysis_5',      title: 'AI Analyst',                    description: 'Run AI analysis on 5 different markets.',                    points: 200, category: 'analysis',   repeatable: false },
  { key: 'ai_analysis_20',     title: 'Senior AI Analyst',             description: 'Run AI analysis on 20 different markets.',                   points: 500, category: 'analysis',   repeatable: false },

  // ── Analysis repeatable (per action, capped) ──────────────────────────
  { key: 'vote_daily',         title: 'Daily Risk Vote (+5 pts each)', description: 'Earn 5 points per risk vote cast. Up to 200 times.',         points: 5,   category: 'analysis',   repeatable: true, maxCount: 200 },
  { key: 'ai_daily',           title: 'Daily AI Run (+15 pts each)',   description: 'Earn 15 points per AI analysis run. Up to 50 times.',        points: 15,  category: 'analysis',   repeatable: true, maxCount: 50  },

  // ── Community milestones (one-time) ───────────────────────────────────
  { key: 'first_comment',      title: 'First Comment',                 description: 'Post your first comment on any market.',                     points: 30,  category: 'community',  repeatable: false },
  { key: 'comments_10',        title: 'Active Commentator',            description: 'Post 10 comments across any markets.',                       points: 100, category: 'community',  repeatable: false },
  { key: 'comments_50',        title: 'Power Commentator',             description: 'Post 50 comments across any markets.',                       points: 300, category: 'community',  repeatable: false },
  { key: 'comment_upvoted',    title: 'Community Approved',            description: 'Receive your first upvote on a comment.',                    points: 50,  category: 'community',  repeatable: false },
  { key: 'comment_3_upvotes',  title: 'Insight Worth Reading',         description: 'Have a single comment receive 3 upvotes.',                   points: 100, category: 'community',  repeatable: false },
  { key: 'watchlist_add',      title: 'Start Your Watchlist',          description: 'Add a market to your watchlist.',                            points: 20,  category: 'community',  repeatable: false },

  // ── Community repeatable ───────────────────────────────────────────────
  { key: 'comment_daily',      title: 'Daily Comment (+10 pts each)', description: 'Earn 10 points per comment posted. Up to 100 times.',         points: 10,  category: 'community',  repeatable: true, maxCount: 100 },

  // ── Streak (daily check-in) ────────────────────────────────────────────
  { key: 'daily_checkin',      title: 'Daily Check-In (+10 pts/day)', description: 'Sign in and visit Verdict each day. Up to 90 days.',          points: 10,  category: 'streak',     repeatable: true, maxCount: 90  },
  { key: 'streak_7',           title: '7-Day Streak',                  description: 'Check in for 7 consecutive days.',                            points: 50,  category: 'streak',     repeatable: false },
  { key: 'streak_30',          title: '30-Day Streak',                 description: 'Check in for 30 consecutive days.',                           points: 200, category: 'streak',     repeatable: false },
]

export interface BadgeTier {
  key: string
  name: string
  description: string
  supply: number       // total supply across all users
  pointsRequired: number
  color: string        // tailwind color token for rendering
}

export const GENESIS_BADGES: BadgeTier[] = [
  {
    key: 'verdict_pioneer',
    name: 'Verdict Pioneer',
    description: 'Among the first 10 accounts ever created on Verdict.',
    supply: 10,
    pointsRequired: 0,   // eligibility is by registration order, not points
    color: 'amber',
  },
  {
    key: 'genesis_founder',
    name: 'Genesis Founder',
    description: 'Registered during the Pre-Season window. Reserved for the first 100 users.',
    supply: 100,
    pointsRequired: 0,
    color: 'sky',
  },
  {
    key: 'shadow_analyst',
    name: 'Shadow Analyst',
    description: 'Completed every analysis task during Pre-Season.',
    supply: 20,
    pointsRequired: 650,  // sum of all analysis task points
    color: 'emerald',
  },
  {
    key: 'oracle_elite',
    name: 'Oracle Elite',
    description: 'Ranked in the top 50 by Pre-Season points at Season end.',
    supply: 50,
    pointsRequired: 500,
    color: 'violet',
  },
  {
    key: 'the_architect',
    name: 'The Architect',
    description: 'Ranked #1 on the Pre-Season leaderboard. One holder ever.',
    supply: 1,
    pointsRequired: 1000,
    color: 'rose',
  },
]

export function getBadgeEligibility(
  points: number,
  completedTaskKeys: string[],
  registrationRank: number,  // 1-indexed position by createdAt
): BadgeTier[] {
  const eligible: BadgeTier[] = []

  for (const badge of GENESIS_BADGES) {
    if (badge.key === 'verdict_pioneer' && registrationRank <= 10) eligible.push(badge)
    if (badge.key === 'genesis_founder' && registrationRank <= 100) eligible.push(badge)
    if (badge.key === 'shadow_analyst') {
      const analysisTasks = TASKS.filter(t => t.category === 'analysis').map(t => t.key)
      if (analysisTasks.every(k => completedTaskKeys.includes(k))) eligible.push(badge)
    }
    if (badge.key === 'oracle_elite' && points >= badge.pointsRequired) eligible.push(badge)
    if (badge.key === 'the_architect' && points >= badge.pointsRequired) eligible.push(badge)
  }

  return eligible
}
