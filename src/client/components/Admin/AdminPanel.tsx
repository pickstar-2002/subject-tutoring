import React, { useState, useEffect, useRef } from 'react'

interface KnowledgeFile {
  name: string
  path: string
  type: 'local' | 'uploaded'
  category?: string
  size?: number
  itemCount?: number
}

interface KnowledgeItem {
  id: string
  category: string
  subject: string
  topic: string
  theorem: string
  difficulty: string
  description: string
  formula?: string
  formulaLatex?: string
  proofSteps?: Array<{
    step: number
    title: string
    content: string
    visual?: string
  }>
  examples?: Array<{
    problem: string
    solution: string
    steps?: string[]
  }>
  commonMistakes?: Array<{
    mistake: string
    correction: string
  }>
  socraticQuestions?: string[]
  keywords?: string[]
}

interface KnowledgeFileContent {
  category: string
  items: KnowledgeItem[]
}

const SUBJECT_ICONS: Record<string, string> = {
  math: '📐',
  physics: '⚛️',
  chemistry: '🧪',
  biology: '🧬',
  logic: '🧩',
  uploaded_documents: '📁'
}

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  logic: '逻辑',
  uploaded_documents: '上传文档'
}

interface AdminPanelProps {
  onClose?: () => void
}

// 确认气泡组件
interface ConfirmBubbleProps {
  show: boolean
  onConfirm: () => void
  onCancel: () => void
  position: { top: number; left: number }
}

