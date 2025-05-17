'use client'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { usePlaygroundStore } from '@/store'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

const ChatInput = () => {
  const { setMessages, setIsStreaming } = usePlaygroundStore()
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onResponse() {
      setIsStreaming(true)
    },
    onFinish() {
      setIsStreaming(false)
    },
    onError(error) {
      setIsStreaming(false)
      toast.error(error.message)
    },
  })

  // Update store when messages change
  useEffect(() => {
    setMessages(messages)
  }, [messages, setMessages])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    handleSubmit(e)
  }

  return (
    <form onSubmit={onSubmit} className="relative mx-auto mb-1 flex w-full max-w-2xl items-end justify-center gap-x-2">
      <Textarea
        placeholder="Ask me about your calendar..."
        value={input}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            !e.nativeEvent.isComposing &&
            !e.shiftKey &&
            !isLoading
          ) {
            e.preventDefault()
            onSubmit(e)
          }
        }}
        className="min-h-[44px] max-h-[200px] resize-none"
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={!input.trim() || isLoading}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}

export default ChatInput