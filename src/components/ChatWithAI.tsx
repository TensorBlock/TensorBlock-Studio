import { useState, FormEvent } from 'react';
import { useAI } from '../hooks/useAI';
import { ChatMessage } from '../services/core/ai-service-provider';
import { X, Send, Loader } from 'lucide-react';

/**
 * A simple chat component that demonstrates how to use the AI service
 */
export function ChatWithAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant. Be concise in your responses.' }
  ]);
  
  const { isLoading, error, getChatCompletion } = useAI();

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    
    // Get AI response
    const response = await getChatCompletion(updatedMessages);
    
    if (response) {
      setMessages([...updatedMessages, response]);
    }
  };

  // Clear the chat
  const clearChat = () => {
    setMessages([
      { role: 'system', content: 'You are a helpful assistant. Be concise in your responses.' }
    ]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="text-lg font-medium">Chat with AI</h2>
        <button 
          onClick={clearChat}
          className="p-1 transition-colors rounded-full hover:bg-gray-200"
          aria-label="Clear chat"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.filter(m => m.role !== 'system').map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-gray-200 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800 rounded-tl-none">
              <div className="flex items-center space-x-2">
                <Loader size={16} className="animate-spin" />
                <span>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="max-w-[80%] rounded-lg p-3 bg-red-100 text-red-800 border border-red-300">
              <p>Error: {error.message}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
} 