const ConfirmBubble: React.FC<ConfirmBubbleProps> = ({ show, onConfirm, onCancel, position }) => {
  if (!show) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 z-[99]"
        onClick={onCancel}
      />

      {/* 气泡 */}
      <div
        className="fixed z-[100] transition-all duration-200 ease-out"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-[200px]">
          {/* 气泡箭头 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45" />

          {/* 内容 */}
          <div className="relative pt-4 pb-3 px-4">
            <p className="text-sm font-medium text-gray-900 mb-3">确定要删除这个文档吗？</p>
            <div className="flex space-x-2">
              <button
                onClick={onCancel}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// 详情弹窗组件
interface DetailModalProps {
  category?: string
  fileName?: string
  onClose: () => void
}

const DetailModal: React.FC<DetailModalProps> = ({ category, fileName, onClose }) => {
  const [content, setContent] = useState<KnowledgeFileContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      setError(null)
      try {
        // 根据是本地文件还是上传文档选择不同的接口
        const url = fileName
          ? `/api/knowledge/documents/${fileName}/content`
          : `/api/knowledge/files/${category}/content`

        const response = await fetch(url)
        const data = await response.json()
        if (data.success) {
          setContent(data.data)
          if (data.data.items.length > 0) {
            setSelectedItem(data.data.items[0])
          }
        } else {
          setError(data.error?.message || '加载失败')
        }
      } catch (err: any) {
        setError(err.message || '网络错误')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [category, fileName])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '初级': return 'bg-green-100 text-green-700'
      case '中级': return 'bg-yellow-100 text-yellow-700'
      case '高级': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{fileName ? '📁' : (SUBJECT_ICONS[category || ''] || '📚')}</span>
            <div>
              <h2 className="text-xl font-bold">
                {fileName ? '上传文档详情' : (SUBJECT_LABELS[category || ''] || category) + '知识库'}
              </h2>
              {content && <p className="text-sm text-white/80">{content.items.length} 条内容</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧列表 */}
          <div className="w-80 border-r overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-red-600 text-center">{error}</div>
            ) : (
              <div className="p-2 space-y-1">
                {content?.items.map((item, index) => (
                  <button
                    key={item.id || index}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedItem?.id === item.id
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                        : 'bg-white hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{item.theorem}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                      <span>{item.topic}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getDifficultyColor(item.difficulty)}`}>
                        {item.difficulty}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 右侧详情 */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedItem ? (
              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.theorem}</h3>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded">{selectedItem.topic}</span>
                    <span className={`px-2 py-1 rounded ${getDifficultyColor(selectedItem.difficulty)}`}>
                      {selectedItem.difficulty}
                    </span>
                    {selectedItem.formula && (
                      <span className="font-mono text-blue-600">{selectedItem.formula}</span>
                    )}
                  </div>
                </div>

                {/* 描述 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">描述</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedItem.description}</p>
                </div>

                {/* 证明步骤 */}
                {selectedItem.proofSteps && selectedItem.proofSteps.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">证明过程</h4>
                    <div className="space-y-3">
                      {selectedItem.proofSteps.map((step, idx) => (
                        <div key={idx} className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {step.step}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">{step.title}</div>
                              <div className="text-sm text-gray-700">{step.content}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 示例 */}
                {selectedItem.examples && selectedItem.examples.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">示例</h4>
                    <div className="space-y-3">
                      {selectedItem.examples.map((example, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-4">
                          <div className="font-medium text-gray-900 mb-2">问题: {example.problem}</div>
                          <div className="text-sm text-gray-700 space-y-2">
                            <div>解答: {example.solution}</div>
                            {example.steps && example.steps.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {example.steps.map((step, stepIdx) => (
                                  <div key={stepIdx} className="text-gray-600">
                                    {stepIdx + 1}. {step}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 常见错误 */}
                {selectedItem.commonMistakes && selectedItem.commonMistakes.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">常见错误</h4>
                    <div className="space-y-2">
                      {selectedItem.commonMistakes.map((mistake, idx) => (
                        <div key={idx} className="bg-red-50 rounded-lg p-3">
                          <div className="text-red-700 font-medium mb-1">错误: {mistake.mistake}</div>
                          <div className="text-green-700 text-sm">正确: {mistake.correction}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 思考问题 */}
                {selectedItem.socraticQuestions && selectedItem.socraticQuestions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">思考问题</h4>
                    <div className="space-y-2">
                      {selectedItem.socraticQuestions.map((question, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-gray-700">
                          <span className="text-purple-600 font-medium">Q{idx + 1}:</span>
                          <span>{question}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 关键词 */}
                {selectedItem.keywords && selectedItem.keywords.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">关键词</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.keywords.map((keyword, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                选择一个条目查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [detailFile, setDetailFile] = useState<{ category?: string; fileName?: string } | null>(null)

  // 确认气泡状态
  const [confirmBubble, setConfirmBubble] = useState<{
    show: boolean
    fileName: string | null
    position: { top: number; left: number }
  }>({ show: false, fileName: null, position: { top: 0, left: 0 } })

  // 加载知识库文件列表
  const loadKnowledgeFiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge/files/list')
      const data = await response.json()
      if (data.success) {
        setKnowledgeFiles(data.data)
      }
    } catch (error) {
      console.error('Load files error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadKnowledgeFiles()
  }, [])

  // 处理文件选择（选择后自动上传）
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadResult(null)
      // 自动触发上传
      await handleUpload(file)
    }
  }

  // 上传文档
  const handleUpload = async (file?: File) => {
    const fileToUpload = file || selectedFile
    if (!fileToUpload) {
      setUploadResult({ success: false, message: '请选择文件' })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('document', fileToUpload)
      formData.append('category', 'uploaded_documents')
      formData.append('topic', '通用')
      formData.append('difficulty', '初级')

      const response = await fetch('/api/knowledge/upload-document', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadResult({ success: true, message: result.message || '上传成功！' })
        setSelectedFile(null)
        // 重置文件输入
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        // 刷新文件列表
        loadKnowledgeFiles()
      } else {
        setUploadResult({ success: false, message: result.error?.message || '上传失败' })
      }
    } catch (error: any) {
      setUploadResult({ success: false, message: error.message || '网络错误' })
    } finally {
      setIsUploading(false)
    }
  }

  // 显示确认气泡
  const showDeleteConfirm = (fileName: string, event: React.MouseEvent) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    setConfirmBubble({
      show: true,
      fileName,
      position: {
        top: rect.top - 10,
        left: rect.left + rect.width / 2 - 100
      }
    })
  }

  // 执行删除
  const executeDelete = async () => {
    if (!confirmBubble.fileName) return

    try {
      const response = await fetch(`/api/knowledge/documents/${confirmBubble.fileName}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        loadKnowledgeFiles()
        setConfirmBubble({ show: false, fileName: null, position: { top: 0, left: 0 } })
      } else {
        setUploadResult({ success: false, message: result.error?.message || '删除失败' })
        setConfirmBubble({ show: false, fileName: null, position: { top: 0, left: 0 } })
      }
    } catch (error: any) {
      setUploadResult({ success: false, message: error.message || '网络错误' })
      setConfirmBubble({ show: false, fileName: null, position: { top: 0, left: 0 } })
    }
  }

  // 取消删除
  const cancelDelete = () => {
    setConfirmBubble({ show: false, fileName: null, position: { top: 0, left: 0 } })
  }

  // 获取学科标签
  const getCategoryLabel = (category: string) => {
    return SUBJECT_LABELS[category] || category
  }

  // 获取学科图标
  const getCategoryIcon = (category: string) => {
    return SUBJECT_ICONS[category] || '📄'
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📚</span>
              <h2 className="text-xl font-bold">知识库管理</h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* 上传区域 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📤</span>
                上传文档
              </h3>

              {/* 文件选择 */}
              <div>
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.md,.pdf,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="file-input"
                  className={`flex items-center justify-center w-full px-4 py-8 border-2 rounded-lg transition ${
                    isUploading
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                      : 'border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="text-center">
                    {isUploading ? (
                      <>
                        <div className="w-12 h-12 mx-auto border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">正在上传...</p>
                          <p className="text-xs text-gray-500 mt-1">请稍候</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            {selectedFile ? (
                              <span className="font-medium text-blue-600">{selectedFile.name}</span>
                            ) : (
                              <span>点击选择文件即可上传</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">支持 TXT、MD、PDF、JSON 格式</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* 上传结果消息 */}
              {uploadResult && (
                <div
                  className={`p-4 rounded-lg ${
                    uploadResult.success
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{uploadResult.success ? '✓' : '✗'}</span>
                    <span className="font-medium">{uploadResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="border-t border-gray-200" />

            {/* 知识库文件列表 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📁</span>
                知识库文件
              </h3>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : knowledgeFiles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p>知识库为空</p>
                  <p className="text-sm mt-2">上传文档后，它们会显示在这里</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {knowledgeFiles.map((file, index) => (
                    <div
                      key={`${file.type}-${index}`}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition group cursor-pointer"
                      onClick={() => {
                        if (file.type === 'local') {
                          setDetailFile({ category: file.category })
                        } else {
                          setDetailFile({ fileName: file.name })
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{getCategoryIcon(file.category || '')}</span>
                            <div className="font-medium text-gray-900 truncate">
                              {file.type === 'local' ? getCategoryLabel(file.category || '') : file.name}
                            </div>
                            <span className="text-xs text-blue-500 ml-2">点击查看</span>
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                file.type === 'local'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {file.type === 'local' ? '本地' : '已上传'}
                              </span>
                              {file.itemCount && (
                                <span>{file.itemCount} 条内容</span>
                              )}
                              {file.size && (
                                <span>{formatSize(file.size)}</span>
                              )}
                            </div>
                            {file.type === 'uploaded' && (
                              <div className="text-xs">{file.name}</div>
                            )}
                          </div>
                        </div>
                        {file.type === 'uploaded' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              showDeleteConfirm(file.name, e)
                            }}
                            className="ml-2 p-2 text-red-600 hover:bg-red-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                            title="删除文档"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      {detailFile && (
        <DetailModal
          category={detailFile.category}
          fileName={detailFile.fileName}
          onClose={() => setDetailFile(null)}
        />
      )}

      {/* 确认气泡 */}
      <ConfirmBubble
        show={confirmBubble.show}
        onConfirm={executeDelete}
        onCancel={cancelDelete}
        position={confirmBubble.position}
      />
    </>
  )
}

export default AdminPanel
