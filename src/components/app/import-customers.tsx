'use client'

import Link from 'next/link'
import { startTransition, useActionState, useMemo, useState } from 'react'
import { ArrowLeft, Download, FileUp } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { FormFeedback } from '@/components/forms/form-feedback'
import { IMPORT_TEMPLATE, previewImport } from '@/domain/import-customers'
import { initialFormState, type FormState } from '@/server/actions/form-state'
import { cn } from '@/lib/cn'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

/** Importar clientes: elegís el archivo, ves qué entra y confirmás. */
export function ImportCustomersView({ action, existing, room, planName }: {
  action: Action
  existing: { emails: string[]; taxIds: string[] }
  /** Lugar que queda en el plan (clientes activos). */
  room: number
  planName: string
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const preview = useMemo(() => (csv ? previewImport(csv, existing) : null), [csv, existing])
  const problems = preview?.rows.filter((r) => r.status !== 'ok') ?? []
  const tooMany = preview ? preview.ok > room : false
  const template = `data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATE)}`

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setCsv(await file.text())
  }

  function submit() {
    const data = new FormData()
    data.set('csv', csv)
    startTransition(() => formAction(data))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link href="/app/clientes" className="inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" /> Clientes</Link>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[32px] sm:text-[38px]">Importar clientes desde Excel</h1>
        <p className="text-[14.5px] leading-relaxed text-muted">
          Si ya tenés tus clientes en una planilla, los cargás todos juntos. Antes de guardar te mostramos qué entra, qué tiene errores y qué ya estaba cargado.
        </p>
      </header>

      <ol className="flex flex-col gap-3 rounded-[22px] bg-surface p-5 text-[14.5px] ring-1 ring-line-2 sm:p-7">
        <li><b>1.</b> En tu planilla, la primera fila tiene que tener los títulos: <b>Nombre</b>, <b>Email</b>, <b>Celular</b> (y si querés, CUIT, Contacto, Notas).</li>
        <li><b>2.</b> En Excel: <i>Archivo → Guardar como → CSV</i>. En Google Sheets: <i>Archivo → Descargar → CSV</i>.</li>
        <li><b>3.</b> Elegí ese archivo acá abajo.</li>
        <li>
          <a href={template} download="clientes-cobra-plus.csv" className="inline-flex items-center gap-1.5 font-bold text-brand-text hover:underline">
            <Download className="size-4" /> Bajar una planilla de ejemplo
          </a>
        </li>
      </ol>

      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[22px] border-2 border-dashed border-line-2 bg-surface px-5 py-8 text-center hover:border-brand">
        <FileUp className="size-7 text-brand" />
        <span className="text-[16px] font-bold">{fileName || 'Elegí el archivo CSV'}</span>
        <span className="text-[13px] text-muted">{fileName ? 'Tocá para elegir otro' : 'Hasta 1.000 clientes por archivo'}</span>
        <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="sr-only" />
      </label>

      <FormFeedback state={state} />

      {preview?.fileError && <p className="rounded-[14px] bg-warn-soft px-4 py-3 text-[14.5px] font-semibold text-warn">{preview.fileError}</p>}

      {preview && !preview.fileError && (
        <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 ring-1 ring-line-2 sm:p-7">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat n={preview.ok} label="para importar" tone="ok" />
            <Stat n={preview.duplicates} label="ya estaban" tone="muted" />
            <Stat n={preview.errors} label="con errores" tone={preview.errors ? 'warn' : 'muted'} />
          </div>
          {preview.ignoredColumns.length > 0 && (
            <p className="text-[13px] text-muted">No usamos estas columnas: {preview.ignoredColumns.join(', ')}.</p>
          )}
          {problems.length > 0 && (
            <details className="rounded-[14px] ring-1 ring-line-2" open={preview.ok === 0}>
              <summary className="cursor-pointer px-4 py-3 text-[14px] font-bold">Ver las filas que no se importan ({problems.length})</summary>
              <ul className="max-h-72 overflow-y-auto border-t border-line px-4 py-2 text-[13.5px]">
                {problems.map((r) => (
                  <li key={r.line} className="border-b border-line py-2 last:border-0">
                    <b>Fila {r.line} · {'name' in r ? r.name : ''}</b> <span className="text-muted">— {'problem' in r ? r.problem : ''}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
          {tooMany ? (
            <div className="flex flex-col items-start gap-3 rounded-[14px] bg-warn-soft p-4">
              <p className="text-[14.5px] font-semibold text-warn">
                {room <= 0 ? `Tu plan ${planName} ya llegó a su tope de clientes.` : `Tu plan ${planName} tiene lugar para ${room} ${room === 1 ? 'cliente' : 'clientes'} más y el archivo trae ${preview.ok}.`} Pasate a un plan más grande o importá menos.
              </p>
              <ButtonLink href="/app/configuracion#tu-plan">Ver planes</ButtonLink>
            </div>
          ) : (
            <p className="text-[13.5px] text-muted">
              Les van a llegar los avisos por email cuando tengan cobros. Si a alguno no querés avisarle, lo cambiás en su ficha.
            </p>
          )}
          <Button type="button" size="lg" onClick={submit} loading={pending} disabled={!preview.ok || tooMany} className={cn('w-full sm:w-auto sm:self-start')}>
            {pending ? 'Importando…' : `Importar ${preview.ok} ${preview.ok === 1 ? 'cliente' : 'clientes'}`}
          </Button>
        </section>
      )}
    </div>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: 'ok' | 'warn' | 'muted' }) {
  return (
    <div className={cn('rounded-[14px] p-3', tone === 'ok' ? 'bg-ok-soft text-ok' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted')}>
      <p className="money text-[26px] leading-none">{n}</p>
      <p className="mt-1 text-[12.5px] font-bold">{label}</p>
    </div>
  )
}
