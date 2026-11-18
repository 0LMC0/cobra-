import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { buildWhatsAppMessage, toWhatsAppNumber, whatsAppLink, type WhatsAppMessageInput } from '@/domain/whatsapp'

/** Logo de WhatsApp (marca registrada de Meta), dibujado en línea. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.24 8.24 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  )
}

type Props = {
  phone: string | null | undefined
  message: WhatsAppMessageInput
  className?: string
  compact?: boolean
  /** Plan Gratis sin cupo: se ve, pero con candado y lleva a los planes. */
  locked?: boolean
  /** Cobro al que corresponde: con esto el toque queda registrado (historial y cupo de Gratis). */
  chargeId?: string
  /** Plan Gratis: cuántos le quedan este mes. null = sin tope. */
  remaining?: number | null
}

/**
 * "Con un toque": abre el WhatsApp de quien cobra con el chat del cliente y el
 * mensaje ya escrito. El envío lo hace la persona; Cobra+ no manda nada sola.
 */
export function WhatsAppButton({ phone, message, className, compact, locked, chargeId, remaining = null }: Props) {
  const number = phone ? toWhatsAppNumber(phone) : null
  const label = compact ? 'WhatsApp' : 'Avisar por WhatsApp'
  const base = cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-display font-semibold whitespace-nowrap transition-colors',
    compact ? 'h-9 px-3 text-[13px]' : 'h-10 px-3.5 text-[14px]',
    className,
  )

  if (locked) {
    return (
      <Link
        href="/app/configuracion#tu-plan"
        className={cn(base, 'bg-surface text-[#128c4a] ring-1 ring-inset ring-[#25d366]/60 hover:bg-[#25d366]/10')}
        title="Usaste los 3 avisos por WhatsApp del mes. Desde Starter no tienen tope."
      >
        <Lock className="size-3.5" /> <WhatsAppIcon className="size-4" /> {compact ? 'WhatsApp' : 'WhatsApp · sin tope desde Starter'}
      </Link>
    )
  }

  if (!number) {
    return (
      <span className={cn(base, 'cursor-not-allowed bg-surface-3 text-faint')} title="Cargá el celular del cliente para avisarle por WhatsApp">
        <WhatsAppIcon className="size-4" /> Falta el celular
      </span>
    )
  }
  return (
    <a
      href={chargeId
        ? `/app/whatsapp?cobro=${chargeId}&a=${encodeURIComponent(whatsAppLink(number, buildWhatsAppMessage(message)))}`
        : whatsAppLink(number, buildWhatsAppMessage(message))}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, 'bg-[#25d366] text-[#0b3d22] shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_1px_2px_rgba(22,35,59,.15)] hover:bg-[#2fe074] active:scale-[0.98]')}
      aria-label={`${label}: se abre WhatsApp con el mensaje listo para enviar`}
    >
      <WhatsAppIcon className="size-[18px]" /> {label}
      {remaining !== null && !compact && <span className="rounded-full bg-white/50 px-1.5 text-[11.5px] font-bold">te quedan {remaining}</span>}
    </a>
  )
}
