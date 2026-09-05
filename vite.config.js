import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// PrismJS language extensions reference `Prism` as a bare global. Rolldown's CJS
// module wrapping breaks that in production — inject a local Prism per component file.
// https://github.com/mdx-editor/editor/issues/491
const prismjsGlobalShim = {
  name: 'prismjs-global-shim',
  transform(code, id) {
    if (id.includes('prismjs/components/')) {
      return { code: `var Prism = require('prismjs');\n${code}`, map: null }
    }
  },
}

export default defineConfig({
  plugins: [react(), prismjsGlobalShim],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7015',
        changeOrigin: true,
      },
    },
  },
  // Vite's preview server rejects requests whose Host header it doesn't
  // recognize (DNS-rebinding protection) -- without this, `npm start`
  // (vite preview) would 403 every request that arrives via the deployed
  // Railway domain, since it isn't localhost/127.0.0.1.
  preview: {
    allowedHosts: true,
  },
})
