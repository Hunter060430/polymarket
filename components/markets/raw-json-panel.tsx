'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { NormalizedMarket } from '@/lib/types'

interface RawJsonPanelProps {
  market: NormalizedMarket
}

export function RawJsonPanel({ market }: RawJsonPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Raw Market Data</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="raw-json-content"
          >
            {open ? (
              <>
                <ChevronDown className="size-4 mr-1" aria-hidden="true" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="size-4 mr-1" aria-hidden="true" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent id="raw-json-content">
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs text-muted-foreground leading-relaxed max-h-96">
            {JSON.stringify(market, null, 2)}
          </pre>
        </CardContent>
      )}
    </Card>
  )
}
