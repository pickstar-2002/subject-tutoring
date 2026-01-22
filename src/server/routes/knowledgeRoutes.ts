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
    // 使用原始文件名，如果文件已存在则添加时间戳
    const originalName = file.originalname
    const uploadDir = path.join(__dirname, '../../../public/uploads/documents')
    const filePath = path.join(uploadDir, originalName)

    if (fs.existsSync(filePath)) {
      // 文件已存在，添加时间戳
      const ext = path.extname(originalName)
      const name = path.basename(originalName, ext)
      const timestamp = Date.now()
      cb(null, `${name}-${timestamp}${ext}`)
    } else {
      cb(null, originalName)
    }
  }
})

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const allowedExts = ['.txt', '.md', '.json', '.pdf', '.doc', '.docx']
    const ext = path.extname(file.originalname).toLowerCase()

    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 TXT、MD、JSON、PDF、DOC、DOCX 文件'))
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

    console.log('[Upload] File received:', req.file.filename, req.file.mimetype)

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
 * GET /api/knowledge/files/list
 * 获取所有知识库文件（本地 + 上传）
 */
router.get('/files/list', async (req: Request, res: Response) => {
  try {
    const knowledgeDir = path.join(__dirname, '../../../data/knowledge')
    const files: Array<{
      name: string
      path: string
      type: 'local' | 'uploaded'
      category?: string
      size?: number
      itemCount?: number
    }> = []

    // 读取本地知识库文件
    if (fs.existsSync(knowledgeDir)) {
      const localFiles = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.json'))
      for (const file of localFiles) {
        const filePath = path.join(knowledgeDir, file)
        const stats = fs.statSync(filePath)
        const content = fs.readFileSync(filePath, 'utf-8')
        const itemCount = Array.isArray(JSON.parse(content)) ? JSON.parse(content).length : 1

        files.push({
          name: file,
          path: filePath,
          type: 'local',
          category: file.replace('.json', ''),
          size: stats.size,
          itemCount
        })
      }
    }

    // 添加用户上传的文档
    const uploadedDocs = documentService.getUploadedDocuments()
    for (const doc of uploadedDocs) {
      files.push({
        name: doc.filename,
        path: '',
        type: 'uploaded',
        category: doc.category
      })
    }

    res.json({
      success: true,
      data: files
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FILES_ERROR',
        message: error.message || '获取知识库文件时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/files/:category/content
 * 获取知识库文件内容
 */
router.get('/files/:category/content', async (req: Request, res: Response) => {
  try {
    const { category } = req.params
    const knowledgeDir = path.join(__dirname, '../../../data/knowledge')
    const filePath = path.join(knowledgeDir, `${category}.json`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '知识库文件不存在'
        }
      })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    res.json({
      success: true,
      data: {
        category,
        items: Array.isArray(data) ? data : [data]
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_FILE_CONTENT_ERROR',
        message: error.message || '获取文件内容时发生错误'
      }
    })
  }
})

/**
 * GET /api/knowledge/documents/:fileName/content
 * 获取上传文档的处理后内容
 */
router.get('/documents/:fileName/content', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params
    const uploadsDir = path.join(__dirname, '../../../public/uploads/documents')
    const metadataPath = path.join(uploadsDir, 'metadata.json')

    // 读取元数据
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'METADATA_NOT_FOUND',
          message: '上传文档元数据不存在'
        }
      })
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
    const metadata: any[] = JSON.parse(metadataContent)

    // 根据文件名查找元数据
    const docMeta = metadata.find((m: any) => m.filename === fileName || m.id === fileName)
    if (!docMeta) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: '未找到指定的文档'
        }
      })
    }

    // 读取原始文件
    const filePath = path.join(uploadsDir, docMeta.filename)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: '文档文件不存在'
        }
      })
    }

    // 解析文档内容
    const parsed = await documentService.parseDocument(filePath, 'text/plain')

    // 构建知识条目
    const item = {
      id: docMeta.id,
      category: docMeta.category,
      subject: '自定义上传',
      topic: docMeta.topic || '通用',
      theorem: parsed.title,
      difficulty: docMeta.difficulty || '初级',
      description: parsed.content,
      formula: '',
      formulaLatex: '',
      proofSteps: [],
      examples: [],
      commonMistakes: [],
      socraticQuestions: [],
      keywords: [parsed.type, '用户上传']
    }

    res.json({
      success: true,
      data: {
        category: 'uploaded_documents',
        items: [item]
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_DOCUMENT_CONTENT_ERROR',
        message: error.message || '获取文档内容时发生错误'
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

/**
 * Multer 错误处理中间件
 * 处理文件上传时的错误
 */
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    // Multer 错误
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小超过限制（最大 10MB）'
        }
      })
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNEXPECTED_FILE',
          message: '意外的文件字段'
        }
      })
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || '文件上传错误'
      }
    })
  }

  // 其他错误
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || '文件上传失败'
      }
    })
  }

  next()
})

export default router
