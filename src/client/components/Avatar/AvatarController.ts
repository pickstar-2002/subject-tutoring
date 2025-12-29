/**
 * 魔珐星云具身驱动SDK控制器
 */
import type { AvatarState, SpeakOptions, Widget } from '@shared/types'
import { AVATAR_STATE_LABELS } from '@shared/constants'

/**
 * 句子边界检测器配置
 */
interface SentenceBoundaryConfig {
  /** 句子结束标点符号 */
  sentenceEndings: RegExp
  /** 最小句子长度（字符数） */
  minSentenceLength: number
  /** 最大句子长度（字符数），超过则强制分段 */
  maxSentenceLength: number
  /** 句子间停顿时间（毫秒） */
  pauseDuration: number
}

/**
 * 文本缓冲器 - 用于流式文本的句子边界检测
 */
class TextBuffer {
  private buffer: string = ''
  private config: SentenceBoundaryConfig
  private onSentenceComplete: (sentence: string, isFinal: boolean) => void

  constructor(
    config: SentenceBoundaryConfig,
    onSentenceComplete: (sentence: string, isFinal: boolean) => void
  ) {
    this.config = config
    this.onSentenceComplete = onSentenceComplete
  }

  /**
   * 添加文本片段
   */
  append(text: string): void {
    this.buffer += text
    this.processBuffer()
  }

  /**
   * 处理缓冲区，提取完整句子
   */
  private processBuffer(): void {
    while (true) {
      const bufferLength = this.buffer.length

      // 检查是否超过最大长度
      if (bufferLength >= this.config.maxSentenceLength) {
        // 在最大长度处强制分段（优先在标点处，否则在空格处）
        let splitIndex = this.findBestSplitIndex()
        if (splitIndex === -1) splitIndex = this.config.maxSentenceLength

        const sentence = this.buffer.substring(0, splitIndex).trim()
        if (sentence) {
          this.onSentenceComplete(sentence, false)
        }
        this.buffer = this.buffer.substring(splitIndex).trim()
        continue
      }

      // 检查句子结束标记
      const match = this.buffer.match(this.config.sentenceEndings)
      if (match && match.index !== undefined) {
        const endIndex = match.index + match[0].length
        const sentence = this.buffer.substring(0, endIndex).trim()

        // 检查最小长度
        if (sentence.length >= this.config.minSentenceLength) {
          this.onSentenceComplete(sentence, false)
          this.buffer = this.buffer.substring(endIndex).trim()
          continue
        }
      }

      // 没有更多完整句子了
      break
    }
  }

  /**
   * 查找最佳分割位置
   */
  private findBestSplitIndex(): number {
    // 优先在标点符号处分割
    const punctuationMatch = this.buffer.match(/([,，、;；])/)
    if (punctuationMatch && punctuationMatch.index !== undefined) {
      return punctuationMatch.index + 1
    }

    // 其次在空格处分割
    const spaceMatch = this.buffer.match(/\s+/)
    if (spaceMatch && spaceMatch.index !== undefined) {
      return spaceMatch.index + 1
    }

    return -1
  }

  /**
   * 完成输入，返回剩余内容
   */
  flush(): void {
    if (this.buffer.trim()) {
      this.onSentenceComplete(this.buffer.trim(), true)
      this.buffer = ''
    }
  }
}

export interface AvatarConfig {
  containerId: string
  appId: string
  appSecret: string
  onStateChange?: (state: AvatarState) => void
  onVoiceStart?: () => void
  onVoiceEnd?: () => void
  onWidgetEvent?: (widget: Widget) => void
  onError?: (error: any) => void
}

export class AvatarController {
  private sdk: any = null
  private containerSelector: string
  private config: AvatarConfig
  private currentState: AvatarState = 'offline'
  private voiceEndPromise: { resolve: () => void; reject: (reason: any) => void } | null = null

  constructor(config: AvatarConfig) {
    this.config = config
    // 确保 containerId 带有 # 前缀
    this.containerSelector = config.containerId.startsWith('#')
      ? config.containerId
      : `#${config.containerId}`
  }

