import { useEffect } from 'react';
import { ChatPage } from './pages/ChatPage';
import MainLayout from './components/layout/MainLayout';
import DatabaseInitializer from './components/core/DatabaseInitializer';
import { AIService } from './services/ai-service';

function App() {

  // Initialize AI service and cache models at startup
  useEffect(() => {
    const aiService = AIService.getInstance();
    
    // Start caching models
    const cacheModels = async () => {
      try {
        await aiService.refreshModels();
      } catch (error) {
        console.error('Error caching models:', error);
      }
    };
    
    cacheModels();
    
    return () => {};
  }, []);

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