import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode)
  
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        'process.env.DB_SERVER': JSON.stringify(env.VITE_DB_SERVER || process.env.DB_SERVER),
        'process.env.DB_PORT': JSON.stringify(env.VITE_DB_PORT || process.env.DB_PORT),
        'process.env.DB_DATABASE': JSON.stringify(env.VITE_DB_DATABASE || process.env.DB_DATABASE),
        'process.env.DB_USER': JSON.stringify(env.VITE_DB_USER || process.env.DB_USER),
        'process.env.DB_PASSWORD': JSON.stringify(env.VITE_DB_PASSWORD || process.env.DB_PASSWORD),
        'process.env.DB_TRUST_SERVER_CERTIFICATE': JSON.stringify(
        env.VITE_DB_TRUST_SERVER_CERTIFICATE || process.env.DB_TRUST_SERVER_CERTIFICATE
        )
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [react(), tailwindcss()]
    }
  }
})