  /**
   * 初始化SDK
   */
  async initialize(): Promise<void> {
    // 等待SDK加载完成（SDK已在index.html中引入）
    const maxWaitTime = 10000 // 最多等待10秒
    const checkInterval = 100
    let waitedTime = 0

    while (!(window as any).XmovAvatar && waitedTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      waitedTime += checkInterval
    }

    if (!(window as any).XmovAvatar) {
      throw new Error('SDK加载超时，请检查网络连接')
    }

    // 再等待一段时间确保SDK完全初始化
    await new Promise(resolve => setTimeout(resolve, 1000))

    const XmovAvatar = (window as any).XmovAvatar

    // 检查容器是否存在
    const container = document.querySelector(this.containerSelector)
    if (!container) {
      throw new Error(`容器 ${this.containerSelector} 不存在`)
    }

    this.sdk = new XmovAvatar({
      containerId: this.containerSelector,
      appId: this.config.appId,
      appSecret: this.config.appSecret,
      gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa/session',

      // Widget事件处理
      onWidgetEvent: (data: any) => {
        console.log('[Avatar] Widget Event:', data)
        this.config.onWidgetEvent?.(data)
      },

      // 代理Widget处理
      proxyWidget: {
        'widget_pic': (data: any) => this.handleImageWidget(data),
        'widget_slideshow': (data: any) => this.handleSlideshowWidget(data)
      },

      // 状态变化回调
      onStateChange: (state: string) => {
        this.currentState = state as AvatarState
        this.config.onStateChange?.(this.currentState)
        console.log(`[Avatar] State: ${AVATAR_STATE_LABELS[state as AvatarState] || state}`)
      },

      // 语音状态回调
      onVoiceStateChange: (status: string) => {
        console.log('[Avatar] Voice status:', status)
        if (status === 'start') {
          this.config.onVoiceStart?.()
        } else if (status === 'end') {
          this.config.onVoiceEnd?.()
          // 触发等待promise
          if (this.voiceEndPromise) {
            this.voiceEndPromise.resolve()
            this.voiceEndPromise = null
          }
        }
      },

      // 网络信息
      onNetworkInfo: (info: any) => {
        console.log('[Avatar] Network Info:', info)
      },

      // SDK消息
      onMessage: (message: any) => {
        console.log('[Avatar] Message:', message)
      },

      onStatusChange: (status: any) => {
        console.log('[Avatar] Status Change:', status)
      },

      onStateRenderChange: (state: string, duration: number) => {
        console.log('[Avatar] State Render Change:', state, duration)
      },

      // 禁用日志以避免调试工具问题
      enableLogger: false
    })

    // 初始化连接
    await this.sdk.init({
      onDownloadProgress: (progress: number) => {
        console.log(`[Avatar] Loading progress: ${progress}%`)
      },
      onError: (error: any) => {
        console.error('[Avatar] Init Error:', error)
        this.config.onError?.(error)
      },
      onClose: () => {
        console.log('[Avatar] Connection closed')
      }
    })

    console.log('[Avatar] SDK initialized')
  }

  /**
   * 加载SDK脚本
   */
  private loadSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://media.youyan.xyz/youling-lite-sdk/index.umd.0.1.0-alpha.45.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load SDK'))
      document.head.appendChild(script)
    })
  }

  /**
   * 设置待机状态
   */
  setIdle(): void {
    this.sdk?.idle()
  }

  /**
   * 设置互动待机状态
   */
  setInteractiveIdle(): void {
    this.sdk?.interactive_idle()
  }

  /**
   * 设置倾听状态
   */
  setListen(): void {
    this.sdk?.listen()
  }

  /**
   * 设置思考状态
   */
  setThink(): void {
    this.sdk?.think()
  }

  /**
   * 说话
   */
  speak(options: SpeakOptions): void {
    const { text, isStart = true, isEnd = true } = options
    this.sdk?.speak(text, isStart, isEnd)
  }

  /**
   * 流式说话 - 完全不分段，一次性说完
   */
  async speakStream(textStream: AsyncIterable<string> | Generator<string>): Promise<void> {
    let fullText = ''

    // 先收集完整文本
    for await (const chunk of textStream) {
      fullText += chunk
    }

    console.log('[Avatar] Speaking all at once, length:', fullText.length)

    // 一次性说完全部内容，不分段
    await this.speakWithWait({ text: fullText.trim(), isStart: true, isEnd: true })
  }

  /**
   * 实时流式说话 - 边生成边说话
   * @param textStream 文本流
   * @param config 分段配置（可选）
   */
  async speakStreamRealtime(
    textStream: AsyncIterable<string> | Generator<string>,
    config?: Partial<SentenceBoundaryConfig>
  ): Promise<void> {
    // 默认配置
    const defaultConfig: SentenceBoundaryConfig = {
      sentenceEndings: /([。！？.!?]+|\n)/,  // 句子结束标点
      minSentenceLength: 5,                   // 最小句子长度
      maxSentenceLength: 100,                 // 最大句子长度
      pauseDuration: 300                      // 句子间停顿（毫秒）
    }

    const finalConfig = { ...defaultConfig, ...config }
    let sentenceIndex = 0
    let isStreamComplete = false

    console.log('[Avatar] Starting realtime speech with config:', finalConfig)

    // 创建句子队列和说话任务
    const sentenceQueue: string[] = []
    let isSpeaking = false
    let speakComplete: ((value: void) => void) | null = null

    // 说话工作函数 - 持续处理队列直到流结束
    const speakWorker = async (): Promise<void> => {
      while (true) {
        const sentence = sentenceQueue.shift()

        if (!sentence) {
          // 队列为空，检查是否流已结束
          if (isStreamComplete) {
            // 流已结束且队列为空，退出
            break
          }
          // 等待新句子
          await new Promise<void>(resolve => {
            speakComplete = resolve
          })
          continue
        }

        isSpeaking = true
        const isStart = sentenceIndex === 0
        const isLast = sentenceQueue.length === 0 && isStreamComplete

        console.log(`[Avatar] Speaking sentence ${sentenceIndex + 1}:`, sentence.substring(0, 30) + '...')

        await this.speakWithWait({ text: sentence, isStart, isEnd: isLast })

        // 句子间停顿
        if (!isLast) {
          await this.delay(finalConfig.pauseDuration)
        }

        isSpeaking = false
        sentenceIndex++
      }
    }

    // 启动说话工作线程
    const workerPromise = speakWorker()

    // 创建文本缓冲器
    const buffer = new TextBuffer(finalConfig, (sentence: string, isFinal: boolean) => {
      console.log('[Avatar] Sentence detected:', sentence.substring(0, 30) + '...')
      sentenceQueue.push(sentence)

      // 如果说话线程在等待，唤醒它
      if (speakComplete && !isSpeaking) {
        const resolve = speakComplete
        speakComplete = null
        resolve()
      }
    })

    // 处理文本流
    try {
      for await (const chunk of textStream) {
        buffer.append(chunk)
      }

      // 标记流已结束
      isStreamComplete = true

      // 刷新剩余内容
      buffer.flush()

      console.log('[Avatar] All sentences queued, waiting for completion...')

      // 等待工作线程完成
      await workerPromise

      console.log('[Avatar] Realtime speech completed')
    } catch (error) {
      console.error('[Avatar] Realtime speech error:', error)
      throw error
    }
  }

  /**
   * 说话并等待完成
   */
  private async speakWithWait(options: SpeakOptions): Promise<void> {
    // 创建一个promise来等待语音结束
    const voiceEndPromise = new Promise<void>((resolve, reject) => {
      this.voiceEndPromise = { resolve, reject }
    })

    // 调用说话
    this.speak(options)

    // 等待语音结束或超时（增加到90秒以支持长文本）
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Speech timeout')), 90000)
    })

    try {
      await Promise.race([voiceEndPromise, timeoutPromise])
      console.log('[Avatar] Speech completed')
    } catch (error) {
      console.warn('[Avatar] Speech error or timeout:', error)
    } finally {
      this.voiceEndPromise = null
    }
  }

  /**
   * 延迟工具方法
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 带动作说话
   */
  speakWithAction(text: string, action: string): void {
    const ssml = `<speak>
      <ue4event>
        <type>ka</type>
        <data><action_semantic>${action}</action_semantic></data>
      </ue4event>
      ${text}
    </speak>`

    this.speak({ text: ssml })
  }

  /**
   * 进入离线模式
   */
  setOfflineMode(): void {
    this.sdk?.offlineMode()
  }

  /**
   * 进入在线模式
   */
  setOnlineMode(): void {
    this.sdk?.onlineMode()
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.sdk?.setVolume(volume)
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.sdk?.destroy()
    this.sdk = null
  }

  /**
   * 获取当前状态
   */
  getState(): AvatarState {
    return this.currentState
  }

  /**
   * 处理图片Widget
   */
  private handleImageWidget(data: any): void {
    this.config.onWidgetEvent?.({
      type: 'image',
      data: {
        url: data.url || data.pic_url,
        caption: data.caption,
        alt: data.alt
      }
    })
  }

  /**
   * 处理轮播图Widget
   */
  private handleSlideshowWidget(data: any): void {
    this.config.onWidgetEvent?.({
      type: 'slideshow',
      data: {
        images: data.images || data.slide_list || [],
        autoplay: data.autoplay !== false,
        interval: data.interval || 3000
      }
    })
  }
}

export default AvatarController
