import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

/**
 * BORRADORES. Deben ser revisados por un profesional antes de publicar
 * (ver docs/SECURITY.md). Se muestran con aviso visible.
 */
const DOCS = {
  terminos: {
    title: 'Términos y condiciones',
    sections: [
      ['Qué es Cobra+', 'Cobra+ es un software para organizar cobranzas y enviar recordatorios. No es una entidad financiera, no procesa pagos de tus clientes ni recibe o custodia dinero de terceros.'],
      ['Tu cuenta', 'Sos responsable de la información que cargás, de tener permiso para contactar a tus clientes y de mantener la confidencialidad de tu contraseña.'],
      ['Planes y prueba', 'La prueba gratuita dura 14 días. Al finalizar, para seguir usando Cobra+ necesitás contratar un plan. Los precios y límites vigentes se publican en el sitio.'],
      ['Cancelación', 'Podés cancelar la renovación en cualquier momento. Mantenés el acceso hasta el fin del período pago y podés exportar tus datos.'],
      ['Uso aceptable', 'No podés usar Cobra+ para enviar comunicaciones engañosas, acosar a deudores ni contactar personas sin base legal para hacerlo.'],
      ['Responsabilidad', 'Cobra+ se ofrece “tal cual”. Hacemos lo razonable para que funcione de forma continua, pero no garantizamos que los recordatorios produzcan un pago.'],
    ],
  },
  privacidad: {
    title: 'Política de privacidad',
    sections: [
      ['Quién trata los datos', 'Respecto de tu cuenta, Cobra+ es responsable del tratamiento. Respecto de los datos de tus clientes, vos sos responsable y Cobra+ actúa como encargado, siguiendo tus instrucciones.'],
      ['Qué datos guardamos', 'Datos de tu cuenta (nombre, email), de tu empresa, y los que cargues sobre tus clientes y cobros. Pedimos lo mínimo: CUIT y dirección son opcionales.'],
      ['Para qué', 'Para prestar el servicio: mostrarte tus cobros, enviar los recordatorios que configures y facturarte el plan. No vendemos datos.'],
      ['Proveedores', 'Usamos proveedores de infraestructura (base de datos, hosting y envío de emails) que tratan datos por cuenta nuestra.'],
      ['Tus derechos', 'Podés acceder, rectificar, exportar y pedir la eliminación de tus datos conforme a la Ley 25.326. La Agencia de Acceso a la Información Pública es el órgano de control.'],
      ['Seguridad', 'Aislamos los datos de cada empresa, ciframos las conexiones y registramos los cambios financieros. Ningún sistema es infalible; te avisaremos ante incidentes que te afecten.'],
    ],
  },
} as const

type DocKey = keyof typeof DOCS

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }))
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params
  const d = DOCS[doc as DocKey]
  return d ? { title: d.title, robots: { index: false } } : {}
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params
  const d = DOCS[doc as DocKey]
  if (!d) notFound()
  return (
    <main className="mx-auto max-w-[680px] px-4 py-16 sm:px-6">
      <p className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-[13px] font-medium text-warn">
        Borrador pendiente de revisión legal. No constituye la versión vigente.
      </p>
      <h1 className="mt-8 text-[34px] font-semibold">{d.title}</h1>
      <div className="mt-8 flex flex-col gap-7">
        {d.sections.map(([h, p]) => (
          <section key={h} className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold">{h}</h2>
            <p className="text-[15px] leading-relaxed text-muted">{p}</p>
          </section>
        ))}
      </div>
    </main>
  )
}
