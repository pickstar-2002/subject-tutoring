import type { ChatMessage, Theorem, Widget } from '../../shared/types'

export interface ThinkingResult {
  questions: string[]
  hints: string[]
  relatedTheorems: string[]
  visualAids: Widget[]
  suggestedSteps: string[]
}

/**
 * 思考引导服务 - 苏格拉底式提问
 */
export class ThinkingService {
  /**
   * 分析用户问题，生成引导性思考
   */
  analyzeUserQuestion(message: string, currentTheorem?: Theorem): ThinkingResult {
    const result: ThinkingResult = {
      questions: [],
      hints: [],
      relatedTheorems: [],
      visualAids: [],
      suggestedSteps: []
    }

    // 如果当前正在学习某个定理，使用其苏格拉底式问题
    if (currentTheorem && currentTheorem.socraticQuestions.length > 0) {
      result.questions = currentTheorem.socraticQuestions.slice(0, 3)
      result.relatedTheorems = currentTheorem.relatedTheorems
      result.suggestedSteps = currentTheorem.proofSteps.map(s => s.title)
    } else {
      // 根据问题内容生成通用思考问题
      result.questions = this.generateGenericQuestions(message)
      result.suggestedSteps = this.generateGenericSteps(message)
    }

    return result
  }

  /**
   * 生成通用思考问题
   */
  private generateGenericQuestions(message: string): string[] {
    const questions: string[] = []

    // 检测问题类型
    if (message.includes('为什么') || message.includes('证明')) {
      questions.push(
        '你认为这个结论成立的理由是什么？',
        '你能举一个具体的例子来验证吗？',
        '如果条件改变，结论还成立吗？'
      )
    } else if (message.includes('怎么') || message.includes('如何')) {
      questions.push(
        '你已经尝试了哪些方法？',
        '这个问题和你之前学过的什么内容类似？',
        '你能把问题分解成更小的步骤吗？'
      )
    } else if (message.includes('不懂') || message.includes('不理解')) {
      questions.push(
        '具体是哪个部分让你困惑？',
        '你能用自己的话描述一下对这个概念的理解吗？',
        '我们是不是应该从基础概念开始回顾？'
      )
    } else {
      questions.push(
        '你目前对这个概念有多少了解？',
        '你最想了解这个概念的哪个方面？',
        '你认为学习这个概念有什么实际应用吗？'
      )
    }

    return questions.slice(0, 3)
  }

  /**
   * 生成通用解题步骤
   */
  private generateGenericSteps(message: string): string[] {
    return [
      '理解题目要求和已知条件',
      '回顾相关的定理和公式',
      '尝试建立已知与未知之间的联系',
      '验证你的结论是否正确'
    ]
  }

  /**
   * 生成渐进式提示
   */
  generateProgressiveHints(attemptCount: number, theorem?: Theorem): string[] {
    const hints: string[] = []

    if (theorem) {
      switch (attemptCount) {
        case 1:
          hints.push('提示：仔细阅读定理的描述部分')
          break
        case 2:
          hints.push('提示：看看公式部分，注意每个符号的含义')
          break
        case 3:
          hints.push(`提示：参考证明步骤的第1步：${theorem.proofSteps[0]?.title}`)
          break
        default:
          hints.push('提示：看看例题部分，理解如何应用这个定理')
      }
    } else {
      switch (attemptCount) {
        case 1:
          hints.push('提示：先理解问题的核心是什么')
          break
        case 2:
          hints.push('提示：想想相关的定义和概念')
          break
        case 3:
          hints.push('提示：尝试画图或举具体例子')
          break
        default:
          hints.push('提示：可以回顾一下之前学过的类似问题')
      }
    }

    return hints
  }

  /**
   * 检测用户理解程度
   */
  detectUnderstanding(userResponse: string): number {
    let score = 0

    // 积极指标
    const positiveIndicators = ['理解', '明白了', '原来如此', '懂了', '清楚了']
    // 困惑指标
    const confusedIndicators = ['不懂', '不理解', '困惑', '不明白', '还是不知道']

    for (const indicator of positiveIndicators) {
      if (userResponse.includes(indicator)) {
        score += 2
      }
    }

    for (const indicator of confusedIndicators) {
      if (userResponse.includes(indicator)) {
        score -= 1
      }
    }

    return Math.max(0, Math.min(5, score + 3)) // 返回0-5分
  }

  /**
   * 决定是否继续引导
   */
  shouldContinueGuiding(understandingScore: number, questionCount: number): boolean {
    // 如果理解度低于3分，且提问次数少于最大值，继续引导
    return understandingScore < 3 && questionCount < 3
  }

  /**
   * 生成鼓励性反馈
   */
  generateEncouragement(understandingScore: number): string {
    if (understandingScore >= 4) {
      return '很好！你的理解很到位。'
    } else if (understandingScore >= 3) {
      return '不错！你已经掌握了基本概念。'
    } else if (understandingScore >= 2) {
      return '方向对了，我们继续深入思考。'
    } else {
      return '没关系，我们换个角度来理解。'
    }
  }
}

export default new ThinkingService()
