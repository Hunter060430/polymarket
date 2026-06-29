// Client-side helper to silently award a Pre-Season task completion.
// Synchronously returns void (fire-and-forget). Attaches .catch() directly on
// the promise so the rejection is always handled regardless of the call-site.

export function awardTask(taskKey: string): void {
  fetch('/api/pre-season/award', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskKey }),
  }).catch(() => {
    // silent — points are a best-effort feature
  })
}
