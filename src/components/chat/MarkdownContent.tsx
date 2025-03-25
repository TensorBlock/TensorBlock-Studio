import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import 'katex/dist/katex.min.css';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import type { Components } from 'react-markdown'
import type { HTMLProps } from 'react';

interface MarkdownContentProps {
  content: string;
}

type CodeProps = React.ClassAttributes<HTMLElement> & 
  React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
  };

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  // Custom pre-processor for LaTeX content
  const processedContent = React.useMemo(() => {
    console.log("Original content:", content);
    
    // Manual replacement of LaTeX delimiters
    let processed = content;
    
    // Create a function for a safer replacement
    function safeReplace(str: string, search: string, replace: string): string {
      // Split the string by the search term
      const parts = str.split(search);
      // Join it back with the replacement
      return parts.join(replace);
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
    
    console.log("Processed content:", processed);
    
    return processed;
  }, [content]);

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