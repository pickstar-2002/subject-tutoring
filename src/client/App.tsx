import React, { useEffect, useRef, useState } from 'react'
import { useChatStore, useSubjectStore, useAvatarStore, useApiKeyStore } from './store'
import { chatService } from './services'
import { AvatarContainer } from './components/Avatar'
import { ChatBox, InputArea } from './components/Chat'
import { ApiKeyModal } from './components/UI'

function App() {
  const controllerRef = useRef<any>(null)

  // Chat Store
  const {
    messages,
    addMessage,
    setProcessing,
    currentResponse,
    setCurrentResponse,
    appendCurrentResponse,
    clearMessages,
    getConversationHistory,
    sessionId,
    setSessionId
  } = useChatStore()

  // Subject Store
  const {
    incrementStreak
  } = useSubjectStore()

  // Avatar Store
  const { setState: setAvatarState } = useAvatarStore()

  // API Key Management
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const { hasKeys } = useApiKeyStore()

  // 检查是否需要显示密钥输入对话框
  useEffect(() => {
    if (!hasKeys) {
      setShowApiKeyModal(true)
    }
  }, [hasKeys])

  // 初始化会话
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`session_${Date.now()}`)
    }
  }, [])

  // 同步数字人控制器引用 - 使用轮询确保获取到控制器
  useEffect(() => {
    const checkController = () => {
      const controller = (window as any).avatarController
      if (controller && controller !== controllerRef.current) {
        controllerRef.current = controller
        console.log('[App] Avatar controller synced:', controller)
      }
    }

    // 立即检查一次
    checkController()

    // 轮询检查控制器是否可用（每秒检查一次，最多检查10秒）
    const intervals = []
    for (let i = 0; i < 10; i++) {
      const timeout = setTimeout(checkController, i * 1000)
      intervals.push(timeout)
    }

    return () => {
      intervals.forEach(clearTimeout)
    }
  }, [])

  // 处理消息发送
  const handleSendMessage = async (text: string, images?: string[]) => {
    // 确保控制器是最新的
    const controller = (window as any).avatarController
    if (controller && controller !== controllerRef.current) {
      controllerRef.current = controller
      console.log('[App] Avatar controller updated before send:', controller)
    }
    // 获取对话历史（在添加当前消息之前获取）
    const history = getConversationHistory()

    // 构建用户消息内容（支持多模态）
    const userContent: string | any[] = text
    let contentForDisplay: string | any[] = text

    // 如果有图片，构建多模态内容用于显示
    if (images && images.length > 0) {
      contentForDisplay = [
        { type: 'text', text: text || '请仔细观察这道题目，给出详细的解题步骤和答案' }
      ]
      for (const imageUrl of images) {
        contentForDisplay.push({
          type: 'image_url',
          image_url: { url: imageUrl }
        })
      }
    }

    // 添加用户消息到本地状态
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: contentForDisplay,
      timestamp: Date.now()
    })

    setProcessing(true)
    setCurrentResponse('')

    // 数字人进入倾听状态
    setAvatarState('listen')
    controllerRef.current?.setListen()

    // 数字人进入思考状态
    setAvatarState('think')
    controllerRef.current?.setThink()

    // 流式对话
    await chatService.sendMessageStream(
      {
        message: text,
        images: images,
        sessionId,
        conversationHistory: history
      },
      // onChunk
      (chunk) => {
        appendCurrentResponse(chunk)
      },
      // onComplete
      (fullResponse) => {
        // 添加助手消息
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now()
        })

        setCurrentResponse('')
        setProcessing(false)
        incrementStreak()

        // 数字人说话 - 使用完整回复
        controllerRef.current?.speakStream(
          (async function* () {
            for (const char of fullResponse) {
              yield char
            }
          })()
        ).then(() => {
          setAvatarState('interactive_idle')
        }).catch((error) => {
          console.error('[App] Speech error:', error)
          setAvatarState('idle')
        })
      },
      // onError
      (error) => {
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: Date.now()
        })
        setCurrentResponse('')
        setProcessing(false)
        setAvatarState('idle')
      }
    )
  }

  // 清空对话
  const handleClearChat = () => {
    clearMessages()
    chatService.clearSession(sessionId)
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* API Key Modal */}
      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}

      {/* 顶部导航 - 紧凑版 */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📚</span>
              <div>
                <h1 className="text-lg font-bold text-gray-800">学科辅导</h1>
                <p className="text-xs text-gray-500 hidden sm:block">直观讲解定理，引导独立思考</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="text-xs text-gray-600 hover:text-blue-600 transition px-2 py-1 flex items-center space-x-1"
                title="配置API密钥"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">设置</span>
              </button>
              <button
                onClick={handleClearChat}
                className="text-xs text-gray-600 hover:text-blue-600 transition px-2 py-1"
              >
                清空对话
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 - 占满剩余空间 */}
      <main className="flex-1 overflow-hidden px-4 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full">
          {/* 左侧：数字人 - 占3列，填满整列 */}
          <div className="lg:col-span-3 h-full">
            <AvatarContainer
              onSpeakingStart={() => setAvatarState('speak')}
              onSpeakingEnd={() => setAvatarState('interactive_idle')}
              onWidgetEvent={(widget) => console.log('Widget:', widget)}
            />
          </div>

          {/* 右侧：对话记录和其他面板 - 占2列 */}
          <div className="lg:col-span-2 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
            {/* 对话记录 */}
            <div className="flex-1 min-h-0">
              <ChatBox
                messages={messages}
                currentResponse={currentResponse}
                isProcessing={useChatStore.getState().isProcessing}
                onQuickQuestion={handleSendMessage}
                messageCount={messages.length}
                learningStreak={useSubjectStore.getState().learningProgress.currentStreak}
              />
            </div>

            {/* 输入框 */}
            <div className="flex-shrink-0">
              <InputArea onSend={handleSendMessage} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
