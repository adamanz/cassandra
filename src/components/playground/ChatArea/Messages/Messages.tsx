'use client'

import { Message } from 'ai'
import MessageItem from './MessageItem'
import ChatBlankState from './ChatBlankState'
import { usePlaygroundStore } from '@/store'

interface MessagesProps {
  messages: Message[]
}

const Messages = ({ messages }: MessagesProps) => {
  const isStreaming = usePlaygroundStore((state) => state.isStreaming)
  
  if (messages.length === 0) {
    return <ChatBlankState />
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
          isStreaming={isStreaming && index === messages.length - 1}
        />
      ))}
    </div>
  )
}

export default Messages