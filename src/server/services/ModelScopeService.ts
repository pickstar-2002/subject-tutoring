import axios from 'axios'
import type { ChatMessage, ApiKeys } from '../../shared/types'

export interface ChatStreamOptions {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  enableThinking?: boolean
  apiKey?: string // 可选的动态API密钥
}

export class ModelScopeService {
  private defaultApiKey: string
  private baseURL: string = 'https://api-inference.modelscope.cn/v1'
  private model: string
  private embeddingModel: string

  constructor() {
    this.defaultApiKey = process.env.MODELSCOPE_API_KEY || ''
    // 直接使用支持视觉的多模态模型
    this.model = 'Qwen/Qwen3-VL-235B-A22B-Instruct'
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B'

    console.log('[ModelScope] Initialized')
    console.log('[ModelScope] Chat Model:', this.model)
    console.log('[ModelScope] Embedding Model:', this.embeddingModel)
    console.log('[ModelScope] Default API Key:', !!this.defaultApiKey)
  }

  /**
   * 获取API密钥（优先使用传入的密钥）
   * ModelScope API 密钥保留 ms- 前缀
   */
  private getApiKey(providedKey?: string): string {
    return providedKey || this.defaultApiKey
  }

  /**
   * 普通对话
   */
  async chat(options: ChatStreamOptions): Promise<string> {
    const requestId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`\n[ModelScope] ========== Chat Request (${requestId}) ==========`)
    console.log('[ModelScope] URL:', `${this.baseURL}/chat/completions`)
    console.log('[ModelScope] Model:', this.model)
    console.log('[ModelScope] Messages count:', options.messages?.length)
    console.log('[ModelScope] Temperature:', options.temperature || 0.7)
    console.log('[ModelScope] Max tokens:', options.maxTokens || 2000)
    console.log('[ModelScope] Thinking mode:', options.enableThinking === true ? 'ENABLED' : 'DISABLED')
    console.log('[ModelScope] Using custom API key:', !!options.apiKey)

    try {
      const apiKey = this.getApiKey(options.apiKey)

      if (!apiKey) {
        console.error('[ModelScope] Error: API密钥未配置')
        throw new Error('ModelScope API密钥未配置')
      }

      console.log('[ModelScope] API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 6))

      // 构建请求体
      // 注意：enable_thinking 应该直接放在请求体的顶层，而不是嵌套在 extra_body 中
      const requestBody: any = {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000
      }

      // 启用思考模式（直接放在请求体顶层）
      if (options.enableThinking === true) {
        requestBody.enable_thinking = true
      }

      console.log('[ModelScope] Request body:', JSON.stringify(requestBody, null, 2))
      console.log('[ModelScope] Sending request...')

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      console.log('[ModelScope] Response status:', response.status)
      console.log('[ModelScope] Response headers:', JSON.stringify(response.headers, null, 2))
      console.log('[ModelScope] Response data:', JSON.stringify(response.data, null, 2))

      const content = response.data.choices[0]?.message?.content
      console.log('[ModelScope] Extracted content length:', content?.length || 0)
      console.log(`[ModelScope] ========== Chat Request Complete (${requestId}) ==========\n`)

      return content
    } catch (error: any) {
      const elapsed = Date.now() - startTime
      console.error(`[ModelScope] ========== Chat Error (${requestId}) ==========`)
      const errorMessage = String(error.message || 'Unknown error')
      console.error('[ModelScope] Error message:', errorMessage)
      console.error('[ModelScope] Error code:', String(error.code || 'UNKNOWN'))
      if (error.response) {
        console.error('[ModelScope] Response status:', error.response.status)
        console.error('[ModelScope] Response status text:', error.response.statusText)
        // 尝试读取响应数据
        try {
          if (typeof error.response.data === 'string') {
            console.error('[ModelScope] Response data (string):', error.response.data)
          } else if (error.response.data) {
            console.error('[ModelScope] Response data:', JSON.stringify(error.response.data, null, 2))
          }
        } catch (e) {
          console.error('[ModelScope] Response data (raw):', String(error.response.data))
        }
      }
      console.error(`[ModelScope] ========== End Error (${requestId}) ==========\n`)
      throw new Error(errorMessage)
    }
  }

