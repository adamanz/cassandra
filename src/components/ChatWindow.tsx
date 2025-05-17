'use client';

import { type Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, memo, useCallback, useMemo } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { ArrowDown, ArrowUpIcon, LoaderCircle, AlertCircleIcon, RefreshCcw } from 'lucide-react';

import { MessageItem } from '@/components/MessageItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const ChatMessages = memo(function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, index) => (
        <MessageItem 
          key={m.id} 
          message={m} 
          aiEmoji={props.aiEmoji}
          isLoading={index === props.messages.length - 1 && props.isStreaming && m.role === 'assistant' && !m.content}
        />
      ))}
    </div>
  );
});

const ScrollToBottom = memo(function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button variant="outline" className={props.className} onClick={() => scrollToBottom()}>
      <ArrowDown className="w-4 h-4" />
    </Button>
  );
});

const ChatInput = memo(function ChatInput({
  onSubmit,
  value,
  onChange,
  loading,
  disabled,
  placeholder,
  children,
  className,
}: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}) {
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onSubmit(e);
  }, [onSubmit]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full flex-col', className)}
    >
      <div className="border border-input/20 bg-background/50 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto transition-all duration-200 hover:border-primary/30 focus-within:border-primary/50">
        <input
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          disabled={disabled}
          className="border-none outline-none bg-transparent p-4 text-foreground placeholder:text-muted-foreground"
        />

        <div className="flex justify-end mr-2 mb-2">
          <Button
            className="rounded-full p-2 h-10 w-10 hover:scale-105"
            variant="default"
            type="submit"
            size="icon"
            disabled={loading || disabled}
          >
            {loading ? <LoaderCircle className="animate-spin" size={20} /> : <ArrowUpIcon size={20} />}
          </Button>
        </div>
      </div>
    </form>
  );
});

const ErrorNotification = memo(function ErrorNotification({ 
  error,
  onRetry
}: { 
  error: Error | null;
  onRetry: () => void;
}) {
  if (!error) return null;
  
  return (
    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 mb-4 max-w-[768px] mx-auto w-full flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircleIcon className="w-4 h-4" />
        <p className="text-sm">Error connecting. Try logging out and back in.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1 px-2 py-1 h-auto">
        <RefreshCcw className="w-3 h-3" />
      </Button>
    </div>
  );
});

const StickyToBottomContent = memo(function StickyToBottomContent({
  content,
  footer,
  className,
  contentClassName
}: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: '100%', height: '100%' }}
      className={cn('grid grid-rows-[1fr,auto]', className)}
    >
      <div ref={context.contentRef} className={contentClassName}>
        {content}
      </div>
      {footer}
    </div>
  );
});

export const ChatWindow = memo(function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const [hasError, setHasError] = useState<Error | null>(null);
  
  const chat = useChat({
    api: props.endpoint,
    onFinish() {
      setHasError(null);
    },
    onResponse(response) {
      if (!response.ok) {
        response.json().then((data) => {
          setHasError(new Error(data.error || 'Unknown error occurred'));
        }).catch(() => {
          setHasError(new Error(`Request failed with status ${response.status}`));
        });
      } else {
        setHasError(null);
      }
    },
    onError: (e) => {
      setHasError(e);
    },
  });

  const isChatLoading = useCallback((): boolean => {
    return chat.status === 'streaming';
  }, [chat.status]);

  const sendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isChatLoading()) return;
    setHasError(null);
    chat.handleSubmit(e);
  }, [chat, isChatLoading]);
  
  const retryConnection = useCallback(() => {
    setHasError(null);
    window.location.href = "/auth/logout?returnTo=/";
  }, []);

  const isLoading = isChatLoading();
  const placeholder = useMemo(() => {
    return hasError 
      ? 'Please retry connection before sending messages' 
      : props.placeholder ?? 'What can I help you with?';
  }, [hasError, props.placeholder]);

  const content = useMemo(() => {
    if (chat.messages.length === 0) {
      return <div>{props.emptyStateComponent}</div>;
    }
    
    return (
      <>
        {hasError && <ErrorNotification error={hasError} onRetry={retryConnection} />}
        <ChatMessages
          aiEmoji={props.emoji}
          messages={chat.messages}
          emptyStateComponent={props.emptyStateComponent}
          isStreaming={isLoading}
        />
      </>
    );
  }, [chat.messages, hasError, props.emoji, props.emptyStateComponent, retryConnection, isLoading]);

  const footer = useMemo(() => (
    <div className="sticky bottom-8 px-2">
      <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
      <ChatInput
        value={chat.input}
        onChange={chat.handleInputChange}
        onSubmit={sendMessage}
        loading={isLoading}
        disabled={!!hasError}
        placeholder={placeholder}
      />
    </div>
  ), [chat.input, chat.handleInputChange, sendMessage, isLoading, hasError, placeholder]);

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={content}
        footer={footer}
      />
    </StickToBottom>
  );
});
