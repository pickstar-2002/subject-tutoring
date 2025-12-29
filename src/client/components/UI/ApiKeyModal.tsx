import React, { useState } from 'react'
import { useApiKeyStore } from '../../store'

interface ApiKeyModalProps {
  onClose: () => void
}

// 内置演示密钥
const DEMO_KEYS = {
  modelScopeApiKey: 'ms-85ed98e9-1a8e-41e5-8215-ee563559d069',
  xmovAppId: 'c39e2e7300d042eaabb2a50a01df6edc',
  xmovAppSecret: 'b1e67909c73c4ee6bf9b219587e6664d'
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
  const [modelScopeApiKey, setModelScopeApiKey] = useState('')
  const [xmovAppId, setXmovAppId] = useState('')
  const [xmovAppSecret, setXmovAppSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle')
  const [validationMessage, setValidationMessage] = useState('')

  const setKeys = useApiKeyStore((state) => state.setKeys)

  // 从localStorage恢复已有密钥
  React.useEffect(() => {
    const storedKeys = useApiKeyStore.getState()
    setModelScopeApiKey(storedKeys.modelScopeApiKey)
    setXmovAppId(storedKeys.xmovAppId)
    setXmovAppSecret(storedKeys.xmovAppSecret)
  }, [])

  // 验证 API 密钥
  const handleValidateKey = async () => {
    if (!modelScopeApiKey.trim()) {
      setError('请先输入 API 密钥')
      return
    }

    setValidationStatus('validating')
    setValidationMessage('')
    setError('')

    try {
      const response = await fetch('/api/chat/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: modelScopeApiKey.trim() })
      })

      const data = await response.json()

      if (data.valid) {
        setValidationStatus('valid')
        setValidationMessage(data.message || 'API 密钥验证成功')
      } else {
        setValidationStatus('invalid')
        setValidationMessage(data.error || 'API 密钥无效')
      }
    } catch (err: any) {
      setValidationStatus('invalid')
      setValidationMessage(err.message || '验证请求失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证输入
    if (!modelScopeApiKey.trim() || !xmovAppId.trim() || !xmovAppSecret.trim()) {
      setError('请填写所有必填项')
      return
    }

    setIsLoading(true)

    try {
      // 保存密钥到store和localStorage
      setKeys({
        modelScopeApiKey: modelScopeApiKey.trim(),
        xmovAppId: xmovAppId.trim(),
        xmovAppSecret: xmovAppSecret.trim()
      })

      // 成功后关闭对话框（不需要刷新页面）
      setIsLoading(false)
      onClose()
    } catch (err: any) {
      setError(err.message || '保存密钥失败')
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // 允许跳过，但不保存
    onClose()
  }

  // 使用演示密钥
  const handleUseDemoKeys = () => {
    setModelScopeApiKey(DEMO_KEYS.modelScopeApiKey)
    setXmovAppId(DEMO_KEYS.xmovAppId)
    setXmovAppSecret(DEMO_KEYS.xmovAppSecret)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🔑</span>
              <div>
                <h2 className="text-xl font-bold text-white">配置API密钥</h2>
                <p className="text-sm text-blue-100">请输入您的API密钥以继续使用</p>
              </div>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 魔搭API密钥 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">🤖</span>
                  魔搭 ModelScope API Key <span className="text-red-500 ml-1">*</span>
                </span>
                {/* 验证按钮 */}
                <button
                  type="button"
                  onClick={handleValidateKey}
                  disabled={isLoading || validationStatus === 'validating' || !modelScopeApiKey.trim()}
                  className={`text-xs px-3 py-1 rounded-full border transition flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed
                    ${validationStatus === 'valid'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : validationStatus === 'invalid'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : validationStatus === 'validating'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  {validationStatus === 'validating' ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>验证中...</span>
                    </>
                  ) : validationStatus === 'valid' ? (
                    <>
                      <span>✅</span>
                      <span>有效</span>
                    </>
                  ) : validationStatus === 'invalid' ? (
                    <>
                      <span>❌</span>
                      <span>无效</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>验证密钥</span>
                    </>
                  )}
                </button>
              </span>
            </label>
            <input
              type="password"
              value={modelScopeApiKey}
              onChange={(e) => {
                setModelScopeApiKey(e.target.value)
                // 输入变化时重置验证状态
                if (validationStatus !== 'idle') {
                  setValidationStatus('idle')
                  setValidationMessage('')
                }
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 transition
                ${validationStatus === 'valid'
                  ? 'border-green-300 bg-green-50'
                  : validationStatus === 'invalid'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'}`}
              disabled={isLoading}
            />
            {/* 验证状态消息 */}
            {validationMessage && (
              <div className={`mt-2 text-xs px-3 py-2 rounded-lg flex items-center space-x-2
                ${validationStatus === 'valid'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'}`}>
                <span>{validationStatus === 'valid' ? '💡' : '⚠️'}</span>
                <span>{validationMessage}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              用于调用 DeepSeek-V3 模型进行对话
            </p>
          </div>

          {/* 魔法星云应用ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                <span className="mr-2">✨</span>
                魔珐星云 App ID <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            <input
              type="text"
              value={xmovAppId}
              onChange={(e) => setXmovAppId(e.target.value)}
              placeholder="your-app-id"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isLoading}
            />
          </div>

          {/* 魔法星云应用密钥 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center">
                <span className="mr-2">🔐</span>
                魔珐星云 App Secret <span className="text-red-500 ml-1">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={xmovAppSecret}
                onChange={(e) => setXmovAppSecret(e.target.value)}
                placeholder="your-app-secret"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 说明文字 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">📌 密钥安全说明：</p>
            <ul className="space-y-1 text-xs list-disc list-inside">
              <li>所有密钥仅存储在您的浏览器本地存储（localStorage）中</li>
              <li>密钥不会发送到任何第三方服务器（仅用于API调用）</li>
              <li>您可以随时清除浏览器缓存来删除这些密钥</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex flex-col space-y-3 pt-2">
            {/* 演示密钥按钮 */}
            <button
              type="button"
              onClick={handleUseDemoKeys}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>✨</span>
              <span>使用演示密钥</span>
            </button>

            {/* 分隔线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或手动输入</span>
              </div>
            </div>

            {/* 主按钮组 */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '保存中...' : '保存密钥'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                稍后配置
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApiKeyModal
