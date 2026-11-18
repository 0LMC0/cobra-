import type { MetadataRoute } from 'next'
import { siteUrl } from '@/config/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/registro`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/legal/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/arrepentimiento`, changeFrequency: 'yearly', priority: 0.1 },
    { url: `${base}/boton-de-baja`, changeFrequency: 'yearly', priority: 0.1 },
  ]
}
