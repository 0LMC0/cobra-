import type { Metadata } from 'next'
import { PreviewShell } from '../shell'
import { HomeView } from '@/components/app/home-view'
import type { TodayReminder } from '@/components/app/today-reminders'

/**
 * Vista previa del panel con datos de ejemplo, SÓLO en desarrollo: sirve para
 * revisar el diseño sin Supabase. En producción responde 404.
 */
export const metadata: Metadata = { title: 'Vista previa del panel', robots: { index: false, follow: false } }

// Teléfonos de ejemplo con el prefijo 11 0000: no corresponden a nadie real a propósito.
const EXAMPLE_REMINDERS: TodayReminder[] = [
  { id: '1', customerName: 'Estudio Rivas', contactName: 'Marina Pérez', phone: '11 0000-0001', concept: 'la cuota de noviembre', amountMinor: 15_000_000, currency: 'ARS', dueDate: '2026-11-13', moment: 'after', emailStatus: 'sent' },
  { id: '2', customerName: 'Clínica Norte', contactName: null, phone: '0351 15 000-0002', concept: 'el mantenimiento de noviembre', amountMinor: 32_000_000, currency: 'ARS', dueDate: '2026-11-17', moment: 'due', emailStatus: 'today' },
  { id: '3', customerName: 'Panadería Sol', contactName: null, phone: null, concept: 'la gestión de redes de noviembre', amountMinor: 9_500_000, currency: 'ARS', dueDate: '2026-11-20', moment: 'before', emailStatus: 'none' },
]

export default function PanelPreview() {
  return (
    <PreviewShell path="/app">
      <HomeView
        dateLabel="martes, 17 de noviembre"
        onboardingStep="first_customer"
        currency="ARS"
        businessName="Estudio Martínez"
        transferAlias="estudio.martinez"
        todayReminders={EXAMPLE_REMINDERS}
        totals={{ pendingMinor: 56_500_000, collectedMinor: 41_000_000, overdueMinor: 15_000_000, hasData: true }}
      />
    </PreviewShell>
  )
}
