import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import type { NormalizedMarket } from '@/lib/types'

interface OraclePanelProps {
  oracle: NormalizedMarket['oracle']
  conditionId: string
}

// Honest presentation of resolution / oracle metadata. Polymarket markets are
// resolved by the UMA Optimistic Oracle on Polygon. When Gamma exposes oracle
// status we surface it; when it does not, we say so plainly rather than
// fabricating an on-chain dispute history.
export function OraclePanel({ oracle, conditionId }: OraclePanelProps) {
  const hasStatus = oracle.umaResolutionStatus.length > 0
  const disputed = oracle.hasDisputeSignal

  const Icon = disputed ? ShieldAlert : hasStatus ? ShieldCheck : ShieldQuestion
  const iconColor = disputed
    ? 'var(--risk-critical)'
    : hasStatus
    ? 'var(--risk-low)'
    : 'var(--muted-foreground)'

  return (
    <div className="border border-border">
      <div className="flex items-start gap-3 px-4 sm:px-5 py-4 border-b border-border">
        <Icon className="size-5 shrink-0 mt-0.5" style={{ color: iconColor }} aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {disputed
              ? 'On-chain dispute signal detected'
              : hasStatus
              ? 'Resolution status available'
              : 'No on-chain dispute record available'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {disputed
              ? 'Gamma reports an UMA status indicating this market was challenged or proposed for dispute. Review carefully before trading.'
              : hasStatus
              ? 'Gamma exposes a resolution status for this market (shown below).'
              : 'Polymarket markets resolve via the UMA Optimistic Oracle on Polygon. The Gamma API did not return dispute metadata for this market, so no challenge history can be confirmed here.'}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-border">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3">
          <dt className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Resolution oracle</dt>
          <dd className="text-sm text-foreground text-right">
            {oracle.resolvedBy || 'UMA Optimistic Oracle'}
          </dd>
        </div>
        {hasStatus && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3">
            <dt className="text-xs tracking-[0.08em] uppercase text-muted-foreground">UMA status</dt>
            <dd className="text-sm text-foreground text-right font-mono">{oracle.umaResolutionStatus}</dd>
          </div>
        )}
        {conditionId && (
          <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3">
            <dt className="text-xs tracking-[0.08em] uppercase text-muted-foreground">Condition ID</dt>
            <dd className="text-xs text-foreground/70 text-right font-mono truncate max-w-[55%]">{conditionId}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
