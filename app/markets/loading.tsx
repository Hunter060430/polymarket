import { Nav, PageFooter } from '@/components/nav'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border ${className ?? ''}`} aria-hidden="true" />
}

export default function MarketsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

        {/* Header skeleton */}
        <div className="border-b border-border pb-6 sm:pb-8">
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-0 border-b border-border -mt-4">
          <Skeleton className="h-9 w-32 mr-2" />
          <Skeleton className="h-9 w-36" />
        </div>

        {/* Filter bar skeleton */}
        <div className="border border-border border-b-0 px-3 py-3 flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-8 w-full sm:flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-36" />
          </div>
        </div>

        {/* Market rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 border border-border border-t-0">
            <Skeleton className="h-8 w-8 shrink-0" />
            <div className="w-px self-stretch bg-border shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-14 hidden sm:block" />
            <Skeleton className="size-4 shrink-0" />
          </div>
        ))}

      </main>
      <PageFooter />
    </div>
  )
}
