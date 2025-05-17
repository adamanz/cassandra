'use client'

import { Message } from 'ai'
import { MemoizedMarkdown } from '@/components/MemoizedMarkdown'
import AgentThinkingLoader from './AgentThinkingLoader'
import { CalendarClock, User } from 'lucide-react'

interface MessageItemProps {
  message: Message
  isLast: boolean
  isStreaming: boolean
}

const MessageItem = ({ message, isLast, isStreaming }: MessageItemProps) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isThinking = isStreaming && isLast && !message.content

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <CalendarClock className="h-4 w-4" />
        </div>
      )}
      
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {isThinking ? (
          <AgentThinkingLoader />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isUser ? (
              <p className="m-0">{message.content}</p>
            ) : (
              <MemoizedMarkdown content={message.content} id={message.id} />
            )}
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-400 text-white">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export default MessageItem