import type { ChatRequest, ChatMessage } from '../../shared/types'
import modelscopeService from './ModelScopeService.ts'
import ragService from './RAGService.ts'
import thinkingService from './ThinkingService.ts'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 会话存储
const sessions = new Map<string, ChatMessage[]>()

export interface ProcessChatOptions extends ChatRequest {
  // 可以包含额外选项
}

export class ChatService {
  private systemPrompt = `你是一位充满耐心、善于引导的学科辅导老师，名为"学小思"。

你的教学理念：
1. 苏格拉底式教学 - 通过提问引导学生独立思考，而不是直接给出答案
2. 直观讲解 - 用生动形象的比喻和例子帮助理解抽象概念
3. 循序渐进 - 根据学生的理解程度调整讲解深度和节奏
4. 鼓励探索 - 培养学生的好奇心和探索精神

你的回答风格：
- 使用温暖、鼓励的语气
- 多用提问而非陈述
- 适时给予肯定和鼓励
- 用生活化的例子解释抽象概念
- 当学生困惑时，提供渐进式提示

你的职责：
1. 讲解数学、物理、化学、生物等学科的定理和原理
2. 通过提问引导学生思考
3. 识别学生的困惑点并针对性讲解
4. 提供例题和应用场景帮助学生理解
5. 培养学生的逻辑思维和问题解决能力

题目解析能力（当用户上传题目图片时）：
1. 仔细观察图片中的题目，识别题型和考查的知识点
2. 分析解题思路，找出关键步骤
3. 用清晰的步骤展示解题过程，每一步都要说明理由
4. 重要公式使用 LaTeX 格式展示（如 $E=mc^2$、$a^2+b^2=c^2$）
5. 最后给出简洁明确的答案
6. 如果有多种解法，可以展示不同方法供参考

重要原则：
- 一般情况下不要直接给出答案，而是引导学生自己发现
- **当用户上传题目图片请求解析时，请直接给出详细的解题步骤和答案**
- 当学生完全无法理解时，可以提供更多提示
- 讲解定理时，先讲直观理解，再讲严谨证明
- 多问"为什么"、"如果...会怎样"等问题
- 鼓励学生用自己的话解释概念

请用简明易懂的语言回答，避免过多专业术语。如果需要使用术语，请先解释。`

  /**
   * 将图片路径转换为 base64 格式
   */
  private convertImageToBase64(imagePath: string): string {
    try {
      // 处理相对路径
      const fullPath = imagePath.startsWith('http')
        ? imagePath // 如果已经是完整URL，直接返回（外部URL）
        : path.join(__dirname, '../../../public', imagePath)

      // 读取文件并转换为 base64
      const imageBuffer = fs.readFileSync(fullPath)
      const ext = path.extname(fullPath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      }
      const mimeType = mimeMap[ext] || 'image/png'

      return `data:${mimeType};base64,${imageBuffer.toString('base64')}`
    } catch (error) {
      console.error('[Chat] Error converting image to base64:', error)
      throw new Error(`Failed to convert image: ${imagePath}`)
    }
  }

