'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger"><AlertTriangle className="size-6" /></span>
      <h1 className="text-xl font-semibold">Algo no salió bien</h1>
      <p className="text-sm text-muted">
        No perdiste información. Probá de nuevo; si sigue pasando, escribinos
        {error.digest ? <> con este código: <code className="text-ink">{error.digest}</code></> : '.'}
      </p>
      <Button variant="secondary" onClick={reset}><RotateCcw className="size-4" />Reintentar</Button>
    </div>
  )
}
