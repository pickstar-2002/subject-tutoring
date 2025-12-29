import { create } from 'zustand'
import type { AvatarState, Widget } from '@shared/types'

interface AvatarStore {
  state: AvatarState
  isSpeaking: boolean
  volume: number
  currentWidget: Widget | null

  setState: (state: AvatarState) => void
  setSpeaking: (speaking: boolean) => void
  setVolume: (volume: number) => void
  setWidget: (widget: Widget | null) => void

  // 快捷操作
  setIdle: () => void
  setListen: () => void
  setThink: () => void
  setInteractiveIdle: () => void
}

export const useAvatarStore = create<AvatarStore>((set) => ({
  state: 'offline',
  isSpeaking: false,
  volume: 1.0,
  currentWidget: null,

  setState: (state) => set({ state }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setVolume: (volume) => set({ volume }),
  setWidget: (widget) => set({ currentWidget: widget }),

  setIdle: () => set({ state: 'idle' }),
  setListen: () => set({ state: 'listen' }),
  setThink: () => set({ state: 'think' }),
  setInteractiveIdle: () => set({ state: 'interactive_idle' })
}))
