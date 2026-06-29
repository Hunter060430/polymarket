'use client'

import { cn } from '@/lib/utils'
import type { TaskDef } from '@/lib/pre-season'
import { CheckCircle2, Circle, Zap, BarChart2, MessageSquare, Repeat2 } from 'lucide-react'

interface TaskWithCompletion extends TaskDef {
  completed: boolean
  completionCount?: number  // for repeatable tasks — how many times completed
}

interface TaskBoardProps {
  taskProgress: TaskWithCompletion[]
  isAuthenticated: boolean
  loading: boolean
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  onboarding: { label: 'Onboarding',  icon: <Zap className="size-3.5" />,           color: 'text-sky-500' },
  analysis:   { label: 'Analysis',    icon: <BarChart2 className="size-3.5" />,      color: 'text-emerald-500' },
  community:  { label: 'Community',   icon: <MessageSquare className="size-3.5" />,  color: 'text-amber-500' },
  streak:     { label: 'Streak',      icon: <Repeat2 className="size-3.5" />,        color: 'text-violet-500' },
}

const CATEGORIES = ['onboarding', 'analysis', 'community', 'streak'] as const

export function TaskBoard({ taskProgress, isAuthenticated, loading }: TaskBoardProps) {
  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-border bg-secondary/10 p-4 animate-pulse h-28" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.map(cat => {
        const tasks = taskProgress.filter(t => t.category === cat)
        if (tasks.length === 0) return null
        const meta = CATEGORY_META[cat]
        const catCompleted = tasks.filter(t => t.completed).length
        const catPoints = tasks.reduce((s, t) => s + t.points, 0)
        const earnedPoints = tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0)

        return (
          <section key={cat}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-3">
              <div className={cn('flex items-center gap-2 text-sm font-medium', meta.color)}>
                {meta.icon}
                {meta.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {catCompleted}/{tasks.length} tasks · {earnedPoints}/{catPoints} pts
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasks.map(task => (
                <TaskCard key={task.key} task={task} isAuthenticated={isAuthenticated} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TaskCard({ task, isAuthenticated }: { task: TaskWithCompletion; isAuthenticated: boolean }) {
  const isRepeatable = task.repeatable
  const count = task.completionCount ?? 0
  const cap = task.maxCount ?? 1
  const pct = isRepeatable ? Math.min(100, Math.round((count / cap) * 100)) : 0
  const atCap = isRepeatable && count >= cap

  return (
    <div
      className={cn(
        'border p-4 flex flex-col gap-3 transition-colors',
        (task.completed || atCap)
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-background hover:border-border/80',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isRepeatable && <Repeat2 className="size-3 text-muted-foreground shrink-0" aria-label="Repeatable" />}
          <span className="text-sm font-medium text-foreground leading-tight">{task.title}</span>
        </div>
        {(task.completed || atCap) ? (
          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
        ) : (
          <Circle className="size-4 text-muted-foreground/40 shrink-0 mt-0.5" />
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed flex-1">
        {task.description}
      </p>

      {/* Repeatable progress bar */}
      {isRepeatable && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{count.toLocaleString()} / {cap.toLocaleString()}</span>
            <span>{(count * task.points).toLocaleString()} pts earned</span>
          </div>
          <div className="h-1 bg-muted w-full">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 border',
          (task.completed || atCap)
            ? 'border-primary/30 text-primary bg-primary/10'
            : 'border-border text-muted-foreground',
        )}>
          <Zap className="size-3" />
          {isRepeatable ? `+${task.points} pts each` : `+${task.points} pts`}
        </div>

        {atCap && <span className="text-xs text-primary font-medium">Maxed out</span>}
        {!isRepeatable && task.completed && <span className="text-xs text-primary font-medium">Completed</span>}
        {!task.completed && !atCap && !isAuthenticated && (
          <span className="text-xs text-muted-foreground">Sign in to earn</span>
        )}
      </div>
    </div>
  )
}
