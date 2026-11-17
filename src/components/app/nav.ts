import {
  BarChart3, Bell, CreditCard, FileText, Home, Repeat, Settings, Users, type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** false = todavía no construido: se muestra como "Pronto", sin link. */
  ready: boolean
  mobile?: boolean
}

export const NAV: NavItem[] = [
  { href: '/app', label: 'Inicio', icon: Home, ready: true, mobile: true },
  { href: '/app/clientes', label: 'Clientes', icon: Users, ready: true, mobile: true },
  { href: '/app/cobros', label: 'Cobros', icon: FileText, ready: true, mobile: true },
  { href: '/app/abonos', label: 'Abonos', icon: Repeat, ready: false },
  { href: '/app/pagos', label: 'Pagos', icon: CreditCard, ready: false },
  { href: '/app/recordatorios', label: 'Recordatorios', icon: Bell, ready: false },
  { href: '/app/reportes', label: 'Reportes', icon: BarChart3, ready: false },
  { href: '/app/configuracion', label: 'Configuración', icon: Settings, ready: true, mobile: true },
]
