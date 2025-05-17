import type { Message } from 'ai/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '@/utils/cn';

export function ChatMessageBubble(props: { message: Message; aiEmoji?: string }) {
  return (
    <div
      className={cn(
        `rounded-lg max-w-[80%] mb-8 flex`,
        props.message.role === 'user' ? 'bg-secondary text-secondary-foreground px-4 py-2' : null,
        props.message.role === 'user' ? 'ml-auto' : 'mr-auto',
      )}
    >
      {props.message.role !== 'user' && (
        <div className="mr-4 bg-secondary rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {props.aiEmoji}
        </div>
      )}

      <div className="chat-message-bubble whitespace-pre-wrap flex flex-col">
        <MarkdownRenderer content={props.message.content} />
      </div>
    </div>
  );
}
