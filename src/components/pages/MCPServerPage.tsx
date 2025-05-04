import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Server, X } from 'lucide-react';
import { MCPServerSettings } from '../../types/settings';
import { MCPService } from '../../services/mcp-service';
import { SETTINGS_CHANGE_EVENT } from '../../services/settings-service';
import { useTranslation } from '../../hooks/useTranslation';

interface MCPServerFormProps {
  server?: MCPServerSettings;
  onSave: (server: Omit<MCPServerSettings, 'id' | 'isDefault' | 'isImageGeneration'>) => void;
  onCancel: () => void;
}

const MCPServerForm: React.FC<MCPServerFormProps> = ({ server, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(server?.name || '');
  const [description, setDescription] = useState(server?.description || '');
  const [type, setType] = useState<'sse' | 'stdio' | 'streamableHttp'>(server?.type || 'sse');
  
  // Common fields - URL & Headers (for sse and streamableHttp)
  const [url, setUrl] = useState(server?.url || '');
  const [headers, setHeaders] = useState<string>(server?.headers ? JSON.stringify(server.headers, null, 2) : '{}');
  
  // Stdio specific fields
  const [command, setCommand] = useState(server?.command || '');
  const [args, setArgs] = useState<string>(server?.args ? server.args.join('\n') : '');
  const [env, setEnv] = useState<string>(server?.env ? JSON.stringify(server.env, null, 2) : '{}');
  
  // Timeout (common to all types)
  const [timeout, setTimeout] = useState<number>(server?.timeout || 60);
  
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let valid = name.trim() !== '';
    
    if (type === 'sse' || type === 'streamableHttp') {
      valid = valid && url.trim() !== '';
    } else if (type === 'stdio') {
      valid = valid && command.trim() !== '';
    }
    
    setIsValid(valid);
  }, [name, type, url, command]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse the headers if provided
      let parsedHeaders: Record<string, string> | undefined;
      if (headers) {
        parsedHeaders = JSON.parse(headers);
      }
      
      // Parse args for stdio
      let parsedArgs: string[] | undefined;
      if (type === 'stdio' && args.trim()) {
        parsedArgs = args.split('\n').filter(arg => arg.trim() !== '');
      }
      
      // Parse env for stdio
      let parsedEnv: Record<string, string> | undefined;
      if (type === 'stdio' && env) {
        parsedEnv = JSON.parse(env);
      }
      
      // Create the server object based on type
      const serverData: Omit<MCPServerSettings, 'id' | 'isDefault' | 'isImageGeneration'> = {
        name,
        type,
        description: description || undefined,
        timeout
      };
      
      // Add type-specific properties
      if (type === 'sse' || type === 'streamableHttp') {
        serverData.url = url;
        serverData.headers = parsedHeaders;
      } else if (type === 'stdio') {
        serverData.command = command;
        serverData.args = parsedArgs;
        serverData.env = parsedEnv;
      }
      
      onSave(serverData);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Invalid JSON: ${error.message}`);
      } else {
        alert('Invalid JSON format');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg max-h-[90%] p-6 overflow-y-auto bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {server ? t('mcpServer.editServer') : t('mcpServer.addServer')}
          </h3>
          <button 
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Settings */}
          <h4 className="font-medium text-md">{t('common.general')}</h4>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="name">
              <span className="text-red-500">*</span> {t('mcpServer.serverName')}
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
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="description">
              {t('mcpServer.description')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              placeholder={t('mcpServer.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="type">
              <span className="text-red-500">*</span> {t('mcpServer.transportType')}
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'sse' | 'stdio' | 'streamableHttp')}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="sse">{t('mcpServer.sseOption')}</option>
              <option value="stdio">{t('mcpServer.stdioOption')}</option>
              <option value="streamableHttp">{t('mcpServer.streamableHttpOption')}</option>
            </select>
          </div>

          {/* Connection Settings - based on type */}
          <h4 className="pt-2 font-medium text-md">{t('mcpServer.connectionSettings')}</h4>
          
          {/* Fields for SSE and StreamableHttp */}
          {(type === 'sse' || type === 'streamableHttp') && (
            <>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="url">
                  <span className="text-red-500">*</span> {t('mcpServer.serverURL')}
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
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                />
              </div>
            </>
          )}

          {/* Fields for Stdio */}
          {type === 'stdio' && (
            <>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="command">
                  <span className="text-red-500">*</span> {t('mcpServer.command')}
                </label>
                <input
                  id="command"
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder={t('mcpServer.commandPlaceholder')}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="args">
                  {t('mcpServer.args')}
                </label>
                <textarea
                  id="args"
                  value={args}
                  onChange={(e) => setArgs(e.target.value)}
                  className="w-full p-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                  rows={3}
                  placeholder={t('mcpServer.argsPlaceholder')}
                />
                <p className="mt-1 text-xs text-gray-500">{t('mcpServer.argsHelp')}</p>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="env">
                  {t('mcpServer.env')}
                </label>
                <textarea
                  id="env"
                  value={env}
                  onChange={(e) => setEnv(e.target.value)}
                  className="w-full p-2 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                  rows={4}
                  placeholder='{"KEY1": "value1", "KEY2": "value2"}'
                />
              </div>
            </>
          )}

          {/* Advanced Settings - common to all types */}
          <h4 className="pt-2 font-medium text-md">{t('mcpServer.advancedSettings')}</h4>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="timeout">
              {t('mcpServer.timeout')}
            </label>
            <div className="flex">
              <input
                id="timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value) || 60)}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <span className="inline-flex items-center px-3 text-gray-500 border border-l-0 border-gray-300 rounded-r-md bg-gray-50">
                {t('mcpServer.seconds')}
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-2">
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
      </div>
    </div>
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

  const handleSaveServer = async (serverData: Omit<MCPServerSettings, 'id' | 'isDefault' | 'isImageGeneration'>) => {
    try {
      if (editingServer) {
        // Update existing server
        const updatedServer: MCPServerSettings = {
          ...serverData,
          id: editingServer.id,
          isDefault: editingServer.isDefault,
          isImageGeneration: editingServer.isImageGeneration
        };
        await mcpService.updateMCPServer(updatedServer);
      } else {
        // Create new server
        await mcpService.createMCPServer(serverData);
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

  // Helper function to format the server type for display
  const formatServerType = (type: string): string => {
    switch (type) {
      case 'sse':
        return t('mcpServer.sseDisplay');
      case 'stdio':
        return t('mcpServer.stdioDisplay');
      case 'streamableHttp':
        return t('mcpServer.streamableHttpDisplay');
      default:
        return type.toUpperCase();
    }
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
                  
                  {server.description && (
                    <p className="mt-1 text-sm text-gray-500">{server.description}</p>
                  )}
                  
                  <p className="mt-1 text-sm text-gray-500">
                    {formatServerType(server.type)}
                    {(server.type === 'sse' || server.type === 'streamableHttp') && server.url && (
                      <> | {server.url}</>
                    )}
                    {server.type === 'stdio' && server.command && (
                      <> | {server.command}</>
                    )}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  {!server.isDefault && (
                    <>
                      <button
                        onClick={() => handleEditServer(server)}
                        className="p-2 text-gray-500 transition-colors rounded-full hover:text-blue-500 hover:bg-blue-50"
                        title={t('common.edit')}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteServer(server.id)}
                        className="p-2 text-gray-500 transition-colors rounded-full hover:text-red-500 hover:bg-red-50"
                        title={t('common.delete')}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <MCPServerForm 
          server={editingServer} 
          onSave={handleSaveServer} 
          onCancel={handleCancelForm} 
        />
      )}
    </div>
  );
};

export default MCPServerPage; 