import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ToolboxAction {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface MessageToolboxMenuProps {
  actions: ToolboxAction[];
  className?: string;
}

/**
 * Horizontal toolbox menu that appears below chat messages with actions
 * Opacity is controlled by the parent component through className
 */
const MessageToolboxMenu: React.FC<MessageToolboxMenuProps> = ({
  actions,
  className = ''
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div
      className={`flex items-center justify-end space-x-1 transition-opacity duration-200 ${className}`}
    >
      {actions.map((action) => (
        <div key={action.id} className="relative">
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            className={`flex items-center justify-center p-1.5 text-gray-600 rounded hover:bg-gray-100 transition-colors ${
              action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            title={action.label}
            aria-label={action.label}
            onMouseEnter={() => setActiveTooltip(action.id)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {React.createElement(action.icon, {
              size: 16,
              className: 'flex-shrink-0'
            })}
          </button>
          
          {activeTooltip === action.id && (
            <div className="absolute px-2 py-1 mb-1 text-xs font-medium text-white transform -translate-x-1/2 bg-gray-800 rounded shadow-sm bottom-full left-1/2 whitespace-nowrap">
              {action.label}
              <div className="absolute w-2 h-2 transform rotate-45 -translate-x-1/2 bg-gray-800 top-full left-1/2"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessageToolboxMenu; 