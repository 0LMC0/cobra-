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
  },
})
