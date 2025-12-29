import type { ChatRequest, ChatResponse } from '@shared/types'
import { useApiKeyStore } from '../store'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 增强请求，添加API密钥
 */
function enhanceRequest(request: ChatRequest): ChatRequest {
  const apiKeys = useApiKeyStore.getState()
  return {
    ...request,
    apiKeys: {
      modelScopeApiKey: apiKeys.modelScopeApiKey,
      xmovAppId: apiKeys.xmovAppId,
      xmovAppSecret: apiKeys.xmovAppSecret
    }
  }
}

/**
 * 发送对话消息（非流式）
 */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const enhancedRequest = enhanceRequest(request)
    const response = await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enhancedRequest)
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    return {
      success: false,
      error: error.message || '网络请求失败'
    }
  }
}

/**
 * 流式发送对话消息（SSE）
 */
export async function sendMessageStream(
  request: ChatRequest,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void
): Promise<() => void> {
  const controller = new AbortController()

  try {
    const enhancedRequest = enhanceRequest(request)
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enhancedRequest),
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let fullResponse = ''

    const read = async (): Promise<void> => {
      const { done, value } = await reader.read()

      if (done) {
        onComplete(fullResponse)
        return
      }

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'content') {
              fullResponse += parsed.data
              onChunk(parsed.data)
            } else if (parsed.type === 'end') {
              onComplete(fullResponse)
              return
            } else if (parsed.type === 'error') {
              onError(parsed.data)
              return
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }

      // 继续读取
      return read()
    }

    read().catch((error) => {
      onError(error.message || '流式请求失败')
    })
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      onError(error.message || '流式请求失败')
    }
  }

  // 返回取消函数
  return () => controller.abort()
}

/**
 * 清除会话历史
 */
export async function clearSession(sessionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/chat/session/${sessionId}`, {
      method: 'DELETE'
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Clear session error:', error)
    return false
  }
}

export default {
  sendMessage,
  sendMessageStream,
  clearSession
}
