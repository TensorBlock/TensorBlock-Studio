import React, { useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'red' | 'blue' | 'green' | 'gray';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
  icon,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Trap focus inside the modal when open
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Map confirmColor to Tailwind classes
  const getConfirmButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (confirmColor) {
      case 'red':
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
      case 'blue':
        return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
      case 'green':
        return `${baseClasses} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
      case 'gray':
        return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500`;
      default:
        return `${baseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;
    }
  };

  // Prevent clicks on the dialog from bubbling to the backdrop
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 mt-[29px]">
      <div 
        className="relative w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl focus:outline-none"
        onClick={handleDialogClick}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute p-1 text-gray-400 rounded-md top-2 right-2 hover:text-gray-500 focus:outline-none focus:text-gray-500"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0 mr-3">
            {icon || <AlertCircle className={confirmColor === 'red' ? 'text-red-600' : 'text-blue-600'} size={24} />}
          </div>

          <div className="flex-1">
            {/* Title */}
            <h3 
              id="modal-title" 
              className="text-lg font-medium leading-6 text-gray-900"
            >
              {title}
            </h3>

            {/* Message */}
            <div 
              id="modal-description" 
              className="mt-2 text-sm text-gray-500"
            >
              {message}
            </div>

            {/* Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={getConfirmButtonClasses()}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 