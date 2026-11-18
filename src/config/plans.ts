/**
 * Planes de Cobra+. Precios y límites configurables desde acá; el servidor es el
 * que los hace cumplir (nunca sólo la UI).
 */
export type PlanId = 'starter' | 'growth' | 'business'
export type BillingInterval = 'month' | 'year'
export type Currency = 'ARS' | 'USD'

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  priceUsdMonthly: number
  /** Precio de lista en pesos argentinos (enteros). Se fija a mano: no es una conversión en vivo. */
  priceArsMonthly: number
  limits: { activeCustomers: number; seats: number }
  features: { label: string; available: boolean }[]
  highlighted?: boolean
}

export const ANNUAL_DISCOUNT = 0.2

/**
 * Referencia con la que se armó la lista en pesos: dólar oficial (Banco Nación,
 * venta) de la primera semana de noviembre de 2026, redondeado a un precio
 * terminado en 900. Revisar la lista cada trimestre.
 */
export const ARS_PRICE_REFERENCE = { usdRate: 1570, date: '2026-11-07' } as const
export const TRIAL_DAYS = 14

/** Plan de cada empresa. Sin suscripción paga, es 'free'. */
export type PlanTier = 'free' | PlanId

/**
 * Plan Gratis: súper básico, para siempre. Lo que lo limita son los avisos
 * automáticos por mes; el botón de WhatsApp no cuenta (lo manda la persona).
 */
export const FREE_PLAN = {
  id: 'free' as const,
  name: 'Gratis',
  tagline: 'Para probarlo con tus primeros 5 clientes.',
  features: [
    { label: '10 avisos automáticos por mes', available: true },
    { label: 'Hasta 5 clientes activos', available: true },
    { label: 'Panel de cobranzas y vencimientos', available: true },
    { label: 'Historial de cada cliente', available: true },
    { label: 'Importar clientes desde Excel', available: true },
    { label: '1 usuario', available: true },
    { label: 'Avisar por WhatsApp con un toque: 3 por mes', available: true },
  ],
}

/** Qué incluye cada plan. El servidor lo hace cumplir donde importa (exportar, avisos). */
export type PlanFeature = 'whatsapp' | 'csvExport'
const FEATURE_FROM: Record<PlanFeature, PlanTier> = { whatsapp: 'starter', csvExport: 'growth' }
const TIER_RANK: Record<PlanTier, number> = { free: 0, starter: 1, growth: 2, business: 3 }

export function planIncludes(plan: PlanTier, feature: PlanFeature): boolean {
  return TIER_RANK[plan] >= TIER_RANK[FEATURE_FROM[feature]]
}

/** El plan más barato que incluye esa función (para el candado: "Disponible en Starter"). */
export function planFor(feature: PlanFeature): PlanTier {
  return FEATURE_FROM[feature]
}

/** Avisos por WhatsApp con un toque por mes. null = sin tope. En Gratis, para probarlo. */
export const MONTHLY_WHATSAPP: Record<PlanTier, number | null> = {
  free: 3,
  starter: null,
  growth: null,
  business: null,
}

/** Avisos automáticos por mes según el plan. null = sin tope. */
export const MONTHLY_REMINDERS: Record<PlanTier, number | null> = {
  free: 10,
  starter: null,
  growth: null,
  business: null,
}

/** Clientes activos (no archivados) según el plan. Archivar libera lugar. */
export const ACTIVE_CUSTOMERS: Record<PlanTier, number> = {
  free: 5,
  starter: 30,
  growth: 200,
  business: 1000,
}

/** null si entra uno más; si no, el mensaje para la persona. */
export function customerLimitError(plan: PlanTier, activeNow: number): string | null {
  const max = ACTIVE_CUSTOMERS[plan]
  if (activeNow < max) return null
  const next = plan === 'free' ? 'Starter' : plan === 'starter' ? 'Growth' : plan === 'growth' ? 'Business' : null
  return `Tu plan ${PLAN_NAME[plan]} llega hasta ${max.toLocaleString('es-AR')} clientes activos.`
    + (next ? ` Archivá los que ya no te deben o pasate a ${next}.` : ' Archivá los que ya no te deben o escribinos.')
}

