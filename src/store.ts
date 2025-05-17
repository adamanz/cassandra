'use client'

import { create } from 'zustand'
import { Message } from 'ai'

interface PlaygroundStore {
  messages: Message[]
  isStreaming: boolean
  chatInputRef: React.RefObject<HTMLTextAreaElement> | null
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setIsStreaming: (isStreaming: boolean) => void
  setChatInputRef: (ref: React.RefObject<HTMLTextAreaElement>) => void
  clearMessages: () => void
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  messages: [],
  isStreaming: false,
  chatInputRef: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setChatInputRef: (ref) => set({ chatInputRef: ref }),
  clearMessages: () => set({ messages: [] }),
}))