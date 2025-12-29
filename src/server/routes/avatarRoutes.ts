import { Router, Request, Response } from 'express'

const router = Router()

/**
 * POST /api/avatar/token
 * 获取数字人访问令牌（实际使用前端环境变量中的 App Secret）
 */
router.post('/token', async (req: Request, res: Response) => {
  try {
    // 实际令牌由前端使用环境变量中的 APP_ID 和 APP_SECRET
    // 这里仅返回配置信息
    res.json({
      success: true,
      data: {
        sdkVersion: '0.1.0-alpha.45',
        gatewayServer: process.env.XMOV_GATEWAY_SERVER || 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session'
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TOKEN_ERROR',
        message: error.message || '获取令牌时发生错误'
      }
    })
  }
})

/**
 * POST /api/avatar/speak
 * 控制数字人说话（由前端直接调用SDK，此接口用于日志记录）
 */
router.post('/speak', async (req: Request, res: Response) => {
  try {
    const { text, action } = req.body

    // 记录数字人说话日志
    console.log(`[Avatar] Speaking: ${text?.substring(0, 50)}...`)
    if (action) {
      console.log(`[Avatar] Action: ${action}`)
    }

    res.json({
      success: true,
      message: '语音指令已记录'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SPEAK_ERROR',
        message: error.message || '处理语音指令时发生错误'
      }
    })
  }
})

export default router
