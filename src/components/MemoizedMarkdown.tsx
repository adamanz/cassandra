import { Marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
  id: string;
}

// Optimize the block component with a simple memo comparison
const MemoizedMarkdownBlock = memo<{ content: string }>(
  ({ content }) => <ReactMarkdown>{content}</ReactMarkdown>
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

// Main component with optimized rendering
export const MemoizedMarkdown = memo<MarkdownProps>(({ content, id }) => {
  // Only recompute blocks when content changes
  const blocks = useMemo(() => {
    const marked = new Marked();
    const tokens = marked.lexer(content);
    return tokens.map(token => token.raw);
  }, [content]);

  // Return early if no blocks to render
  if (!blocks.length) return null;

  // Use array index as key since blocks are stable based on content
  return (
    <>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock 
          content={block} 
          key={`${id}-${index}`} 
        />
      ))}
    </>
  );
});

MemoizedMarkdown.displayName = 'MemoizedMarkdown';