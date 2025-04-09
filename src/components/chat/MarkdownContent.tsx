import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import 'katex/dist/katex.min.css';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import type { Components } from 'react-markdown'
import type { HTMLProps } from 'react';
import { MessageContent } from '../../types/chat';
import { MessageHelper } from '../../services/message-helper';

interface MarkdownContentProps {
  content: MessageContent[];
}

type CodeProps = React.ClassAttributes<HTMLElement> & 
  React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
  };

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const [processedContent, setProcessedContent] = useState('');
  const [thinkContent, setThinkContent] = useState<string | null>(null);
  const [isThinkExpanded, setIsThinkExpanded] = useState(true);
  
  // Process content and check for thinking blocks
  useEffect(() => {
    // Create a function for a safer replacement
    function safeReplace(str: string, search: string, replace: string): string {
      // Split the string by the search term
      const parts = str.split(search);
      // Join it back with the replacement
      return parts.join(replace);
    }
    
    let processed = MessageHelper.MessageContentToText(content);
    
    // Check if content contains thinking block
    const thinkMatch = processed.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
    
    if (thinkMatch) {
      // Extract the thinking content and the rest of the message
      const thinkingPart = thinkMatch[1];
      const actualContent = thinkMatch[2];
      
      // Store thinking content separately
      setThinkContent(thinkingPart);
      
      // Process the actual content
      processed = actualContent;
    } 
    else if (processed.startsWith('<think>')) {
      setThinkContent(processed.substring(7));

      processed = "";
    }
    else {
      setThinkContent(null);
    }
    
    // Process LaTeX delimiters step by step
    processed = safeReplace(processed, "\\[", "$$");
    processed = safeReplace(processed, "\\]", "$$");
    processed = safeReplace(processed, "\\(", "$");
    processed = safeReplace(processed, "\\)", "$");
    
    // Process bracket notation after handling escaped delimiters
    // We need to be careful not to accidentally replace brackets in code blocks
    // This is a simplified approach
    processed = processed.replace(/\[\s*(.*?)\s*\]/g, '$$$1$$');
    processed = processed.replace(/\[\[\s*(.*?)\s*\]\]/g, '$$$$1$$');
    
    setProcessedContent(processed);
  }, [content]);

  const toggleThinkExpansion = () => {
    setIsThinkExpanded(!isThinkExpanded);
  };

  const components: Components = {
    // Override pre and code blocks for better code formatting
    pre: (props: HTMLProps<HTMLPreElement>) => (
      <pre className="p-2 overflow-x-auto rounded-lg line-numbers" {...props} />
    ),
    code: ({ inline, className, children, ...props }: CodeProps) => (
      inline ? 
        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props}>{children}</code> :
        <code className={className} {...props}>{children}</code>
    ),
    // Style tables
    table: (props: HTMLProps<HTMLTableElement>) => (
      <table className="my-2 border border-collapse border-gray-300" {...props} />
    ),
    th: (props: HTMLProps<HTMLTableCellElement>) => (
      <th className="px-4 py-2 bg-gray-100 border border-gray-300" {...props} />
    ),
    td: (props: HTMLProps<HTMLTableCellElement>) => (
      <td className="px-4 py-2 border border-gray-300" {...props} />
    ),
  };

  return (
    <div className="prose-sm prose max-w-none dark:prose-invert">
      {thinkContent && (
        <div className="mb-4">
          <div 
            onClick={toggleThinkExpansion} 
            className="flex items-center gap-1 mb-1 text-sm font-medium text-gray-500 cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 transition-transform ${isThinkExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Deep thinking process</span>
          </div>
          
          {isThinkExpanded && (
            <div className="p-3 text-gray-500 bg-gray-100 border border-gray-200 rounded dark:bg-gray-800 dark:border-gray-700">
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[
                  [rehypePrism, { 
                    showLineNumbers: true,
                    ignoreMissing: true 
                  }],
                  [rehypeKatex, { 
                    throwOnError: false,
                    strict: false,
                    output: 'html', 
                    trust: true
                  }]
                ]}
                components={components}
              >
                {thinkContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[
          [rehypePrism, { 
            showLineNumbers: true,
            ignoreMissing: true 
          }],
          [rehypeKatex, { 
            throwOnError: false,
            strict: false,
            output: 'html', 
            trust: true
          }]
        ]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 