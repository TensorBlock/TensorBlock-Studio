import { useEffect } from 'react';
import { ChatPage } from './components/pages/ChatPage';
import MainLayout from './components/layout/MainLayout';
import DatabaseInitializer from './components/core/DatabaseInitializer';

function App() {

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
  
  
  return (
    <DatabaseInitializer>
      <MainLayout>
        <ChatPage/>
      </MainLayout>
    </DatabaseInitializer>
  );
}

export default App;