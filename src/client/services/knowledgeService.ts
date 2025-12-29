import type { KnowledgeQuery, SearchResult, SubjectCategory, Theorem } from '@shared/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 查询知识库
 */
export async function queryKnowledge(query: KnowledgeQuery): Promise<Theorem[]> {
  try {
    const params = new URLSearchParams()
    if (query.category) params.append('category', query.category)
    if (query.topic) params.append('topic', query.topic)
    if (query.difficulty) params.append('difficulty', query.difficulty)
    if (query.search) params.append('search', query.search)
    if (query.limit) params.append('limit', query.limit.toString())

    const response = await fetch(`${API_BASE}/knowledge?${params.toString()}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    }
    return []
  } catch (error) {
    console.error('Query knowledge error:', error)
    return []
  }
}

/**
 * 语义搜索知识库
 */
export async function searchKnowledge(
  query: string,
  category?: SubjectCategory,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${API_BASE}/knowledge/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, category, limit })
    })

    const data = await response.json()

    if (data.success) {
      return data.data
    }
    return []
  } catch (error) {
    console.error('Search knowledge error:', error)
    return []
  }
}

/**
 * 获取定理详情
 */
export async function getTheoremById(id: string): Promise<Theorem | null> {
  try {
    const response = await fetch(`${API_BASE}/knowledge/${id}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    }
    return null
  } catch (error) {
    console.error('Get theorem error:', error)
    return null
  }
}

/**
 * 获取所有学科分类
 */
export async function getCategories(): Promise<Array<{ value: string; label: string; icon: string }>> {
  try {
    const response = await fetch(`${API_BASE}/knowledge/categories/list`)
    const data = await response.json()

    if (data.success) {
      return data.data
    }
    return []
  } catch (error) {
    console.error('Get categories error:', error)
    return []
  }
}

/**
 * 获取指定学科的主题列表
 */
export async function getTopicsByCategory(category: SubjectCategory): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/knowledge/topics/${category}`)
    const data = await response.json()

    if (data.success) {
      return data.data
    }
    return []
  } catch (error) {
    console.error('Get topics error:', error)
    return []
  }
}

export default {
  queryKnowledge,
  searchKnowledge,
  getTheoremById,
  getCategories,
  getTopicsByCategory
}
