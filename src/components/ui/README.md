# UI Components

This directory contains reusable UI components for the application.

## ConfirmDialog

A customizable confirmation dialog that replaces the native `window.confirm()` with a more stylized and accessible modal.

### Features
- Customizable title, message, and button text
- Color options for the confirm button
- Custom icons
- Keyboard support (ESC to cancel)
- Focus trapping for accessibility

### Basic Usage

```tsx
import React, { useState } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog';
import { AlertTriangle, AlertCircle } from 'lucide-react';

const MyComponent = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = () => {
    // Show the confirmation dialog
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    // Perform deletion logic
    console.log('Item deleted!');
    setIsDialogOpen(false);
  };

  return (
    <div>
      <button 
        onClick={handleDelete}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Delete Item
      </button>

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={<AlertTriangle className="text-red-600" size={24} />}
        onConfirm={handleConfirm}
        onCancel={() => setIsDialogOpen(false)}
      />
    </div>
  );
};
```

### Different Color Variants

```tsx
// Blue confirmation dialog (for saving)
<ConfirmDialog
  isOpen={isSaveDialogOpen}
  title="Save Changes"
  message="Do you want to save your changes before leaving?"
  confirmText="Save"
  cancelText="Don't Save"
  confirmColor="blue"
  icon={<AlertCircle className="text-blue-600" size={24} />}
  onConfirm={handleSave}
  onCancel={handleDontSave}
/>

// Green confirmation dialog (for completing)
<ConfirmDialog
  isOpen={isCompleteDialogOpen}
  title="Mark as Complete"
  message="Are you sure you want to mark this task as complete?"
  confirmText="Complete"
  cancelText="Cancel"
  confirmColor="green"
  icon={<CheckCircle className="text-green-600" size={24} />}
  onConfirm={handleComplete}
  onCancel={() => setIsCompleteDialogOpen(false)}
/>
```

## ContextMenu

A flexible and customizable context menu component that can be configured with different actions.

### Basic Usage

```tsx
import React, { useState } from 'react';
import { Edit, Trash2, Share2 } from 'lucide-react';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';

const MyComponent = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const handleShowMenu = (id: string) => {
    setTargetId(id);
    setMenuOpen(true);
  };

  const menuItems: ContextMenuItem[] = [
    {
      id: 'edit',
      icon: Edit,
      label: 'Edit Item',
      onClick: (e) => {
        console.log('Edit clicked for item', targetId);
      },
      color: 'text-blue-600'
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share Item',
      onClick: (e) => {
        console.log('Share clicked for item', targetId);
      }
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete Item',
      onClick: (e) => {
        console.log('Delete clicked for item', targetId);
      },
      color: 'text-red-600'
    }
  ];

  return (
    <div className="relative">
      <button onClick={() => handleShowMenu('item-1')}>
        Show Menu
      </button>
      
      <ContextMenu
        items={menuItems}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        position={{ top: '100%', right: 0 }}
        width="12rem"
      />
    </div>
  );
};
```

## MessageContextMenu

A specialized context menu for chat messages with predefined actions.

### Basic Usage

```tsx
import React, { useState } from 'react';
import MessageContextMenu from '../ui/MessageContextMenu';

const ChatMessage = ({ message }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = (id: string) => {
    // Copy message text to clipboard
    navigator.clipboard.writeText(message.content);
  };

  const handleRegenerate = (id: string) => {
    // Trigger message regeneration
    console.log('Regenerate message', id);
  };

  return (
    <div className="relative p-4 border rounded">
      <div className="flex justify-between">
        <div>{message.content}</div>
        <button onClick={() => setMenuOpen(true)}>...</button>
      </div>
      
      <MessageContextMenu
        messageId={message.id}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        position={{ top: '100%', right: 0 }}
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
};
``` 