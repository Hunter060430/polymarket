import { Nav } from '@/components/nav'
import { PreSeasonClient } from '@/components/pre-season/pre-season-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pre-Season — Verdict',
  description: 'Complete tasks, earn points, and claim exclusive Genesis badges before Season 1 begins.',
}

export default function PreSeasonPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav />
      <PreSeasonClient />
    </div>
  )
}