  /**
   * 处理对话请求
   */
  async processChat(request: ChatRequest): Promise<{
    response: string
    thinking?: string
    relatedTheorems?: any[]
    socraticQuestions?: string[]
  }> {
    const { message, images, subject, topic, sessionId, conversationHistory, userProfile, apiKeys } = request

    // 设置API密钥
    if (apiKeys?.modelScopeApiKey) {
      ragService.setApiKey(apiKeys.modelScopeApiKey)
    }

    // 1. 获取或创建会话历史
    let history = sessions.get(sessionId) || []
    if (conversationHistory) {
      history = conversationHistory
    }

    // 2. 构建用户消息内容（支持多模态）
    let userContent: any = message

    // 如果有图片，构建多模态内容（使用标准 OpenAI 格式）
    if (images && images.length > 0) {
      userContent = [
        { type: 'text', text: message || '请仔细观察这道题目，给出详细的解题步骤和答案' }
      ]
      // 添加图片（尝试使用 base64 格式）
      for (const imageUrl of images) {
        const base64Image = this.convertImageToBase64(imageUrl)
        console.log('[Chat] Using base64 image, length:', base64Image.length)
        userContent.push({
          type: 'image_url',
          image_url: {
            url: base64Image  // 保留完整的 data:image/png;base64, 前缀
          }
        })
      }
    }

    // 3. 检索相关知识（可选，失败不影响对话）
    let ragContext = ''
    let relatedTheorems: any[] = []
    try {
      ragContext = await ragService.buildRAGContext(message, subject)
      // 4. 获取相关定理（用于返回前端）
      relatedTheorems = await ragService.retrieveDocuments(message, 3, subject)
    } catch (error) {
      console.warn('[Chat] RAG context retrieval failed, continuing without RAG:', error)
    }

    // 5. 分析思考引导
    const currentTheorem = relatedTheorems.length > 0 ? relatedTheorems[0] : undefined
    const thinkingResult = thinkingService.analyzeUserQuestion(message, currentTheorem)

    // 6. 构建消息列表
    const messages: ChatMessage[] = [
      { id: 'system', role: 'system', content: this.systemPrompt, timestamp: Date.now() }
    ]

    // 添加RAG上下文
    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`
    }

    // 添加教学指导
    if (thinkingResult.questions.length > 0) {
      messages[0].content += `\n\n针对此问题，你可以引导学生思考以下问题：\n${thinkingResult.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    }

    // 添加历史消息（过滤掉多模态格式，只保留纯文本）
    for (const msg of history) {
      // 如果 content 是数组（多模态格式），跳过或转换为纯文本
      if (Array.isArray(msg.content)) {
        // 尝试提取文本内容
        const textContent = msg.content.find((item: any) => item.type === 'text')
        if (textContent && textContent.text) {
          messages.push({
            id: msg.id,
            role: msg.role,
            content: textContent.text,
            timestamp: msg.timestamp
          })
        }
        // 如果没有文本内容，跳过这条消息
      } else if (typeof msg.content === 'string' && msg.content) {
        // 纯文本消息，直接添加
        messages.push(msg)
      }
    }

    // 添加当前用户消息（支持多模态）
    messages.push({
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now()
    })

    // 6. 调用AI生成回复（传入API密钥）
    const response = await modelscopeService.chat({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.8,
      maxTokens: 1500,
      enableThinking: false,
      apiKey: apiKeys?.modelScopeApiKey
    })

    // 7. 更新会话历史
    history.push({
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now()
    })
    history.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    })
    sessions.set(sessionId, history.slice(-20)) // 只保留最近20条

    return {
      response,
      relatedTheorems: relatedTheorems.map(t => ({
        id: t.id,
        theorem: t.theorem,
        description: t.description,
        relevanceScore: (t as any).relevanceScore || 0
      })),
      socraticQuestions: thinkingResult.questions
    }
  }

  /**
   * 流式处理对话请求
   */
  async *processChatStream(request: ChatRequest): AsyncGenerator<string> {
    const { message, images, subject, sessionId, conversationHistory, apiKeys } = request

    // 设置API密钥
    if (apiKeys?.modelScopeApiKey) {
      ragService.setApiKey(apiKeys.modelScopeApiKey)
    }

    // 1. 获取会话历史
    let history = sessions.get(sessionId) || []
    if (conversationHistory) {
      history = conversationHistory
    }

    // 2. 构建用户消息内容（支持多模态）
    let userContent: any = message

    // 如果有图片，构建多模态内容（使用标准 OpenAI 格式）
    if (images && images.length > 0) {
      userContent = [
        { type: 'text', text: message || '请仔细观察这道题目，给出详细的解题步骤和答案' }
      ]
      // 添加图片（尝试使用 base64 格式）
      for (const imageUrl of images) {
        const base64Image = this.convertImageToBase64(imageUrl)
        console.log('[Chat] Using base64 image, length:', base64Image.length)
        userContent.push({
          type: 'image_url',
          image_url: {
            url: base64Image  // 保留完整的 data:image/png;base64, 前缀
          }
        })
      }
    }

    // 3. 检索相关知识（可选，失败不影响对话）
    let ragContext = ''
    try {
      ragContext = await ragService.buildRAGContext(message, subject)
    } catch (error) {
      console.warn('[Chat] RAG context retrieval failed, continuing without RAG:', error)
    }

    // 4. 构建消息列表
    const messages: any[] = [
      { role: 'system', content: this.systemPrompt }
    ]

    if (ragContext) {
      messages[0].content += `\n\n${ragContext}`
    }

    // 添加历史消息（过滤掉多模态格式，只保留纯文本）
    for (const msg of history) {
      // 如果 content 是数组（多模态格式），跳过或转换为纯文本
      if (Array.isArray(msg.content)) {
        // 尝试提取文本内容
        const textContent = msg.content.find((item: any) => item.type === 'text')
        if (textContent && textContent.text) {
          messages.push({
            role: msg.role,
            content: textContent.text
          })
        }
        // 如果没有文本内容，跳过这条消息
      } else if (typeof msg.content === 'string' && msg.content) {
        // 纯文本消息，直接添加
        messages.push({
          role: msg.role,
          content: msg.content
        })
      }
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: userContent
    })

    // 4. 流式生成回复（传入API密钥）
    const stream = modelscopeService.chatStream({
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.8,
      maxTokens: 1500,
      enableThinking: false,
      apiKey: apiKeys?.modelScopeApiKey
    })

    let fullResponse = ''
    for await (const chunk of stream) {
      fullResponse += chunk
      yield chunk
    }

    // 5. 更新会话历史（保存多模态内容）
    history.push({
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now()
    })
    history.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now()
    })
    sessions.set(sessionId, history.slice(-20))
  }

  /**
   * 清除会话历史
   */
  clearSession(sessionId: string): void {
    sessions.delete(sessionId)
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(sessionId: string): ChatMessage[] {
    return sessions.get(sessionId) || []
  }

  /**
   * 获取所有会话ID
   */
  getAllSessionIds(): string[] {
    return Array.from(sessions.keys())
  }
}

export default new ChatService()
