import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Theorem, Document, EmbeddingVector } from '../../shared/types'
import modelscopeService from './ModelScopeService.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../../../')

export class RAGService {
  private theorems: Map<string, Theorem> = new Map()
  private embeddings: Map<string, number[]> = new Map()
  private isInitialized = false
  private apiKey: string = ''

  /**
   * 设置API密钥
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  /**
   * 初始化知识库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[RAG] Already initialized')
      return
    }

    console.log('[RAG] Initializing knowledge base...')

    try {
      // 加载数学知识库
      await this.loadKnowledgeFile('math.json')
      // 加载物理知识库
      await this.loadKnowledgeFile('physics.json')
      // 加载化学知识库
      await this.loadKnowledgeFile('chemistry.json')
      // 加载逻辑知识库
      await this.loadKnowledgeFile('logic.json')

      console.log(`[RAG] Loaded ${this.theorems.size} theorems`)

      // 生成向量嵌入
      await this.generateEmbeddings()

      console.log(`[RAG] Generated ${this.embeddings.size} embeddings`)
      console.log('[RAG] Initialization complete!')

      this.isInitialized = true
    } catch (error) {
      console.error('[RAG] Initialization error:', error)
      throw error
    }
  }

  /**
   * 加载知识库文件
   */
  private async loadKnowledgeFile(filename: string): Promise<void> {
    const filePath = path.join(PROJECT_ROOT, 'data/knowledge', filename)

    if (!fs.existsSync(filePath)) {
      console.warn(`[RAG] Knowledge file not found: ${filename}`)
      return
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const data: Theorem[] = JSON.parse(content)

      for (const theorem of data) {
        this.theorems.set(theorem.id, theorem)
      }

      console.log(`[RAG] Loaded ${data.length} theorems from ${filename}`)
    } catch (error) {
      console.error(`[RAG] Error loading ${filename}:`, error)
    }
  }

  /**
   * 生成所有定理的向量嵌入
   */
  private async generateEmbeddings(): Promise<void> {
    const texts: Array<{ id: string; text: string }> = []

    for (const [id, theorem] of this.theorems) {
      // 组合文本用于嵌入
      const combinedText = `
${theorem.theorem}
${theorem.description}
${theorem.embeddingText}
${theorem.keywords.join(' ')}
      `.trim()

      texts.push({ id, text: combinedText })
    }

    // 批量生成嵌入（每次最多10个）
    const batchSize = 10
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchTexts = batch.map(t => t.text)

      try {
        const embeddings = await modelscopeService.generateEmbeddingsBatch(batchTexts, this.apiKey)

        for (let j = 0; j < batch.length; j++) {
          this.embeddings.set(batch[j].id, embeddings[j])
        }
      } catch (error) {
        console.error('[RAG] Error generating embeddings for batch:', error)
      }
    }
  }

  /**
   * 检索相关定理
   */
  async retrieveDocuments(query: string, topK: number = 5, category?: string): Promise<Theorem[]> {
    // 检查API密钥
    if (!this.apiKey) {
      console.warn('[RAG] No API key provided, skipping RAG retrieval')
      return []
    }

    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // 生成查询向量
      const queryEmbedding = await modelscopeService.generateEmbedding(query, this.apiKey)

      // 计算相似度
      const similarities: Array<{ id: string; score: number }> = []

      for (const [id, embedding] of this.embeddings) {
        // 按类别过滤
        if (category) {
          const theorem = this.theorems.get(id)
          if (theorem?.category !== category) continue
        }

        const score = modelscopeService.cosineSimilarity(queryEmbedding, embedding)
        similarities.push({ id, score })
      }

      // 排序并取前K个
      similarities.sort((a, b) => b.score - a.score)
      const topKResults = similarities.slice(0, topK)

      // 返回定理详情
      return topKResults
        .filter(r => r.score > 0.3) // 相似度阈值
        .map(r => ({
          ...this.theorems.get(r.id)!,
          relevanceScore: r.score
        } as any))
    } catch (error) {
      console.error('[RAG] Retrieval error:', error)
      return []
    }
  }

  /**
   * 构建RAG上下文
   */
  async buildRAGContext(query: string, category?: string): Promise<string> {
    const theorems = await this.retrieveDocuments(query, 3, category)

    if (theorems.length === 0) {
      return ''
    }

    let context = '以下是相关知识库内容，请参考这些内容进行回答：\n\n'

    for (let i = 0; i < theorems.length; i++) {
      const theorem = theorems[i]
      context += `[${i + 1}] ${theorem.theorem}\n`
      context += `描述：${theorem.description}\n`
      context += `公式：${theorem.formula}\n`
      context += `常见错误：${theorem.commonMistakes.map(m => m.mistake).join('；')}\n\n`
    }

    return context
  }

  /**
   * 获取定理详情
   */
  getTheoremById(id: string): Theorem | undefined {
    return this.theorems.get(id)
  }

  /**
   * 获取所有定理
   */
  getAllTheorems(): Theorem[] {
    return Array.from(this.theorems.values())
  }

  /**
   * 按类别获取定理
   */
  getTheoremsByCategory(category: string): Theorem[] {
    return Array.from(this.theorems.values()).filter(t => t.category === category)
  }
}

export default new RAGService()
