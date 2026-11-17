/** Resultado estándar de una Server Action de formulario. */
export type FormState = {
  ok?: string
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export const initialFormState: FormState = {}

export function firstError(state: FormState, field: string): string | undefined {
  return state.fieldErrors?.[field]?.[0]
}
