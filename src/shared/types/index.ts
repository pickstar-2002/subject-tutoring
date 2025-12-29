// ==================== 消息类型 ====================

// 多模态内容类型
export interface MessageContentText {
  type: 'text'
  text: string
}

export interface MessageContentImage {
  type: 'image_url'
  image_url: {
    url: string
  }
}

export type MessageContent = string | (MessageContentText | MessageContentImage)[]

// 聊天消息（支持多模态）
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
  timestamp: number
  thinking?: string // AI思考过程
  relatedTheorems?: string[] // 相关定理
  visualAids?: Widget[] // 可视化组件
}

// ==================== Widget 类型 ====================
export type WidgetType =
  | 'text'
  | 'image'
  | 'slideshow'
  | 'formula'
  | 'diagram'
  | 'chart'
  | 'proof_step'
  | 'example'

export interface Widget {
  type: WidgetType
  data: any
}

export interface ImageWidget {
  type: 'image'
  data: {
    url: string
    caption?: string
    alt?: string
  }
}

export interface SlideshowWidget {
  type: 'slideshow'
  data: {
    images: Array<{
      url: string
      caption?: string
    }>
    autoplay?: boolean
    interval?: number
  }
}

export interface FormulaWidget {
  type: 'formula'
  data: {
    latex: string
    description?: string
  }
}

export interface DiagramWidget {
  type: 'diagram'
  data: {
    type: 'geometry' | 'graph' | 'table' | 'tree'
    content: any
    description?: string
  }
}

export interface ProofStepWidget {
  type: 'proof_step'
  data: {
    step: number
    title: string
    content: string
    visual?: string
  }
}

export interface ExampleWidget {
  type: 'example'
  data: {
    problem: string
    solution: string
    steps?: string[]
  }
}

// ==================== 知识库类型 ====================
export type SubjectCategory = 'math' | 'physics' | 'chemistry' | 'biology' | 'logic'
export type DifficultyLevel = '初级' | '中级' | '高级'

export interface Theorem {
  id: string
  category: SubjectCategory
  subject: string
  topic: string
  theorem: string
  difficulty: DifficultyLevel

  description: string
  formula: string
  formulaLatex: string

  visualization: {
    type: string
    description: string
    widgets: string[]
  }

  proofSteps: ProofStep[]

  examples: Example[]

  commonMistakes: CommonMistake[]

  socraticQuestions: string[]

  prerequisites: string[]
  relatedTheorems: string[]

  teachingTips: string[]

  keywords: string[]
  embeddingText: string
}

export interface ProofStep {
  step: number
  title: string
  content: string
  visual?: string
}

export interface Example {
  problem: string
  solution: string
  steps?: string[]
}

export interface CommonMistake {
  mistake: string
  correction: string
}

// ==================== API 类型 ====================
export interface ApiKeys {
  modelScopeApiKey?: string
  xmovAppId?: string
  xmovAppSecret?: string
}

export interface ChatRequest {
  message: string
  images?: string[] // 图片 URL 列表
  subject?: string
  topic?: string
  sessionId: string
  conversationHistory?: ChatMessage[]
  userProfile?: UserProfile
  apiKeys?: ApiKeys
}

export interface ChatResponse {
  success: boolean
  response?: string
  thinking?: string
  relatedTheorems?: TheoremReference[]
  visualAids?: Widget[]
  socraticQuestions?: string[]
  error?: string
}

export interface TheoremReference {
  id: string
  theorem: string
  description: string
  relevanceScore: number
}

export interface KnowledgeQuery {
  category?: SubjectCategory
  topic?: string
  difficulty?: DifficultyLevel
  search?: string
  limit?: number
}

export interface SearchResult {
  id: string
  theorem: string
  description: string
  relevanceScore: number
  category: SubjectCategory
  difficulty: DifficultyLevel
}

// ==================== 用户类型 ====================
export interface UserProfile {
  id?: string
  gradeLevel: string // 小学/初中/高中/大学
  subjects: SubjectCategory[]
  difficulty: DifficultyLevel
  learningGoals: string[]
  weakTopics: string[]
  learningHistory: LearningRecord[]
}

export interface LearningRecord {
  theoremId: string
  studiedAt: number
  understandingLevel: number // 1-5
  practiceCount: number
  correctRate: number
}

// ==================== 学科状态类型 ====================
export interface SubjectState {
  currentSubject: SubjectCategory | null
  currentTopic: string | null
  difficulty: DifficultyLevel
  currentTheorem: Theorem | null
  learningProgress: LearningProgress
}

export interface LearningProgress {
  totalTheorems: number
  learnedTheorems: number
  masteredTheorems: number
  currentStreak: number
  lastStudyTime: number
}

// ==================== 数字人类型 ====================
export type AvatarState =
  | 'offline'
  | 'online'
  | 'idle'
  | 'interactive_idle'
  | 'listen'
  | 'think'
  | 'speak'

export interface SpeakOptions {
  text: string
  isStart?: boolean
  isEnd?: boolean
}

// ==================== RAG 类型 ====================
export interface Document {
  id: string
  content: string
  metadata: Record<string, any>
}

export interface EmbeddingVector {
  id: string
  vector: number[]
  metadata: Record<string, any>
}

// ==================== 错误类型 ====================
export interface ApiError {
  code: string
  message: string
  details?: any
}

// ==================== 常量类型 ====================
export const SUBJECT_CATEGORIES: SubjectCategory[] = ['math', 'physics', 'chemistry', 'biology', 'logic']

export const DIFFICULTY_LEVELS: DifficultyLevel[] = ['初级', '中级', '高级']

export const SUBJECT_NAMES: Record<SubjectCategory, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  logic: '逻辑'
}

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  初级: 'bg-green-100 text-green-700',
  中级: 'bg-yellow-100 text-yellow-700',
  高级: 'bg-red-100 text-red-700'
}
