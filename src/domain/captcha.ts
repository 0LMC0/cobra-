/** Token de Cloudflare Turnstile que trae el formulario, para pasárselo a Supabase (undefined si no hay CAPTCHA). */
export function captchaFrom(formData: FormData): string | undefined {
  const t = formData.get('cf-turnstile-response')
  return typeof t === 'string' && t.length > 0 && t.length < 4096 ? t : undefined
}
