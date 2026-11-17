import { NewCustomerView } from '@/components/app/customers-views'
import { PreviewShell } from '../../shell'
import { previewAction } from '../../actions'

export const metadata = { title: 'Vista previa: nuevo cliente', robots: { index: false, follow: false } }

export default function Page() {
  return (
    <PreviewShell path="/app/clientes">
      <NewCustomerView action={previewAction} backHref="/vista-previa/clientes" />
    </PreviewShell>
  )
}
