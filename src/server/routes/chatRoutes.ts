import { Router, Request, Response } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import chatService from '../services/ChatService.ts'
import modelscopeService from '../services/ModelScopeService.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// 配置 multer 用于图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('只支持图片文件'))
    }
  }
})

/**
 * POST /api/chat/upload-image
 * 上传图片
 */
router.post('/upload-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      })
    }

    // 返回图片 URL（相对于 public 目录）
    const imageUrl = `/uploads/${req.file.filename}`

    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename
    })
  } catch (error: any) {
    console.error('[Upload Image] Error:', error)
    res.status(500).json({
      success: false,
      error: error.message || '图片上传失败'
    })
  }
})

/**
 * POST /api/chat/validate-key
 * 验证 API 密钥是否有效
 */
router.post('/validate-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'API Key is required'
      })
    }

    // 测试调用 - 发送一个简单的请求来验证密钥
    try {
      const testMessage = 'Hello'
      const response = await modelscopeService.chat({
        messages: [
          { role: 'user', content: testMessage }
        ],
        temperature: 0.7,
        maxTokens: 10,
        enableThinking: false,
        apiKey: apiKey
      })

      // 如果成功返回，说明密钥有效
      return res.json({
        success: true,
        valid: true,
        message: 'API 密钥验证成功'
      })
    } catch (apiError: any) {
      // API 调用失败，密钥无效
      console.error('[Validate Key] API Error:', apiError.message)
      return res.json({
        success: true,
        valid: false,
        error: apiError.message || 'API 密钥验证失败'
      })
    }
  } catch (error: any) {
    console.error('[Validate Key] Server Error:', error)
    res.status(500).json({
      success: false,
      valid: false,
      error: error.message || '服务器错误'
    })
  }
})

/**
 * POST /api/chat/send
 * 发送对话消息（非流式）
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { message, images, subject, topic, sessionId, conversationHistory, userProfile, apiKeys } = req.body

    // 验证：要么有文字消息，要么有图片
    const hasValidMessage = message && typeof message === 'string' && message.trim()
    const hasImages = images && Array.isArray(images) && images.length > 0

    if (!hasValidMessage && !hasImages) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '消息内容不能为空'
        }
      })
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '会话ID不能为空'
        }
      })
    }

    const result = await chatService.processChat({
      message: message || '',
      images,
      subject,
      topic,
      sessionId,
      conversationHistory,
      userProfile,
      apiKeys
    })

    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('[Chat Routes] Error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: error.message || '处理对话时发生错误'
      }
    })
  }
})

/**
 * POST /api/chat/stream
 * 流式对话（SSE）
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { message, images, subject, topic, sessionId, conversationHistory, userProfile, apiKeys } = req.body

    // 验证：要么有文字消息，要么有图片
    const hasValidMessage = message && typeof message === 'string' && message.trim()
    const hasImages = images && Array.isArray(images) && images.length > 0

    if (!hasValidMessage && !hasImages) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '消息内容不能为空'
        }
      })
    }

    // 设置SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // 发送开始事件
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`)

    try {
      // 流式处理
      const stream = chatService.processChatStream({
        message: message || '',
        images,
        subject,
        topic,
        sessionId,
        conversationHistory,
        userProfile,
        apiKeys
      })

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ type: 'content', data: chunk })}\n\n`)
      }

      // 发送结束事件
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`)
    } catch (streamError: any) {
      // 只序列化错误消息，避免循环引用
      const errorMessage = streamError?.message || String(streamError)
      console.error('[Chat Routes] Stream error:', errorMessage)
      res.write(`data: ${JSON.stringify({ type: 'error', data: errorMessage })}\n\n`)
    }

    res.end()
  } catch (error: any) {
    console.error('[Chat Routes] Stream Error:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'STREAM_ERROR',
          message: error.message || '流式处理时发生错误'
        }
      })
    }
  }
})

/**
 * DELETE /api/chat/session/:sessionId
 * 清除会话历史
 */
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    chatService.clearSession(sessionId)

    res.json({
      success: true,
      message: '会话历史已清除'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEAR_SESSION_ERROR',
        message: error.message || '清除会话时发生错误'
      }
    })
  }
})

export default router
