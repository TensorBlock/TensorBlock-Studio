import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Server } from 'lucide-react';
import { MCPServerSettings } from '../../types/settings';
import { MCPService } from '../../services/mcp-service';
import { SETTINGS_CHANGE_EVENT } from '../../services/settings-service';
import { useTranslation } from '../../hooks/useTranslation';

interface MCPServerFormProps {
  server?: MCPServerSettings;
  onSave: (name: string, type: 'sse' | 'stdio' | 'streamableHttp', url: string, headers?: Record<string, string>) => void;
  onCancel: () => void;
}

const MCPServerForm: React.FC<MCPServerFormProps> = ({ server, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(server?.name || '');
  const [type, setType] = useState<'sse' | 'stdio' | 'streamableHttp'>(server?.type || 'sse');
  const [url, setUrl] = useState(server?.url || '');
  const [headers, setHeaders] = useState<string>(server?.headers ? JSON.stringify(server.headers, null, 2) : '{}');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(name.trim() !== '' && url.trim() !== '');
  }, [name, url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedHeaders: Record<string, string> | undefined;
    try {
      parsedHeaders = JSON.parse(headers);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert('Invalid JSON in headers field');
      return;
    }
    
    onSave(name, type, url, parsedHeaders);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 bg-white border rounded-lg">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="name">
          {t('mcpServer.serverName')}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
          placeholder={t('mcpServer.serverNamePlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="type">
          {t('mcpServer.transportType')}
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as 'sse' | 'stdio' | 'streamableHttp')}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="sse">SSE (Server-Sent Events)</option>
          <option value="stdio">Stdio</option>
          <option value="streamableHttp">Streamable HTTP</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="url">
          {t('mcpServer.serverURL')}
        </label>
        <input
          id="url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
          placeholder={t('mcpServer.serverURLPlaceholder')}
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="headers">
          {t('mcpServer.headers')}
        </label>
        <textarea
          id="headers"
          value={headers}
          onChange={(e) => setHeaders(e.target.value)}
          className="w-full p-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
          rows={5}
          placeholder='{"Authorization": "Bearer your-token"}'
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className="px-4 py-2 text-white rounded-md confirm-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('common.save')}
        </button>
      </div>
    </form>
  );
};

export const MCPServerPage: React.FC = () => {
  const { t } = useTranslation();
  const [servers, setServers] = useState<Record<string, MCPServerSettings>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<MCPServerSettings | undefined>(undefined);
  const mcpService = MCPService.getInstance();

  useEffect(() => {
    loadServers();
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, loadServers);
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, loadServers);
    };
  }, []);

  const loadServers = () => {
    const mcpServers = mcpService.getMCPServers();
    setServers(mcpServers);
  };

  const handleAddServer = () => {
    setEditingServer(undefined);
    setShowForm(true);
  };

  const handleEditServer = (server: MCPServerSettings) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const handleDeleteServer = async (id: string) => {
    try {
      await mcpService.deleteMCPServer(id);
      loadServers();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Failed to delete server');
      }
    }
  };

  const handleSaveServer = async (name: string, type: 'sse' | 'stdio' | 'streamableHttp', url: string, headers?: Record<string, string>) => {
    try {
      if (editingServer) {
        // Update existing server
        const updatedServer: MCPServerSettings = {
          ...editingServer,
          name,
          type,
          url,
          headers
        };
        await mcpService.updateMCPServer(updatedServer);
      } else {
        // Create new server
        await mcpService.createMCPServer(name, type, url, headers);
      }
      
      setShowForm(false);
      loadServers();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      alert('Failed to save server');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingServer(undefined);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="w-full p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">{t('mcpServer.title')}</h1>
          <button
            onClick={handleAddServer}
            className="flex items-center px-4 py-2 text-white rounded-md confirm-btn"
          >
            <Plus size={18} className="mr-1" />
            {t('mcpServer.addServer')}
          </button>
        </div>

        {showForm ? (
          <MCPServerForm 
            server={editingServer} 
            onSave={handleSaveServer} 
            onCancel={handleCancelForm} 
          />
        ) : (
          <div className="space-y-4">
            {Object.keys(servers).length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Server size={48} className="mx-auto mb-4" />
                <p>{t('mcpServer.noServers')}</p>
                <p className="text-sm">{t('mcpServer.addServerPrompt')}</p>
              </div>
            ) : (
              Object.values(servers).map((server) => (
                <div 
                  key={server.id} 
                  className="flex flex-row items-center justify-between p-4 bg-white border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium">{server.name}</h3>
                      {server.isDefault && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                          {t('mcpServer.default')}
                        </span>
                      )}
                      {server.isImageGeneration && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                          {t('mcpServer.imageGeneration')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {server.type.toUpperCase()} | {server.url}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditServer(server)}
                      className="p-2 text-gray-500 transition-colors rounded-full hover:text-blue-500 hover:bg-blue-50"
                      disabled={server.isDefault}
                      title={server.isDefault ? t('mcpServer.cannotEditDefault') : t('common.edit')}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="p-2 text-gray-500 transition-colors rounded-full hover:text-red-500 hover:bg-red-50"
                      disabled={server.isDefault}
                      title={server.isDefault ? t('mcpServer.cannotDeleteDefault') : t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPServerPage; 