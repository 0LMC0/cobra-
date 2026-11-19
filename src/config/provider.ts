/**
 * Datos del proveedor del servicio (Res. 270/2020 y Ley 24.240): se muestran en el
 * pie y en los términos. Completar con los datos reales; si un campo es null no se muestra.
 */
export const PROVIDER = {
  legalName: null as string | null, // Razón social o nombre y apellido del titular
  cuit: null as string | null, // 20-12345678-9
  address: null as string | null, // Domicilio legal
  email: null as string | null, // Email de atención al cliente
}

/** Línea corta para el pie: "Titular: X · CUIT Y · Domicilio Z · Atención: W". */
export function providerLine(): string | null {
  const parts = [
    PROVIDER.legalName && `Titular: ${PROVIDER.legalName}`,
    PROVIDER.cuit && `CUIT ${PROVIDER.cuit}`,
    PROVIDER.address && `Domicilio: ${PROVIDER.address}`,
    PROVIDER.email && `Atención: ${PROVIDER.email}`,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : null
}
