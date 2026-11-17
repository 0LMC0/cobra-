import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/db/**/*.test.ts'],
    // La base embebida tarda un par de segundos en arrancar.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    environment: 'node',
    // Cada archivo de tests/db levanta su propio Postgres embebido: con muchos en paralelo
    // la máquina se queda sin memoria y un proceso se cae. Dos a la vez es estable.
    poolOptions: { forks: { maxForks: 2 } },
  },
})
