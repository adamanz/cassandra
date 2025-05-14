'use client';

import { type Message } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, memo, useCallback, useMemo } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { ArrowDown, ArrowUpIcon, LoaderCircle, AlertCircleIcon, RefreshCcw } from 'lucide-react';

import { ChatMessageBubble } from '@/components/ChatMessageBubble';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const ChatMessages = memo(function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m) => (
        <ChatMessageBubble key={m.id} message={m} aiEmoji={props.aiEmoji} />
      ))}
    </div>
  );
});

const ScrollToBottom = memo(function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button variant="outline" className={props.className} onClick={scrollToBottom}>
      <ArrowDown className="w-4 h-4" />
    </Button>
  );
});

const ChatInput = memo(function ChatInput(props: {
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
    props.onSubmit(e);
  }, [props.onSubmit]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full flex-col', props.className)}
    >
      <div className="border border-input bg-background rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          disabled={props.disabled}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-end mr-2 mb-2">
          <Button
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            type="submit"
            disabled={props.loading || props.disabled}
          >
            {props.loading ? <LoaderCircle className="animate-spin" /> : <ArrowUpIcon size={14} />}
          </Button>
        </div>
      </div>
    </form>
  );
});

const ErrorNotification = memo(function ErrorNotification(props: { 
  error: Error | null;
  onRetry: () => void;
}) {
  if (!props.error) return null;
  
  return (
    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 mb-4 max-w-[768px] mx-auto w-full flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircleIcon className="w-4 h-4" />
        <p className="text-sm">Error connecting. Try logging out and back in.</p>
      </div>
      <Button variant="outline" size="sm" onClick={props.onRetry} className="gap-1 px-2 py-1 h-auto">
        <RefreshCcw className="w-3 h-3" />
      </Button>
    </div>
  );
});

const StickyToBottomContent = memo(function StickyToBottomContent(props: {
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
      className={cn('grid grid-rows-[1fr,auto]', props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>
      {props.footer}
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
        />
      </>
    );
  }, [chat.messages, hasError, props.emoji, props.emptyStateComponent, retryConnection]);

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
