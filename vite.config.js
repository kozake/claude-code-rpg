import { defineConfig } from 'vite'

export default defineConfig({
  base: '/claude-code-rpg/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
