import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MODELSCOPE_API_KEY = 'modelscope_api_key'
const XMOV_APP_ID = 'xmov_app_id'
const XMOV_APP_SECRET = 'xmov_app_secret'

interface ApiKeyState {
  modelScopeApiKey: string
  xmovAppId: string
  xmovAppSecret: string
  hasKeys: boolean
  setKeys: (keys: {
    modelScopeApiKey: string
    xmovAppId: string
    xmovAppSecret: string
  }) => void
  clearKeys: () => void
}

/**
 * 从localStorage读取密钥
 */
function loadFromStorage(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

/**
 * 保存到localStorage
 */
function saveToStorage(key: string, value: string): void {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e)
  }
}

export const useApiKeyStore = create<ApiKeyState>((set, get) => ({
  // 从localStorage初始化状态
  modelScopeApiKey: loadFromStorage(MODELSCOPE_API_KEY),
  xmovAppId: loadFromStorage(XMOV_APP_ID),
  xmovAppSecret: loadFromStorage(XMOV_APP_SECRET),

  // 检查是否有有效密钥
  get hasKeys(): boolean {
    const state = get()
    return !!(
      state.modelScopeApiKey &&
      state.xmovAppId &&
      state.xmovAppSecret
    )
  },

  // 设置密钥
  setKeys: (keys) => {
    saveToStorage(MODELSCOPE_API_KEY, keys.modelScopeApiKey)
    saveToStorage(XMOV_APP_ID, keys.xmovAppId)
    saveToStorage(XMOV_APP_SECRET, keys.xmovAppSecret)

    set({
      modelScopeApiKey: keys.modelScopeApiKey,
      xmovAppId: keys.xmovAppId,
      xmovAppSecret: keys.xmovAppSecret
    })
  },

  // 清除密钥
  clearKeys: () => {
    localStorage.removeItem(MODELSCOPE_API_KEY)
    localStorage.removeItem(XMOV_APP_ID)
    localStorage.removeItem(XMOV_APP_SECRET)

    set({
      modelScopeApiKey: '',
      xmovAppId: '',
      xmovAppSecret: ''
    })
  }
}))
