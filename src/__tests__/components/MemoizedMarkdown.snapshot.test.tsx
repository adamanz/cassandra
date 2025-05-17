import React from 'react';
import { render } from '@testing-library/react';
import { MemoizedMarkdown } from '../../components/MemoizedMarkdown';
import { Marked } from 'marked';

// Mock the marked library with consistent output
jest.mock('marked', () => {
  return {
    Marked: jest.fn().mockImplementation(() => {
      return {
        lexer: jest.fn((text) => {
          // Return consistent tokens for snapshot testing
          if (text.includes('# Header')) {
            return [
              { raw: '# Header\n', type: 'heading', depth: 1, text: 'Header' },
              { raw: 'This is a paragraph.\n', type: 'paragraph', text: 'This is a paragraph.' },
              { raw: '- Item 1\n', type: 'list', ordered: false, items: ['Item 1'] },
              { raw: '- Item 2\n', type: 'list', ordered: false, items: ['Item 2'] }
            ];
          }
          return text.split('\n').map((line, index) => ({
            raw: line + '\n',
            type: 'paragraph',
            text: line
          }));
        })
      };
    })
  };
});

// Mock ReactMarkdown to render predictable output
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    // Parse the raw markdown for snapshot consistency
    const trimmed = children.trim();
    
    if (trimmed.startsWith('# ')) {
      return <h1>{trimmed.substring(2)}</h1>;
    } else if (trimmed.startsWith('- ')) {
      return <li>{trimmed.substring(2)}</li>;
    } else if (trimmed) {
      return <p>{trimmed}</p>;
    }
    
    return null;
  };
});

describe('MemoizedMarkdown Snapshots', () => {
  it('should render simple markdown correctly', () => {
    const { container } = render(
      <MemoizedMarkdown 
        content="Hello world\nThis is a test" 
        id="simple-snapshot" 
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('should render complex markdown with headers and lists', () => {
    const complexContent = `# Header
This is a paragraph.
- Item 1
- Item 2`;
    
    const { container } = render(
      <MemoizedMarkdown 
        content={complexContent} 
        id="complex-snapshot" 
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('should render empty content', () => {
    const { container } = render(
      <MemoizedMarkdown 
        content="" 
        id="empty-snapshot" 
      />
    );
    
    expect(container).toMatchSnapshot();
  });

  it('should render with different IDs', () => {
    const content = "Test content";
    
    const { container: container1 } = render(
      <MemoizedMarkdown content={content} id="id-1" />
    );
    
    const { container: container2 } = render(
      <MemoizedMarkdown content={content} id="id-2" />
    );
    
    expect(container1).toMatchSnapshot('with-id-1');
    expect(container2).toMatchSnapshot('with-id-2');
  });
});