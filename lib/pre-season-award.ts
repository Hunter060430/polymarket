// Client-side helper to silently award a Pre-Season task completion.
// Fire-and-forget — never throws, never blocks UI.

export async function awardTask(taskKey: string): Promise<void> {
  try {
    await fetch('/api/pre-season/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskKey }),
    })
  } catch {
    // silent — points are a best-effort feature
  }
}
