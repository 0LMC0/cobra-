import { notFound } from 'next/navigation'
import { CustomerDetailView } from '@/components/app/customers-views'
import { PreviewShell } from '../../shell'
import { previewAction } from '../../actions'
import { PREVIEW_CHARGES, PREVIEW_CUSTOMERS, PREVIEW_TODAY } from '../../datos'

export const metadata = { title: 'Vista previa: cliente', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = PREVIEW_CUSTOMERS.find((c) => c.id === id)
  if (!customer) notFound()
  return (
    <PreviewShell path="/app/clientes">
      <CustomerDetailView
        customer={customer}
        charges={PREVIEW_CHARGES.filter((c) => c.customerId === id)}
        today={PREVIEW_TODAY}
        businessName="Estudio Martínez"
        transferAlias="estudio.martinez"
        defaultCurrency="ARS"
        chargeAction={previewAction}
        payAction={previewAction}
        backHref="/vista-previa/clientes"
      />
    </PreviewShell>
  )
}
