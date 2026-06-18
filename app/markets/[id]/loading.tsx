import { Nav, PageFooter } from '@/components/nav'

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`bg-secondary/60 animate-pulse rounded-none ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export default function MarketDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Nav />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-0">

        {/* Breadcrumb */}
        <div className="border-b border-border pb-6 mb-8 sm:mb-10">
          <Bone className="h-3 w-24 mb-5" />
          <div className="flex gap-2 mb-4">
            <Bone className="h-5 w-20" />
            <Bone className="h-5 w-16" />
          </div>
          <Bone className="h-10 w-full mb-2" />
          <Bone className="h-10 w-3/4 mb-3" />
          <Bone className="h-4 w-48" />
        </div>

        {/* Score hero */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-12 items-start">
            <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-1 sm:pr-12">
              <Bone className="h-28 w-28" />
              <Bone className="h-3 w-20" />
            </div>
            <div className="flex flex-col gap-4">
              <Bone className="h-7 w-32" />
              <Bone className="h-4 w-full" />
              <Bone className="h-4 w-5/6" />
              <Bone className="h-4 w-4/6" />
            </div>
          </div>
        </section>

        {/* Score breakdown */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <Bone className="h-7 w-48 mb-2" />
          <Bone className="h-3 w-32 mb-6" />
          <div className="flex flex-col gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Bone className="h-4 w-32 shrink-0" />
                <Bone className="h-2 flex-1" />
                <Bone className="h-4 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Market details */}
        <section className="border-b border-border pb-8 sm:pb-10 mb-8 sm:mb-10">
          <Bone className="h-7 w-40 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-border mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-4 py-4 border-r border-b border-border last:border-r-0">
                <Bone className="h-3 w-16 mb-3" />
                <Bone className="h-6 w-20" />
              </div>
            ))}
          </div>
          <Bone className="h-4 w-full mb-2" />
          <Bone className="h-4 w-3/4" />
        </section>

      </main>
      <PageFooter />
    </div>
  )
}
