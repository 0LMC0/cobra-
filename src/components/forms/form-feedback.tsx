import { Alert } from '@/components/ui/misc'
import type { FormState } from '@/server/actions/form-state'

export function FormFeedback({ state }: { state: FormState }) {
  if (state.error) return <Alert tone="danger">{state.error}</Alert>
  if (state.ok) return <Alert tone="ok">{state.ok}</Alert>
  return null
}
