import { Nav, PageFooter } from '@/components/nav'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Verdict API plans — from a free open tier to Pro access with historical data and webhooks.',
}

type Tier = {
  name: string
  price: string
  cadence: string
  blurb: string
  cta: { label: string; href: string }
  featured?: boolean
  features: { label: string; included: boolean }[]
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    blurb: 'Everything you need to browse and audit market clarity scores.',
    cta: { label: 'Start using the API', href: '/api-docs' },
    features: [
      { label: 'Full web app & dashboard', included: true },
      { label: 'Public REST API', included: true },
      { label: '100 requests / day', included: true },
      { label: 'Live clarity scores', included: true },
      { label: 'Scoring trace & methodology', included: true },
      { label: 'Historical score snapshots', included: false },
      { label: 'Webhook alerts', included: false },
      { label: 'Commercial license', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    cadence: 'per month',
    blurb: 'For quants, researchers, and desks that depend on Verdict data.',
    cta: { label: 'Contact for access', href: 'mailto:hello@verdict.app?subject=Verdict%20Pro' },
    featured: true,
    features: [
      { label: 'Full web app & dashboard', included: true },
      { label: 'Public REST API', included: true },
      { label: 'Unlimited requests', included: true },
      { label: 'Live clarity scores', included: true },
      { label: 'Scoring trace & methodology', included: true },
      { label: 'Historical score snapshots', included: true },
      { label: 'Webhook alerts', included: true },
      { label: 'Commercial license', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual',
    blurb: 'Dedicated infrastructure, SLAs, and a commercial redistribution license.',
    cta: { label: 'Talk to us', href: 'mailto:hello@verdict.app?subject=Verdict%20Enterprise' },
    features: [
      { label: 'Full web app & dashboard', included: true },
      { label: 'Public REST API', included: true },
      { label: 'Unlimited requests', included: true },
      { label: 'Live clarity scores', included: true },
      { label: 'Scoring trace & methodology', included: true },
      { label: 'Historical score snapshots', included: true },
      { label: 'Webhook alerts', included: true },
      { label: 'Commercial license', included: true },
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 flex flex-col gap-0">

        {/* Header */}
        <div className="border-b border-border pb-10 mb-10 text-center">
          <p className="text-xs tracking-[0.16em] uppercase text-primary mb-3">Plans</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-foreground text-balance">
            Pricing built for builders
          </h1>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xl mx-auto text-pretty">
            The web app and a generous API tier are free forever. Upgrade only when you need
            historical data, webhooks, or a commercial license.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`bg-background flex flex-col p-6 ${tier.featured ? 'ring-1 ring-inset ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-heading text-xl font-light text-foreground">{tier.name}</h2>
                {tier.featured && (
                  <span className="text-[10px] tracking-[0.1em] uppercase text-primary border border-primary px-2 py-0.5">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5 mt-3 mb-2">
                <span className="font-heading text-4xl font-light tabular-nums text-foreground">{tier.price}</span>
                <span className="text-xs text-muted-foreground">{tier.cadence}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6 min-h-[2.5rem]">{tier.blurb}</p>

              <Link
                href={tier.cta.href}
                className={`text-center text-xs tracking-[0.08em] uppercase px-4 py-2.5 transition-colors mb-6 ${
                  tier.featured
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border border-border text-foreground hover:bg-secondary/40'
                }`}
              >
                {tier.cta.label}
              </Link>

              <ul className="flex flex-col gap-2.5 mt-auto">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2.5 text-xs leading-relaxed">
                    {f.included ? (
                      <Check className="size-3.5 shrink-0 mt-0.5 text-[var(--risk-low)]" aria-hidden="true" />
                    ) : (
                      <Minus className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/40" aria-hidden="true" />
                    )}
                    <span className={f.included ? 'text-foreground' : 'text-muted-foreground/50'}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground text-center mt-8 leading-relaxed max-w-lg mx-auto">
          Prices are indicative while Verdict is in beta. Academic and journalistic use of the free
          tier is always permitted. Questions?{' '}
          <a
            href="mailto:hello@verdict.app"
            className="text-primary hover:underline underline-offset-4"
          >
            Get in touch
          </a>
          .
        </p>

      </main>
      <PageFooter />
    </div>
  )
}
