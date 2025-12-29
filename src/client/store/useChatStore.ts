import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '@shared/types'

interface ChatState {
  messages: ChatMessage[]
  isProcessing: boolean
  currentResponse: string
  sessionId: string

  addMessage: (message: ChatMessage) => void
  setProcessing: (processing: boolean) => void
  setCurrentResponse: (response: string) => void
  appendCurrentResponse: (text: string) => void
  clearMessages: () => void
  getConversationHistory: () => Array<{ role: string; content: string }>
  setSessionId: (sessionId: string) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isProcessing: false,
      currentResponse: '',
      sessionId: '',

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message]
        })),

      setProcessing: (processing) =>
        set({ isProcessing: processing }),

      setCurrentResponse: (response) =>
        set({ currentResponse: response }),

      appendCurrentResponse: (text) =>
        set((state) => ({
          currentResponse: state.currentResponse + text
        })),

      clearMessages: () =>
        set({ messages: [], currentResponse: '' }),

      getConversationHistory: () => {
        return get().messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      },

      setSessionId: (sessionId) => set({ sessionId })
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-50), // 只保留最近50条
        sessionId: state.sessionId
      })
    }
  )
)
