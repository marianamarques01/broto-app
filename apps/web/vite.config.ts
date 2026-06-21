import { defineConfig, loadEnv, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN
  const sentryOrg = env.SENTRY_ORG
  const sentryProject = env.SENTRY_PROJECT
  const uploadSourceMaps = Boolean(sentryAuthToken && sentryOrg && sentryProject)

  const plugins: PluginOption[] = [react()]

  if (uploadSourceMaps) {
    plugins.push(
      sentryVitePlugin({
        org: sentryOrg,
        project: sentryProject,
        authToken: sentryAuthToken,
        sourcemaps: {
          filesToDeleteAfterUpload: ['./dist/**/*.map'],
        },
      }),
    )
  }

  return {
    plugins,
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    build: {
      sourcemap: uploadSourceMaps ? 'hidden' : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('lucide-react')) return 'lucide'
          },
        },
      },
    },
  }
})
