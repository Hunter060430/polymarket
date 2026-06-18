import { Nav, PageFooter } from '@/components/nav'

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-border ${className ?? ''}`} aria-hidden="true" />
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 sm:gap-10">

        {/* Header skeleton */}
        <div className="border-b border-border pb-6 sm:pb-8">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-10 w-80 mb-3" />
          <Skeleton className="h-4 w-full max-w-xl mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-y divide-border border border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="border border-border border-b-0">
          {/* Table header */}
          <div className="px-5 py-3 border-b border-border bg-secondary/20 flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-5 px-5 py-4 border-b border-border">
              <Skeleton className="h-8 w-8 shrink-0" />
              <div className="w-px self-stretch bg-border shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-full max-w-lg" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-16 hidden sm:block" />
              <Skeleton className="size-4 shrink-0" />
            </div>
          ))}
        </div>

      </main>
      <PageFooter />
    </div>
  )
}
