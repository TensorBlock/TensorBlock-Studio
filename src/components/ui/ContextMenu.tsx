import React, { useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ContextMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  color?: string; // Optional text color (Tailwind class)
  bgHoverColor?: string; // Optional hover background color (Tailwind class)
  disabled?: boolean; // Optional disabled state
  divider?: boolean; // Optional divider below this item
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  width?: string;
  className?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  isOpen,
  onClose,
  position = { top: '100%', right: '0' },
  width = '12rem',
  className = '',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Also close on ESC key
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
    
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIconColor = (item: ContextMenuItem) => {
    if (item.disabled) return '#9CA3AF'; // gray-400
    if (item.color === 'text-red-600') return '#DC2626'; // red-600
    if (item.color === 'text-orange-600') return '#EA580C'; // orange-600
    if (item.color === 'text-blue-600') return '#2563EB'; // blue-600
    if (item.color === 'text-green-600') return '#16A34A'; // green-600
    return undefined; // default
  };

  return (
    <div 
      ref={menuRef}
      className={`absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg ${className}`}
      style={{ 
        ...position,
        width 
      }}
    >
      <ul className="py-1 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.divider ? 'border-b border-gray-200' : ''}>
            <button
              onClick={(e) => {
                if (!item.disabled) {
                  item.onClick(e);
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`flex items-center w-full px-4 py-2 text-left transition-colors
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
                ${item.color || 'text-gray-700'} 
                ${item.disabled ? '' : `hover:${item.bgHoverColor || 'bg-gray-100'}`}
              `}
            >
              {item.icon && React.createElement(item.icon, { 
                size: 14, 
                className: "mr-2 flex-shrink-0",
                color: getIconColor(item)
              })}
              <span className="truncate">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu; 