import React from 'react';
import { Copy, RotateCcw, Bookmark, Share2, Flag } from 'lucide-react';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface MessageContextMenuProps {
  messageId: string;
  isOpen: boolean;
  onClose: () => void;
  position?: {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
  };
  onCopy?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
}

/**
 * Context menu for chat messages with actions like copy, regenerate, save, etc.
 */
const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  messageId,
  isOpen,
  onClose,
  position,
  onCopy,
  onRegenerate,
  onSave,
  onShare,
  onReport
}) => {
  // Build menu items based on available actions
  const menuItems: ContextMenuItem[] = [];

  if (onCopy) {
    menuItems.push({
      id: 'copy',
      icon: Copy,
      label: 'Copy message',
      onClick: () => onCopy(messageId),
      color: 'text-gray-700'
    });
  }

  if (onRegenerate) {
    menuItems.push({
      id: 'regenerate',
      icon: RotateCcw,
      label: 'Regenerate response',
      onClick: () => onRegenerate(messageId),
      color: 'text-gray-700'
    });
  }

  if (onSave) {
    menuItems.push({
      id: 'save',
      icon: Bookmark,
      label: 'Save message',
      onClick: () => onSave(messageId),
      color: 'text-gray-700'
    });
  }

  if (onShare) {
    menuItems.push({
      id: 'share',
      icon: Share2,
      label: 'Share message',
      onClick: () => onShare(messageId),
      color: 'text-gray-700'
    });
  }

  if (onReport) {
    menuItems.push({
      id: 'report',
      icon: Flag,
      label: 'Report issue',
      onClick: () => onReport(messageId),
      color: 'text-orange-600'
    });
  }

  return (
    <ContextMenu
      items={menuItems}
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      width="12rem"
      className="mt-2"
    />
  );
};

export default MessageContextMenu; 