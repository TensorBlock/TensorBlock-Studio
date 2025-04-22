import React, { useRef, useState } from 'react';
import { FileUploadService } from '../../services/file-upload-service';
import { SettingsService } from '../../services/settings-service';
import { Paperclip } from 'lucide-react';

interface FileUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFilesSelected,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      // Validate files against provider limits
      const fileUploadService = FileUploadService.getInstance();
      const provider = SettingsService.getInstance().getSelectedProvider();
      const limits = fileUploadService.getProviderFileLimits(provider);
      
      // Check file size and type
      for (const file of files) {
        if (!fileUploadService.isFileValidForProvider(file, provider)) {
          throw new Error(
            `File "${file.name}" exceeds size limit (${Math.round(limits.maxFileSizeBytes / (1024 * 1024))}MB) or has unsupported file type.`
          );
        }
      }

      setError(null);
      onFilesSelected(files);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="flex items-center justify-center w-8 h-8 text-gray-500 rounded-full hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
        title="Upload file"
      >
        <Paperclip size={20} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        multiple={true}
        className="hidden"
      />
      {error && (
        <div className="absolute left-0 p-2 mb-2 text-xs text-red-800 bg-red-100 rounded shadow-md bottom-full whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploadButton; 