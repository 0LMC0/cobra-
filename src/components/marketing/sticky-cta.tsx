'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { TRIAL_DAYS } from '@/config/plans'
import { cn } from '@/lib/cn'

/** Barra fija en el celular, aparece cuando el hero ya quedó atrás. */
export function StickyCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(23,34,56,.1)] backdrop-blur-md transition-transform duration-300 md:hidden',
        show ? 'translate-y-0' : 'translate-y-[120%]',
      )}
      inert={!show}
    >
      <p className="text-[13.5px] leading-tight font-extrabold max-[359px]:hidden">
        {TRIAL_DAYS} días gratis
        <span className="block text-[12px] font-semibold text-muted">Cancelás cuando quieras</span>
      </p>
      <ButtonLink href="/registro" size="md" className="max-[359px]:w-full">
        Empezá gratis <ArrowRight className="size-4" />
      </ButtonLink>
    </div>
  )
}
