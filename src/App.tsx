import { useEffect, useState } from 'react';
import { ChatPage } from './components/pages/ChatPage';
import { ImageGenerationPage } from './components/pages/ImageGenerationPage';
import { TranslationPage } from './components/pages/TranslationPage';
import { FileManagementPage } from './components/pages/FileManagementPage';
import { MCPServerPage } from './components/pages/MCPServerPage';
import MainLayout from './components/layout/MainLayout';
import DatabaseInitializer from './components/core/DatabaseInitializer';

function App() {
  const [activePage, setActivePage] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);

  // Handle link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.target !== '_self') {
        e.preventDefault();
        window.electron.openUrl(target.href);
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);
  
  const handlePageChange = (page: string) => {
    setActivePage(page);
  };
  
  return (
    <DatabaseInitializer>
      <MainLayout activePage={activePage} onChangePage={handlePageChange} showSettings={showSettings} setShowSettings={setShowSettings}>
        {activePage === 'chat' && <ChatPage />}
        {activePage === 'image' && <ImageGenerationPage />}
        {activePage === 'translation' && <TranslationPage />}
        {activePage === 'files' && <FileManagementPage />}
        {activePage === 'mcpserver' && <MCPServerPage />}
      </MainLayout>
    </DatabaseInitializer>
  );
}

export default App;