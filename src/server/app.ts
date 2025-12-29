import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// 路由
import chatRoutes from './routes/chatRoutes.ts'
import knowledgeRoutes from './routes/knowledgeRoutes.ts'
import avatarRoutes from './routes/avatarRoutes.ts'

// 中间件
import { errorHandler } from './middleware/errorHandler.ts'

// 加载环境变量
dotenv.config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  next()
})

// 路由
app.use('/api/chat', chatRoutes)
app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/avatar', avatarRoutes)

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'subject-tutoring',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在'
  })
})

// 错误处理
app.use(errorHandler)

// 不再单独启动服务，由 Vite 统一管理
// 只在非 Vite 环境下独立启动（用于生产环境）
if (process.env.NODE_ENV === 'production' && !process.env.VITE) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(``)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  学科辅导服务启动成功`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`  服务地址: http://localhost:${PORT}`)
    console.log(`  API 端点: http://localhost:${PORT}/api`)
    console.log(`  环境: production`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(``)
  })
}

export default app
