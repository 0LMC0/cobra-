'use client'

import { useRef } from 'react'
import { switchOrganization } from '@/server/actions/organization'

/** Selector de empresa, dentro de la tarjeta de la barra lateral azul. */
export function OrgSwitcher({ memberships, activeOrgId }: { memberships: { orgId: string; name: string }[]; activeOrgId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  return (
    <form ref={formRef} action={switchOrganization}>
      <label className="sr-only" htmlFor="org-switch">Empresa activa</label>
      <select
        id="org-switch" name="orgId" defaultValue={activeOrgId}
        onChange={() => formRef.current?.requestSubmit()}
        className="w-full cursor-pointer truncate rounded-[8px] bg-transparent text-[14px] font-bold text-white focus:outline-none [&>option]:text-ink"
      >
        {memberships.map((m) => <option key={m.orgId} value={m.orgId}>{m.name}</option>)}
      </select>
      <noscript><button type="submit">Cambiar</button></noscript>
    </form>
  )
}
