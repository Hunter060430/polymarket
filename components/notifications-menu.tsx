'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Bell } from 'lucide-react'
import { useSession } from '@/lib/auth-client'

const fetcher = (url: string) => fetch(url).then((response) => response.json())

type Notification = { id: number; title: string; message: string; read: boolean; createdAt: string }

export function NotificationsMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const { data, mutate } = useSWR<{ notifications: Notification[]; unread: number }>(session?.user ? '/api/notifications' : null, fetcher, { refreshInterval: 60_000 })

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/notifications/refresh', { method: 'POST' }).then(() => mutate())
  }, [session?.user, mutate])

  if (!session?.user) return null
  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    mutate()
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} aria-label={`Notifications${data?.unread ? `, ${data.unread} unread` : ''}`} aria-expanded={open} className="relative flex size-9 items-center justify-center text-muted-foreground hover:text-foreground">
        <Bell className="size-4" />
        {!!data?.unread && <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />}
      </button>
      {open && <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><p className="text-sm font-medium">Alerts</p><button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground">Mark all read</button></div>
        <div className="max-h-96 overflow-y-auto">
          {data?.notifications.length ? data.notifications.map((item) => <div key={item.id} className="border-b border-border px-4 py-3 last:border-0"><div className="flex gap-2"><span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${item.read ? 'bg-border' : 'bg-primary'}`} /><div><p className="text-sm text-foreground">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.message}</p></div></div></div>) : <p className="px-4 py-8 text-center text-xs text-muted-foreground">No alerts yet. Watch markets to track changes.</p>}
        </div>
      </div>}
    </div>
  )
}
