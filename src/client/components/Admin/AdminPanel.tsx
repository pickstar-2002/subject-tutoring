import React, { useState, useEffect } from 'react'

interface UploadedDocument {
  id: string
  filename: string
  uploadTime: number
  category: string
}

interface Category {
  value: string
  label: string
  icon: string
}

const SUBJECT_CATEGORIES: Category[] = [
  { value: 'math', label: '数学', icon: '📐' },
  { value: 'physics', label: '物理', icon: '⚛️' },
  { value: 'chemistry', label: '化学', icon: '🧪' },
  { value: 'biology', label: '生物', icon: '🧬' },
  { value: 'logic', label: '逻辑', icon: '🧩' }
]

const DIFFICULTY_LEVELS = [
  { value: '初级', label: '初级' },
  { value: '中级', label: '中级' },
  { value: '高级', label: '高级' }
]

interface AdminPanelProps {
  onClose?: () => void
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'documents'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState('math')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('初级')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 加载已上传文档列表
  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge/documents/list')
      const data = await response.json()
      if (data.success) {
        setDocuments(data.data)
      }
    } catch (error) {
      console.error('Load documents error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments()
    }
  }, [activeTab])

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  // 上传文档
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadResult({ success: false, message: '请选择文件' })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('document', selectedFile)
      formData.append('category', category)
      if (topic) {
        formData.append('topic', topic)
      }
      formData.append('difficulty', difficulty)

      const response = await fetch('/api/knowledge/upload-document', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setUploadResult({ success: true, message: result.message || '上传成功！' })
        setSelectedFile(null)
        setTopic('')
        // 重置文件输入
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setUploadResult({ success: false, message: result.error?.message || '上传失败' })
      }
    } catch (error: any) {
      setUploadResult({ success: false, message: error.message || '网络错误' })
    } finally {
      setIsUploading(false)
    }
  }

  // 删除文档
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个文档吗？')) return

    try {
      const response = await fetch(`/api/knowledge/documents/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setDocuments(documents.filter(doc => doc.id !== id))
      } else {
        alert(result.error?.message || '删除失败')
      }
    } catch (error: any) {
      alert(error.message || '网络错误')
    }
  }

  // 获取学科标签
  const getCategoryLabel = (categoryValue: string) => {
    const cat = SUBJECT_CATEGORIES.find(c => c.value === categoryValue)
    return cat ? `${cat.icon} ${cat.label}` : categoryValue
  }

  return (
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

        {/* 标签页切换 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              activeTab === 'upload'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📤 上传课件
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              activeTab === 'documents'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📄 已上传文档 ({documents.length})
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-6">
              {/* 文件选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择课件文件 <span className="text-gray-400">(支持 TXT、MD、PDF)</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    id="file-input"
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={handleFileSelect}
                    className="flex-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                </div>
                {selectedFile && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center space-x-2">
                    <span>已选择:</span>
                    <span className="font-medium text-blue-600">{selectedFile.name}</span>
                    <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* 学科选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">学科分类</label>
                <div className="grid grid-cols-5 gap-2">
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-lg border-2 transition ${
                        category === cat.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 主题（可选） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主题 <span className="text-gray-400">(可选)</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例如：平面几何、力学、有机化学..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 难度选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">难度级别</label>
                <div className="flex space-x-3">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setDifficulty(level.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition ${
                        difficulty === level.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
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

              {/* 上传按钮 */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    <span>上传到知识库</span>
                  </>
                )}
              </button>

              {/* 提示信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">📖 支持的文件格式：</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>TXT</strong> - 纯文本文件</li>
                  <li>• <strong>MD</strong> - Markdown 格式文件</li>
                  <li>• <strong>PDF</strong> - 需要安装额外的解析库</li>
                </ul>
                <p className="mt-2 font-medium">💡 建议：</p>
                <p className="text-blue-700">文档第一行将作为定理/原理的标题。内容中可以包含描述、公式、证明步骤、示例等。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p>还没有上传任何文档</p>
                  <p className="text-sm mt-2">上传课件后，它们会显示在这里</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">📄</span>
                          <div>
                            <div className="font-medium text-gray-900">{doc.filename}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>{getCategoryLabel(doc.category)}</span>
                              <span>•</span>
                              <span>{new Date(doc.uploadTime).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="删除文档"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
