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
import { MessageContent, MessageContentType } from '../../types/chat';
import { MessageHelper } from '../../services/message-helper';
import FileAttachmentDisplay from './FileAttachmentDisplay';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface MarkdownContentProps {
  content: MessageContent[];
  isUserMessage?: boolean;
}

type CodeProps = React.ClassAttributes<HTMLElement> & 
  React.HTMLAttributes<HTMLElement> & {
    inline?: boolean;
  };

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, isUserMessage = false }) => {
  const { t } = useTranslation();
  const [processedContent, setProcessedContent] = useState('');
  const [thinkContent, setThinkContent] = useState<string | null>(null);
  const [isThinkExpanded, setIsThinkExpanded] = useState(true);
  const [fileContents, setFileContents] = useState<MessageContent[]>([]);
  const [imageContents, setImageContents] = useState<MessageContent[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  
  // Process content and check for thinking blocks, files, and image generation
  useEffect(() => {
    // Extract text, file, and image contents
    const textContents: MessageContent[] = [];
    const files: MessageContent[] = [];
    const images: MessageContent[] = [];
    
    content.forEach(item => {
      if (item.type === MessageContentType.Text) {
        textContents.push(item);
      } else if (item.type === MessageContentType.File) {
        files.push(item);
      } else if (item.type === MessageContentType.Image) {
        images.push(item);
      }
    });
    
    // Save file contents for rendering
    setFileContents(files);
    
    // Save image contents for rendering
    setImageContents(images);
    
    // Create a function for a safer replacement
    function safeReplace(str: string, search: string, replace: string): string {
      // Split the string by the search term
      const parts = str.split(search);
      // Join it back with the replacement
      return parts.join(replace);
    }
    
    let processed = MessageHelper.MessageContentToText(textContents);
    
    // Detect image generation in progress
    const imageGenInProgressMatch = processed.match(
      /(?:generating|creating|processing)\s+(?:an\s+)?image(?:s)?\s+(?:with|using|for|from)?(?:\s+prompt)?(?::|;)?\s*["']?([^"']+)["']?/i
    ) || processed.match(/\bimage\s+generation\s+in\s+progress\b/i);
    
    if ((imageGenInProgressMatch && images.length === 0) || 
        (processed.includes('generate_image') && processed.includes('tool call') && images.length === 0)) {
      setIsProcessingImage(true);
      setImageGenerationError(null);
    } else {
      setIsProcessingImage(false);
    }
    
    // Detect image generation errors
    const imageGenErrorMatch = processed.match(
      /(?:error|failed|couldn't|unable)\s+(?:in\s+)?(?:generating|creating|processing)\s+(?:an\s+)?image(?:s)?(?::|;)?\s*["']?([^"']+)["']?/i
    ) || processed.match(/\bimage\s+generation\s+(?:error|failed)\b:?\s*["']?([^"']+)["']?/i);
    
    if (imageGenErrorMatch || (processed.includes('error') && processed.includes('generate_image'))) {
      const errorMessage = imageGenErrorMatch ? (imageGenErrorMatch[1] || "Unknown error occurred") : "Failed to generate image";
      setImageGenerationError(errorMessage);
      setIsProcessingImage(false);
    } else if (images.length > 0) {
      setImageGenerationError(null);
    }
    
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
      {/* File attachments */}
      {fileContents.length > 0 && (
        <div className="mb-3">
          {fileContents.map((file, index) => (
            <FileAttachmentDisplay 
              key={index} 
              content={file} 
              isUser={isUserMessage} 
            />
          ))}
        </div>
      )}
      
      {/* Image Generation In Progress */}
      {isProcessingImage && (
        <div className="p-4 mb-3 border border-gray-200 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={20} className="text-blue-500 animate-spin" />
            <span className="font-medium">{t('imageGeneration.generating')}</span>
          </div>
          <div className="flex items-center justify-center w-full h-40 bg-gray-100 rounded-md">
            <span className="text-sm text-gray-400">{t('imageGeneration.creatingImage')}</span>
          </div>
        </div>
      )}
      
      {/* Image Generation Error */}
      {imageGenerationError && (
        <div className="p-4 mb-3 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-red-600">{t('imageGeneration.generationFailed')}</span>
          </div>
          <div className="text-sm text-red-600">
            {imageGenerationError}
          </div>
        </div>
      )}
      
      {/* Generated Images */}
      {imageContents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-3 md:grid-cols-2">
          {imageContents.map((image, index) => (
            <div key={index} className="overflow-hidden border border-gray-200 rounded-md">
              <img 
                src={`data:image/png;base64,${image.content}`} 
                alt={t('imageGeneration.generatedImage')} 
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      )}
      
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

      {processedContent && (
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
      )}
    </div>
  );
};

export default MarkdownContent; 