  /**
   * 流式对话（支持思考模式）
   */
  async *chatStream(options: ChatStreamOptions): AsyncGenerator<string, void, unknown> {
    const requestId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`\n[ModelScope] ========== Stream Request (${requestId}) ==========`)
    console.log('[ModelScope] URL:', `${this.baseURL}/chat/completions`)
    console.log('[ModelScope] Model:', this.model)
    console.log('[ModelScope] Messages count:', options.messages?.length)
    console.log('[ModelScope] Temperature:', options.temperature || 0.7)
    console.log('[ModelScope] Max tokens:', options.maxTokens || 2000)
    console.log('[ModelScope] Thinking mode:', options.enableThinking === true ? 'ENABLED' : 'DISABLED')
    console.log('[ModelScope] Using custom API key:', !!options.apiKey)

    let chunkCount = 0
    let totalChars = 0
    const startTime = Date.now()

    try {
      const apiKey = this.getApiKey(options.apiKey)

      if (!apiKey) {
        console.error('[ModelScope] Error: API密钥未配置')
        throw new Error('ModelScope API密钥未配置')
      }

      console.log('[ModelScope] API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 6))

      // 构建请求体
      const requestBody: any = {
        model: this.model,
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2000,
        stream: true
      }

      // 启用思考模式（直接放在请求体顶层）
      if (options.enableThinking === true) {
        requestBody.enable_thinking = true
      }

      console.log('[ModelScope] Request body:', JSON.stringify(requestBody, null, 2))
      console.log('[ModelScope] Sending stream request...')

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 60000
        }
      )

