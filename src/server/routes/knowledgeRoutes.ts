import { Router, Request, Response } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import knowledgeService from '../services/KnowledgeService.ts'
import documentService from '../services/DocumentService.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// 配置 multer 用于文档上传
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../public/uploads/documents')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const allowedExts = ['.txt', '.md', '.pdf', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 TXT、MD、PDF、DOC、DOCX 文件'))
    }
  }
})

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

/**
 * POST /api/knowledge/upload-document
 * 上传课件文档
 */
router.post('/upload-document', documentUpload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '没有上传文件'
        }
      })
    }

    const { category, topic, difficulty } = req.body

    // 解析文档
    const parsedDoc = await documentService.parseDocument(
      req.file.path,
      req.file.mimetype
    )

    // 转换为知识库条目
    const knowledgeItem = documentService.convertToKnowledgeItem(
      parsedDoc,
      category || 'math',
      topic || '',
      difficulty || '初级',
      req.file.originalname
    )

    // 保存到知识库
    const itemId = await documentService.saveToKnowledge(knowledgeItem, category)

    // 保存上传元数据
    documentService.saveUploadMetadata({
      filename: req.file.filename,
      uploadTime: Date.now(),
      category: category || 'math',
      id: itemId
    })

    res.json({
      success: true,
      data: {
        id: itemId,
        title: parsedDoc.title,
        category,
        topic,
        difficulty
      },
      message: '文档上传成功并已添加到知识库'
    })
  } catch (error: any) {
    console.error('[Knowledge Routes] Upload Document Error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || '文档上传时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/documents/list
 * 获取已上传的文档列表
 */
router.get('/documents/list', async (req: Request, res: Response) => {
  try {
    const documents = documentService.getUploadedDocuments()

    res.json({
      success: true,
      data: documents
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENTS_ERROR',
        message: error.message || '获取文档列表时发生错误'
      }
    })
  }
})

/**
 * DELETE /api/knowledge/documents/:id
 * 删除上传的文档
 */
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const deleted = documentService.deleteDocument(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '未找到指定的文档'
        }
      })
    }

    res.json({
      success: true,
      message: '文档已删除'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message || '删除文档时发生错误'
      }
    })
  }
})

export default router
