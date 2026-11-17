import { ShieldAlert } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'

export const metadata = { title: 'Sin permisos' }

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-warn-soft text-warn"><ShieldAlert className="size-6" /></span>
      <h1 className="text-xl font-semibold">No tenés permisos para ver esto</h1>
      <p className="text-sm text-muted">Pedile a quien administra tu empresa en COBRA que te dé acceso.</p>
      <ButtonLink href="/app" variant="secondary">Volver al inicio</ButtonLink>
    </div>
  )
}
