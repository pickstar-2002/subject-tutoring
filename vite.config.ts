import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 原生Vite插件集成后端
function backendPlugin() {
  return {
    name: 'backend-server',
    async configureServer(server: any) {
      console.log('[Vite] 正在配置后端 API...')

      try {
        // 导入 app
        const app = (await import('./src/server/app.ts')).default

        server.middlewares.use((req: any, res: any, next: any) => {
          if (req.url?.startsWith('/api') || req.url === '/health') {
            app(req, res, next)
          } else {
            next()
          }
        })

        console.log('[Vite] 后端 API 集成完成')
      } catch (error) {
        console.error('[Vite] 后端初始化失败:', error)
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), backendPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  server: {
    port: 5175,
    host: true,
    strictPort: false
  }
})
