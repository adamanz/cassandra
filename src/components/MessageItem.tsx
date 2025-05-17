import React, { memo } from 'react';
import { type Message } from 'ai/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { AgentThinkingLoader } from './AgentThinkingLoader';
import { cn } from '@/utils/cn';

interface MessageItemProps {
  message: Message;
  aiEmoji?: string;
  isLoading?: boolean;
}

export const MessageItem = memo(({ message, aiEmoji = '📅', isLoading = false }: MessageItemProps) => {
  const isUser = message.role === 'user';
  
  if (isUser) {
    return (
      <div className="flex items-start justify-end mb-6">
        <div className="flex items-start gap-3 max-w-[80%]">
          <div className="flex flex-col">
            <div className={cn(
              "rounded-xl px-4 py-2.5",
              "bg-primary text-primary-foreground",
              "shadow-sm"
            )}>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
        </div>
      </div>
    );
  }
  
  // AI message
  return (
    <div className="flex items-start mb-6">
      <div className="flex items-start gap-3 max-w-[80%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-sm">{aiEmoji}</span>
        </div>
        <div className="flex flex-col">
          {isLoading ? (
            <div className="rounded-xl px-4 py-3 bg-background-secondary">
              <AgentThinkingLoader />
            </div>
          ) : (
            <div className={cn(
              "rounded-xl px-4 py-3",
              "bg-background/50 dark:bg-background-secondary",
              "shadow-sm border border-border/50"
            )}>
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';