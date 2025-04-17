import React from 'react';
import { MessageContent, MessageContentType, FileJsonData } from '../../types/chat';
import { X } from 'lucide-react';

interface FileAttachmentDisplayProps {
  content?: MessageContent;
  file?: File;
  isUser?: boolean;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

const FileAttachmentDisplay: React.FC<FileAttachmentDisplayProps> = ({ 
  content,
  file,
  isUser = false,
  onRemove,
  showRemoveButton = false
}) => {
  let fileData: FileJsonData = {
    name: 'File',
    path: '',
    type: '',
    size: 0
  };

  const filePath = content?.content;

  // Handle MessageContent objects
  if (content && content.type === MessageContentType.File) {
    try {
      fileData = JSON.parse(content.dataJson) as FileJsonData;
    } catch (e) {
      console.error('Error parsing file data:', e);
      return null;
      // Use defaults if JSON parsing fails
    }
  }
  // Handle File objects
  else if (file) {
    fileData = {
      name: file.name,
      path: file.webkitRelativePath || file.name,
      type: file.type,
      size: file.size
    };
  }
  // Return null if no valid input is provided
  else {
    return null;
  }

  const fileSize = fileData.size ? formatFileSize(fileData.size) : '';
  const fileName = filePath ||fileData.name || 'File';
  
  // Detect file type to show appropriate icon
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType = getFileType(fileExtension);
  
  return (
    <div className={`flex items-center px-3 py-2 rounded-md mb-2 ${isUser ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <div className="flex-shrink-0 mr-3">
        {getFileIcon(fileType)}
      </div>
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium truncate">{fileName}</div>
        <div className="text-xs text-gray-500">{fileSize}</div>
      </div>
      {showRemoveButton && onRemove && (
        <button 
          onClick={onRemove}
          className="p-1 ml-2 text-gray-400 rounded-full hover:text-red-500 hover:bg-gray-100"
          aria-label="Remove file"
          title="Remove file"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileType(extension: string): 'document' | 'image' | 'code' | 'archive' | 'other' {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'ppt', 'pptx', 'xls', 'xlsx'];
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'json'];
  const archiveExtensions = ['zip', 'rar', 'tar', 'gz', '7z'];
  
  if (imageExtensions.includes(extension)) return 'image';
  if (documentExtensions.includes(extension)) return 'document';
  if (codeExtensions.includes(extension)) return 'code';
  if (archiveExtensions.includes(extension)) return 'archive';
  
  return 'other';
}

function getFileIcon(fileType: 'document' | 'image' | 'code' | 'archive' | 'other'): JSX.Element {
  const iconClass = "w-8 h-8";
  
  switch (fileType) {
    case 'document':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} text-blue-500`}>
          <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
          <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
        </svg>
      );
    case 'image':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} text-green-500`}>
          <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
        </svg>
      );
    case 'code':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} text-purple-500`}>
          <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
        </svg>
      );
    case 'archive':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} text-amber-500`}>
          <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
          <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`${iconClass} text-gray-500`}>
          <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
          <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
        </svg>
      );
  }
}

export default FileAttachmentDisplay; 