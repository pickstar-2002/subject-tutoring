import { Router, Request, Response } from 'express'
import knowledgeService from '../services/KnowledgeService.ts'

const router = Router()

/**
 * GET /api/knowledge
 * 获取知识库内容
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, topic, difficulty, search, limit } = req.query

    const result = await knowledgeService.queryKnowledge({
      category: category as any,
      topic: topic as string,
      difficulty: difficulty as any,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined
    })

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('[Knowledge Routes] Error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'KNOWLEDGE_QUERY_ERROR',
        message: error.message || '查询知识库时发生错误'
      }
    })
  }
})

/**
 * POST /api/knowledge/search
 * 语义搜索知识库
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, category, limit = 5 } = req.body

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '搜索查询不能为空'
        }
      })
    }

    const results = await knowledgeService.searchKnowledge({
      query,
      category,
      limit
    })

    res.json({
      success: true,
      data: results
    })
  } catch (error: any) {
    console.error('[Knowledge Routes] Search Error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'KNOWLEDGE_SEARCH_ERROR',
        message: error.message || '搜索知识库时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/:id
 * 获取单个定理详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const theorem = await knowledgeService.getTheoremById(id)

    if (!theorem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '未找到指定的定理'
        }
      })
    }

    res.json({
      success: true,
      data: theorem
    })
  } catch (error: any) {
    console.error('[Knowledge Routes] Get Error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'KNOWLEDGE_GET_ERROR',
        message: error.message || '获取定理详情时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/categories/list
 * 获取所有学科分类
 */
router.get('/categories/list', async (req: Request, res: Response) => {
  try {
    const categories = await knowledgeService.getCategories()

    res.json({
      success: true,
      data: categories
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CATEGORIES_ERROR',
        message: error.message || '获取学科分类时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/topics/:category
 * 获取指定学科的主题列表
 */
router.get('/topics/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params

    const topics = await knowledgeService.getTopicsByCategory(category as any)

    res.json({
      success: true,
      data: topics
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TOPICS_ERROR',
        message: error.message || '获取主题列表时发生错误'
      }
    })
  }
})

export default router
