import type { MetadataRoute } from 'next'
import { siteUrl } from '@/config/env'

/** Hasta el lanzamiento (NEXT_PUBLIC_LAUNCHED=true) el sitio no se indexa. */
export default function robots(): MetadataRoute.Robots {
  const launched = process.env.NEXT_PUBLIC_LAUNCHED === 'true'
  return launched
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/app', '/onboarding', '/auth'] }, sitemap: `${siteUrl()}/sitemap.xml` }
    : { rules: { userAgent: '*', disallow: '/' } }
}
