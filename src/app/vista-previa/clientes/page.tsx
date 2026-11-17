import { CustomersListView } from '@/components/app/customers-views'
import { PreviewShell } from '../shell'
import { PREVIEW_CUSTOMERS } from '../datos'

export const metadata = { title: 'Vista previa: clientes', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <PreviewShell path="/app/clientes">
      <CustomersListView customers={PREVIEW_CUSTOMERS} newHref="/vista-previa/clientes/nuevo" hrefBase="/vista-previa/clientes" />
    </PreviewShell>
  )
}
