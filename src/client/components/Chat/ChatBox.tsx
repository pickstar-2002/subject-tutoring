import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { ChatMessage } from '@shared/types'
import { QuickActionsPopover } from './QuickActionsPopover'
import 'katex/dist/katex.min.css'

interface ChatBoxProps {
  messages: ChatMessage[]
  currentResponse?: string
  isProcessing?: boolean
  onQuickQuestion?: (question: string) => void
  messageCount?: number
  learningStreak?: number
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  currentResponse,
  isProcessing,
  onQuickQuestion,
  messageCount = 0,
  learningStreak = 0
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const quickActionsButtonRef = useRef<HTMLButtonElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // 上一次的消息数量，用于检测新消息
  const prevMessageCountRef = React.useRef(0)

  // 只在有新消息添加时自动滚动到底部
  React.useEffect(() => {
    const currentCount = messages.length
    const prevCount = prevMessageCountRef.current

    // 只在有新消息时自动滚动
    if (currentCount > prevCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      prevMessageCountRef.current = currentCount
    }
  }, [messages.length])

  // 检测用户手动滚动，显示/隐藏"滚动到底部"按钮
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100
    setShowScrollToBottom(!isAtBottom)
  }

  // 手动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 点击外部关闭弹出框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showQuickActions &&
        quickActionsButtonRef.current &&
        !quickActionsButtonRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.quick-actions-popover')
      ) {
        setShowQuickActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickActions])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h2 className="text-base font-semibold text-gray-800">对话记录</h2>
        <div className="flex items-center space-x-2">
          {onQuickQuestion && (
            <button
              ref={quickActionsButtonRef}
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"
              title="快捷提问"
            >
              <span>⚡</span>
              <span>快捷提问</span>
            </button>
          )}
          <span className="text-xs text-gray-400">{messages.length} 条消息</span>
        </div>
      </div>

      {/* 快捷提问弹出框 */}
      {showQuickActions && onQuickQuestion && (
        <QuickActionsPopover
          buttonRef={quickActionsButtonRef}
          onSelect={(question) => {
            onQuickQuestion(question)
            setShowQuickActions(false)
          }}
        />
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-3 p-2 relative"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* 当前响应（流式） */}
        {currentResponse && (
          <div className="flex justify-start">
            <div className="max-w-md px-4 py-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800">
              <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {currentResponse}
                </ReactMarkdown>
              </div>
              <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1 align-middle" />
            </div>
          </div>
        )}

        {/* 处理中指示器 */}
        {isProcessing && !currentResponse && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-xl bg-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="滚动到底部"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'

  // 检查是否为多模态内容
  const isMultimodal = Array.isArray(message.content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-md px-5 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-gradient-to-br from-blue-50 to-blue-100 text-gray-800'
        }`}
      >
        {/* 多模态内容：显示图片和文本 */}
        {isMultimodal ? (
          <div className="space-y-3">
            {message.content.map((item: any, index: number) => {
              if (item.type === 'text') {
                return (
                  <div key={index} className="text-sm leading-relaxed prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {item.text}
                    </ReactMarkdown>
                  </div>
                )
              } else if (item.type === 'image_url') {
                return (
                  <img
                    key={index}
                    src={item.image_url.url}
                    alt={`上传的图片${index + 1}`}
                    className="max-w-full h-auto rounded-lg border border-gray-300"
                  />
                )
              }
              return null
            })}
          </div>
        ) : (
          /* 纯文本内容 */
          <div className="text-sm leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* 相关定理 */}
        {message.relatedTheorems && message.relatedTheorems.length > 0 && !isUser && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs font-medium text-gray-600 mb-2">📚 相关定理：</p>
            <div className="flex flex-wrap gap-2">
              {message.relatedTheorems.map((theorem, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white/60 rounded-md text-xs text-blue-700"
                >
                  {theorem}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 时间戳 */}
        <span className={`text-xs mt-2 block ${isUser ? 'opacity-70' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}

export default ChatBox
