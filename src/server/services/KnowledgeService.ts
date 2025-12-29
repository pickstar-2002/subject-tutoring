import type { Theorem, KnowledgeQuery, SearchResult, SubjectCategory } from '../../shared/types'
import ragService from './RAGService.ts'
import { SUBJECT_NAMES } from '../../shared/constants'

export class KnowledgeService {
  /**
   * 查询知识库
   */
  async queryKnowledge(query: KnowledgeQuery): Promise<Theorem[]> {
    await ragService.initialize()

    let theorems = ragService.getAllTheorems()

    // 按类别过滤
    if (query.category) {
      theorems = theorems.filter(t => t.category === query.category)
    }

    // 按主题过滤
    if (query.topic) {
      theorems = theorems.filter(t => t.topic === query.topic)
    }

    // 按难度过滤
    if (query.difficulty) {
      theorems = theorems.filter(t => t.difficulty === query.difficulty)
    }

    // 关键词搜索
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      theorems = theorems.filter(t =>
        t.theorem.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.keywords.some(k => k.toLowerCase().includes(searchLower))
      )
    }

    // 限制数量
    if (query.limit) {
      theorems = theorems.slice(0, query.limit)
    }

    return theorems
  }

  /**
   * 语义搜索知识库
   */
  async searchKnowledge(params: {
    query: string
    category?: SubjectCategory
    limit?: number
  }): Promise<SearchResult[]> {
    await ragService.initialize()

    const theorems = await ragService.retrieveDocuments(
      params.query,
      params.limit || 5,
      params.category
    )

    return theorems.map(t => ({
      id: t.id,
      theorem: t.theorem,
      description: t.description,
      relevanceScore: (t as any).relevanceScore || 0,
      category: t.category,
      difficulty: t.difficulty
    }))
  }

  /**
   * 获取定理详情
   */
  async getTheoremById(id: string): Promise<Theorem | undefined> {
    await ragService.initialize()
    return ragService.getTheoremById(id)
  }

  /**
   * 获取所有学科分类
   */
  async getCategories(): Promise<Array<{ value: string; label: string; icon: string }>> {
    return Object.entries(SUBJECT_NAMES).map(([value, label]) => ({
      value,
      label,
      icon: this.getSubjectIcon(value as SubjectCategory)
    }))
  }

  /**
   * 获取指定学科的主题列表
   */
  async getTopicsByCategory(category: SubjectCategory): Promise<string[]> {
    await ragService.initialize()
    const theorems = ragService.getTheoremsByCategory(category)

    // 提取所有唯一主题
    const topics = new Set<string>()
    for (const theorem of theorems) {
      topics.add(theorem.topic)
    }

    return Array.from(topics).sort()
  }

  /**
   * 获取学科图标
   */
  private getSubjectIcon(category: SubjectCategory): string {
    const icons: Record<SubjectCategory, string> = {
      math: '📐',
      physics: '⚛️',
      chemistry: '🧪',
      biology: '🧬',
      logic: '🧩'
    }
    return icons[category] || '📚'
  }

  /**
   * 获取推荐定理
   */
  async getRecommendedTheorems(
    category?: SubjectCategory,
    difficulty?: string,
    limit: number = 5
  ): Promise<Theorem[]> {
    await ragService.initialize()
    let theorems = ragService.getAllTheorems()

    if (category) {
      theorems = theorems.filter(t => t.category === category)
    }

    if (difficulty) {
      theorems = theorems.filter(t => t.difficulty === difficulty)
    }

    // 随机选择
    const shuffled = theorems.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, limit)
  }

  /**
   * 获取相关定理
   */
  async getRelatedTheorems(theoremId: string, limit: number = 4): Promise<Theorem[]> {
    await ragService.initialize()
    const theorem = await ragService.getTheoremById(theoremId)

    if (!theorem) return []

    const relatedIds = theorem.relatedTheorems.slice(0, limit)
    const related: Theorem[] = []

    for (const id of relatedIds) {
      const t = await ragService.getTheoremById(id)
      if (t) related.push(t)
    }

    return related
  }
}

export default new KnowledgeService()