export const PLAN_NAME: Record<PlanTier, string> = { free: 'Gratis', starter: 'Starter', growth: 'Growth', business: 'Business' }

export function isPlanTier(v: unknown): v is PlanTier {
  return typeof v === 'string' && v in MONTHLY_REMINDERS
}

export const PLANS: readonly Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Para profesionales independientes.',
    priceUsdMonthly: 12,
    priceArsMonthly: 18_900,
    limits: { activeCustomers: 30, seats: 1 },
    highlighted: true,
    features: [
      { label: 'Avisos automáticos por email sin tope', available: true },
      { label: 'Avisar por WhatsApp con un toque, sin tope', available: true },
      { label: 'Hasta 30 clientes activos', available: true },
      { label: 'Cobros únicos y recurrentes', available: true },
      { label: 'Panel de cobranzas y vencimientos', available: true },
      { label: '1 usuario', available: true },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'Para pequeñas empresas.',
    priceUsdMonthly: 29,
    priceArsMonthly: 45_900,
    limits: { activeCustomers: 200, seats: 2 },
    features: [
      { label: 'Todo lo de Starter', available: true },
      { label: 'Hasta 200 clientes activos', available: true },
      { label: 'Exportar clientes, cobros y pagos a Excel (CSV)', available: true },
      { label: 'Elegir los días de cada aviso', available: false },
      { label: 'Hasta 2 usuarios', available: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Para equipos.',
    priceUsdMonthly: 69,
    priceArsMonthly: 108_900,
    limits: { activeCustomers: 1000, seats: 5 },
    features: [
      { label: 'Hasta 1.000 clientes activos', available: true },
      { label: 'Hasta 5 usuarios con roles', available: false },
      { label: 'Todo lo de Growth', available: true },
      { label: 'Soporte prioritario', available: true },
      { label: 'Portal de clientes', available: false },
      { label: 'API e integraciones', available: false },
    ],
  },
]

export function getPlan(id: PlanId): Plan {
  const p = PLANS.find((x) => x.id === id)
  if (!p) throw new Error(`Plan desconocido: ${id}`)
  return p
}

/**
 * Precio mensual en la moneda pedida. Pagando anual aplica el descuento:
 * en dólares se redondea a centavos y en pesos, a pesos enteros.
 */
export function monthlyPriceFor(plan: Plan, interval: BillingInterval, currency: Currency = 'USD'): number {
  const base = currency === 'ARS' ? plan.priceArsMonthly : plan.priceUsdMonthly
  if (interval === 'month') return base
  const discounted = base * (1 - ANNUAL_DISCOUNT)
  return currency === 'ARS' ? Math.round(discounted) : Math.round(discounted * 100) / 100
}

/** Total del año pagando anual, en la moneda pedida. */
export function yearlyTotalFor(plan: Plan, currency: Currency = 'USD'): number {
  const total = monthlyPriceFor(plan, 'year', currency) * 12
  return currency === 'ARS' ? Math.round(total) : Math.round(total * 100) / 100
}

/** Sólo el número: pesos sin decimales; dólares con dos decimales si no es entero. */
export function formatPlanAmount(amount: number, currency: Currency): string {
  const digits = currency === 'USD' && !Number.isInteger(amount) ? 2 : 0
  return new Intl.NumberFormat('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount)
}

/** "$ 18.900" en pesos y "US$ 12" en dólares, con formato argentino. */
export function formatPlanPrice(amount: number, currency: Currency): string {
  return `${currency === 'ARS' ? '$' : 'US$'} ${formatPlanAmount(amount, currency)}`
}

/** Durante el trial se usan los límites de Growth. */
export const TRIAL_PLAN: PlanId = 'growth'
