import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 文档解析服务
 * 支持解析 PDF、TXT、MD 等文档格式
 */
export class DocumentService {
  private uploadDir: string
  private knowledgeDir: string

  constructor() {
    this.uploadDir = path.join(__dirname, '../../../public/uploads/documents')
    this.knowledgeDir = path.join(__dirname, '../../../data/knowledge')
    this.ensureDirectories()
  }

  /**
   * 确保目录存在
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  /**
   * 解析文档内容
   */
  async parseDocument(filePath: string, mimeType: string): Promise<{
    title: string
    content: string
    type: string
  }> {
    const ext = path.extname(filePath).toLowerCase()

    try {
      switch (ext) {
        case '.txt':
        case '.md':
          return this.parseTextFile(filePath)
        case '.pdf':
          return await this.parsePdfFile(filePath)
        default:
          throw new Error(`不支持的文件格式: ${ext}`)
      }
    } catch (error: any) {
      throw new Error(`文档解析失败: ${error.message}`)
    }
  }

  /**
   * 解析纯文本文件
   */
  private parseTextFile(filePath: string): { title: string; content: string; type: string } {
    const content = fs.readFileSync(filePath, 'utf-8')
    const filename = path.basename(filePath)

    // 尝试从内容中提取标题（第一行）
    const lines = content.split('\n').filter(line => line.trim())
    const title = lines[0] || filename

    return {
      title: title.replace(/^[#*\s]+/, '').trim(),
      content: content.trim(),
      type: 'text'
    }
  }

  /**
   * 解析PDF文件
   * 注意：这是一个简化版本，实际应用中可能需要使用 pdf-parse 或 pdfjs-dist
   */
  private async parsePdfFile(filePath: string): Promise<{ title: string; content: string; type: string }> {
    const filename = path.basename(filePath)

    // 简化版：提示需要安装PDF解析库
    // 实际应用中可以使用 pdf-parse: npm install pdf-parse
    throw new Error('PDF解析功能需要安装 pdf-parse 库。请使用 pdf-parse 或将PDF转换为文本格式后上传。')

    /* 完整实现示例（需要安装 pdf-parse）:
    import pdf from 'pdf-parse'

    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdf(dataBuffer)

    const lines = data.text.split('\n').filter(line => line.trim())
    const title = lines[0] || filename

    return {
      title: title.trim(),
      content: data.text.trim(),
      type: 'pdf'
    }
    */
  }

  /**
   * 将文档内容转换为知识库条目
   */
  convertToKnowledgeItem(
    parsedDoc: { title: string; content: string; type: string },
    category: string,
    topic: string,
    difficulty: string,
    originalFilename: string
  ): any {
    // 分析内容，提取关键信息
    const content = parsedDoc.content
    const keywords = this.extractKeywords(content)

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      subject: this.getSubjectName(category),
      topic: topic || '通用',
      theorem: parsedDoc.title,
      difficulty: difficulty || '初级',

      description: this.extractDescription(content),
      formula: this.extractFormula(content),
      formula_latex: this.extractLatexFormula(content),

      proof_steps: this.extractSections(content, ['证明', '证明过程', '推导']),
      examples: this.extractExamples(content),
      common_mistakes: this.extractMistakes(content),

      socratic_questions: this.extractQuestions(content),
      keywords: keywords,

      source: 'uploaded_document',
      source_file: originalFilename
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(content: string): string[] {
    // 简单的关键词提取：提取高频词汇
    const words = content
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2)

    const frequency = new Map<string, number>()
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1)
    }

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * 提取描述
   */
  private extractDescription(content: string): string {
    // 提取前200字符作为描述
    const cleanContent = content.replace(/[#*\s]+/g, ' ').trim()
    return cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : '')
  }

  /**
   * 提取公式
   */
  private extractFormula(content: string): string {
    // 查找可能的公式（包含数学符号的行）
    const formulaPatterns = [
      /[-=][^=\n]{1,50}[=-]/g,
      /\$[^$]{1,50}\$/g,
      /公式[：:]\s*([^\n]+)/g
    ]

    for (const pattern of formulaPatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return ''
  }

  /**
   * 提取LaTeX公式
   */
  private extractLatexFormula(content: string): string {
    // 查找LaTeX格式的公式
    const latexPattern = /\$\$[^$]+\$\$|\$[^$]+\$/g
    const matches = content.match(latexPattern)
    return matches ? matches[0] : ''
  }

  /**
   * 提取特定章节
   */
  private extractSections(content: string, sectionTitles: string[]): Array<{ step: number; title: string; content: string }> {
    const steps: Array<{ step: number; title: string; content: string }> = []
    const lines = content.split('\n')

    let currentStep = 0
    let inSection = false
    let currentTitle = ''
    let currentContent: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      for (const sectionTitle of sectionTitles) {
        if (trimmedLine.includes(sectionTitle)) {
          if (inSection && currentContent.length > 0) {
            steps.push({
              step: currentStep,
              title: currentTitle,
              content: currentContent.join('\n').trim()
            })
            currentStep++
          }

          inSection = true
          currentTitle = trimmedLine
          currentContent = []
          break
        }
      }

      if (inSection && trimmedLine && !trimmedLine.includes('证明') && !trimmedLine.includes('步骤')) {
        currentContent.push(trimmedLine)
      }
    }

    if (inSection && currentContent.length > 0) {
      steps.push({
        step: currentStep,
        title: currentTitle,
        content: currentContent.join('\n').trim()
      })
    }

    return steps
  }

  /**
   * 提取示例
   */
  private extractExamples(content: string): Array<{ problem: string; solution: string }> {
    const examples: Array<{ problem: string; solution: string }> = []

    // 简单的模式匹配
    const examplePattern = /例[题\s]*[：:]\s*([^\n]+)(?:\n+答[案\s]*[：:]\s*([^\n]+))?/g
    let match

    while ((match = examplePattern.exec(content)) !== null) {
      examples.push({
        problem: match[1]?.trim() || '',
        solution: match[2]?.trim() || ''
      })
    }

    return examples
  }

  /**
   * 提取常见错误
   */
  private extractMistakes(content: string): Array<{ mistake: string; correction: string }> {
    const mistakes: Array<{ mistake: string; correction: string }> = []

    const mistakePattern = /常见错误|注意|易错点/g
    const lines = content.split('\n')

    for (const line of lines) {
      if (mistakePattern.test(line)) {
        const mistakeMatch = line.match(/(?:常见错误|注意|易错点)[：:]\s*([^\n]+)/)
        if (mistakeMatch) {
          mistakes.push({
            mistake: mistakeMatch[1]?.trim() || '',
            correction: ''
          })
        }
      }
    }

    return mistakes
  }

  /**
   * 提取思考问题
   */
  private extractQuestions(content: string): string[] {
    const questions: string[] = []

    const questionPattern = /[?？]|思考|问题|为什么/g
    const lines = content.split('\n')

    for (const line of lines) {
      if (questionPattern.test(line)) {
        const question = line.replace(/^[#*\s]+/, '').trim()
        if (question.length > 5 && question.length < 100) {
          questions.push(question)
        }
      }
    }

    return questions.slice(0, 5) // 最多5个问题
  }

  /**
   * 获取学科名称
   */
  private getSubjectName(category: string): string {
    const subjectNames: Record<string, string> = {
      math: '数学',
      physics: '物理',
      chemistry: '化学',
      biology: '生物',
      logic: '逻辑'
    }
    return subjectNames[category] || '通用'
  }

  /**
   * 保存文档到知识库
   */
  async saveToKnowledge(
    knowledgeItem: any,
    targetCategory?: string
  ): Promise<string> {
    // 确定目标文件
    const targetFile = targetCategory
      ? path.join(this.knowledgeDir, `${targetCategory}.json`)
      : path.join(this.knowledgeDir, 'uploaded_documents.json')

    // 读取现有数据
    let existingData: any[] = []
    if (fs.existsSync(targetFile)) {
      const content = fs.readFileSync(targetFile, 'utf-8')
      try {
        existingData = JSON.parse(content)
        if (!Array.isArray(existingData)) {
          existingData = []
        }
      } catch (e) {
        existingData = []
      }
    }

    // 添加新条目
    existingData.push(knowledgeItem)

    // 保存文件
    fs.writeFileSync(targetFile, JSON.stringify(existingData, null, 2), 'utf-8')

    return knowledgeItem.id
  }

  /**
   * 获取所有已上传文档
   */
  getUploadedDocuments(): Array<{
    filename: string
    uploadTime: number
    category: string
    id: string
  }> {
    const uploadsPath = path.join(this.uploadDir, 'metadata.json')

    if (!fs.existsSync(uploadsPath)) {
      return []
    }

    try {
      const content = fs.readFileSync(uploadsPath, 'utf-8')
      const metadata = JSON.parse(content)
      return Array.isArray(metadata) ? metadata : []
    } catch (e) {
      return []
    }
  }

  /**
   * 保存上传元数据
   */
  saveUploadMetadata(metadata: {
    filename: string
    uploadTime: number
    category: string
    id: string
  }): void {
    const uploadsPath = path.join(this.uploadDir, 'metadata.json')
    let existing: any[] = []

    if (fs.existsSync(uploadsPath)) {
      try {
        const content = fs.readFileSync(uploadsPath, 'utf-8')
        existing = JSON.parse(content)
        if (!Array.isArray(existing)) {
          existing = []
        }
      } catch (e) {
        existing = []
      }
    }

    existing.push(metadata)
    fs.writeFileSync(uploadsPath, JSON.stringify(existing, null, 2), 'utf-8')
  }

  /**
   * 删除上传的文档
   */
  deleteDocument(documentId: string): boolean {
    const uploadsPath = path.join(this.uploadDir, 'metadata.json')

    if (!fs.existsSync(uploadsPath)) {
      return false
    }

    try {
      const content = fs.readFileSync(uploadsPath, 'utf-8')
      const metadata: any[] = JSON.parse(content)

      const docIndex = metadata.findIndex(doc => doc.id === documentId)
      if (docIndex === -1) {
        return false
      }

      const doc = metadata[docIndex]
      const filePath = path.join(this.uploadDir, doc.filename)

      // 删除文件
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }

      // 从元数据中移除
      metadata.splice(docIndex, 1)
      fs.writeFileSync(uploadsPath, JSON.stringify(metadata, null, 2), 'utf-8')

      return true
    } catch (e) {
      console.error('Delete document error:', e)
      return false
    }
  }
}

export default new DocumentService()
