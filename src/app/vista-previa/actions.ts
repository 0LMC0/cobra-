'use server'

import type { FormState } from '@/server/actions/form-state'

/** En la vista previa no hay base de datos: los formularios avisan en vez de guardar. */
export async function previewAction(...args: [FormState, FormData]): Promise<FormState> {
  void args
  return { error: 'Vista previa: acá no se guarda nada. Con Supabase conectado, esto queda registrado.' }
}
