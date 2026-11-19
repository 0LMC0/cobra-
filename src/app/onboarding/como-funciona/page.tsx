import { redirect } from 'next/navigation'

/** El paso "Así funciona" ahora va resumido al lado del primer cobro. */
export default function ComoFuncionaPage() {
  redirect('/onboarding/primer-cobro')
}
