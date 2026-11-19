/** Cada pantalla entra con un fundido corto (se vuelve a montar en cada navegación). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