      // 检查HTTP状态码
      if (response.status !== 200) {
        console.error('[ModelScope] HTTP Error:', response.status)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      console.log('[ModelScope] Stream connected, receiving data...')
      console.log('[ModelScope] Response headers:', JSON.stringify(response.headers, null, 2))

      const stream = response.data

      for await (const chunk of stream) {
        const chunkStr = chunk.toString()
        console.log('[ModelScope] Raw chunk received:', chunkStr.substring(0, 200))
        const lines = chunkStr.split('\n').filter((line: string) => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            console.log('[ModelScope] Parsed data:', data.substring(0, 200))
            if (data === '[DONE]') {
              console.log('[ModelScope] Stream received [DONE] signal')
              break
            }

            try {
              const parsed = JSON.parse(data)
              console.log('[ModelScope] Parsed JSON:', JSON.stringify(parsed, null, 2).substring(0, 500))
              chunkCount++

              // 处理思考过程
              const thinkingContent = parsed.choices[0]?.delta?.reasoning_content
              if (thinkingContent) {
                console.log('[ModelScope] [Thinking chunk]', thinkingContent.substring(0, 50) + '...')
              }

              // 处理最终回复
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                totalChars += content.length
                if (chunkCount % 10 === 0) {
                  console.log('[ModelScope] Progress:', chunkCount, 'chunks,', totalChars, 'chars')
                }
                yield content
              }
            } catch (e: any) {
              console.warn('[ModelScope] Failed to parse stream chunk:', e.message)
              console.warn('[ModelScope] Raw data that failed to parse:', data)
            }
          }
        }
      }

      const elapsed = Date.now() - startTime
      console.log('[ModelScope] Stream complete:', chunkCount, 'chunks,', totalChars, 'chars in', elapsed, 'ms')
      console.log(`[ModelScope] ========== Stream Request Complete (${requestId}) ==========\n`)
    } catch (error: any) {
      const elapsed = Date.now() - startTime
      console.error(`[ModelScope] ========== Stream Error (${requestId}) ==========`)
      const errorMessage = String(error.message || 'Unknown error')
      const errorCode = String(error.code || 'UNKNOWN')
      console.error('[ModelScope] Error message:', errorMessage)
      console.error('[ModelScope] Error code:', errorCode)
      console.error('[ModelScope] Progress before error:', chunkCount, 'chunks,', totalChars, 'chars')
      if (error.response) {
        console.error('[ModelScope] Response status:', error.response.status)
        console.error('[ModelScope] Response status text:', error.response.statusText)
        // 尝试解析响应数据
        try {
          if (typeof error.response.data === 'string') {
            console.error('[ModelScope] Response data (string):', error.response.data)
          } else if (error.response.data) {
            console.error('[ModelScope] Response data:', JSON.stringify(error.response.data))
          }
        } catch (e) {
          console.error('[ModelScope] Response data (raw):', String(error.response.data))
        }
        console.error('[ModelScope] Response headers:', JSON.stringify(error.response.headers))
      }
      console.error('[ModelScope] Elapsed time before error:', elapsed, 'ms')
      console.error(`[ModelScope] ========== End Error (${requestId}) ==========\n`)
      throw new Error(errorMessage)
    }
  }

  /**
   * 生成文本向量嵌入
   */
  async generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
    const requestId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`\n[ModelScope] ========== Embedding Request (${requestId}) ==========`)
    console.log('[ModelScope] URL:', `${this.baseURL}/embeddings`)
    console.log('[ModelScope] Model:', this.embeddingModel)
    console.log('[ModelScope] Input text length:', text.length)
    console.log('[ModelScope] Input preview:', text.substring(0, 100) + (text.length > 100 ? '...' : ''))

    const startTime = Date.now()

    try {
      const key = this.getApiKey(apiKey)

      if (!key) {
        console.error('[ModelScope] Error: API密钥未配置')
        throw new Error('ModelScope API密钥未配置')
      }

      console.log('[ModelScope] API Key:', key.substring(0, 10) + '...' + key.substring(key.length - 6))

      console.log('[ModelScope] Sending embedding request...')

      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: this.embeddingModel,
          input: text,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      const elapsed = Date.now() - startTime
      console.log('[ModelScope] Response status:', response.status)
      console.log('[ModelScope] Embedding dimension:', response.data.data[0].embedding.length)
      console.log('[ModelScope] Request completed in', elapsed, 'ms')
      console.log(`[ModelScope] ========== Embedding Request Complete (${requestId}) ==========\n`)

      return response.data.data[0].embedding
    } catch (error: any) {
      const elapsed = Date.now() - startTime
      console.error(`[ModelScope] ========== Embedding Error (${requestId}) ==========`)
      const errorMessage = String(error.message || 'Unknown error')
      console.error('[ModelScope] Error message:', errorMessage)
      console.error('[ModelScope] Error code:', String(error.code || 'UNKNOWN'))
      console.error('[ModelScope] Elapsed time before error:', elapsed, 'ms')
      if (error.response) {
        console.error('[ModelScope] Response status:', error.response.status)
        console.error('[ModelScope] Response data:', String(error.response.data || 'No data'))
      }
      console.error(`[ModelScope] ========== End Error (${requestId}) ==========\n`)
      throw new Error(errorMessage)
    }
  }

  /**
   * 批量生成向量嵌入
   */
  async generateEmbeddingsBatch(texts: string[], apiKey?: string): Promise<number[][]> {
    const requestId = `batch_embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log(`\n[ModelScope] ========== Batch Embedding Request (${requestId}) ==========`)
    console.log('[ModelScope] URL:', `${this.baseURL}/embeddings`)
    console.log('[ModelScope] Model:', this.embeddingModel)
    console.log('[ModelScope] Batch size:', texts.length)
    console.log('[ModelScope] Total text length:', texts.reduce((sum, t) => sum + t.length, 0))

    const startTime = Date.now()

    try {
      const key = this.getApiKey(apiKey)

      if (!key) {
        console.error('[ModelScope] Error: API密钥未配置')
        throw new Error('ModelScope API密钥未配置')
      }

      console.log('[ModelScope] API Key:', key.substring(0, 10) + '...' + key.substring(key.length - 6))

      console.log('[ModelScope] Sending batch embedding request...')

      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model: this.embeddingModel,
          input: texts,
          encoding_format: 'float'
        },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      )

      const elapsed = Date.now() - startTime
      console.log('[ModelScope] Response status:', response.status)
      console.log('[ModelScope] Embedding dimension:', response.data.data[0].embedding.length)
      console.log('[ModelScope] Total embeddings:', response.data.data.length)
      console.log('[ModelScope] Request completed in', elapsed, 'ms')
      console.log(`[ModelScope] ========== Batch Embedding Request Complete (${requestId}) ==========\n`)

      return response.data.data.map((item: any) => item.embedding)
    } catch (error: any) {
      const elapsed = Date.now() - startTime
      console.error(`[ModelScope] ========== Batch Embedding Error (${requestId}) ==========`)
      const errorMessage = String(error.message || 'Unknown error')
      console.error('[ModelScope] Error message:', errorMessage)
      console.error('[ModelScope] Error code:', String(error.code || 'UNKNOWN'))
      console.error('[ModelScope] Elapsed time before error:', elapsed, 'ms')
      if (error.response) {
        console.error('[ModelScope] Response status:', error.response.status)
        console.error('[ModelScope] Response data:', String(error.response.data || 'No data'))
      }
      console.error(`[ModelScope] ========== End Error (${requestId}) ==========\n`)
      throw new Error(errorMessage)
    }
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('向量长度不一致')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }
}

export default new ModelScopeService()
