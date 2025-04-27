import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Upload, 
  Trash2, 
  Edit2, 
  Download, 
  Search, 
  File as FileIcon, 
  Code, 
  Image as ImageIcon, 
  FileText,
  Archive,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { DatabaseIntegrationService } from "../../services/database-integration";
import { FileData } from "../../types/file";

export const FileManagementPage = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "type">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Load files from database
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const dbService = DatabaseIntegrationService.getInstance();
      const files = await dbService.getFiles();
      setFiles(files);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter files by search term
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "size") {
      comparison = a.size - b.size;
    } else if (sortBy === "type") {
      comparison = a.type.localeCompare(b.type);
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const dbService = DatabaseIntegrationService.getInstance();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Read the file
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
        
        // Create file data
        const fileData = {
          name: file.name,
          type: file.type,
          size: file.size
        };
        
        // Save to database
        await dbService.saveFile(fileData, arrayBuffer);
      }
      
      // Reload files
      await loadFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
      // Reset input
      event.target.value = "";
    }
  };

  // Delete file
  const handleDeleteFile = async () => {
    if (!selectedFile) return;
    
    try {
      const dbService = DatabaseIntegrationService.getInstance();
      await dbService.deleteFile(selectedFile.fileId);
      setShowDeleteModal(false);
      setSelectedFile(null);
      await loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Rename file
  const handleRenameFile = async () => {
    if (!selectedFile || !newFileName.trim()) return;
    
    try {
      const dbService = DatabaseIntegrationService.getInstance();
      await dbService.updateFileName(selectedFile.fileId, newFileName);
      setShowRenameModal(false);
      setSelectedFile(null);
      setNewFileName("");
      await loadFiles();
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  };

  // Export file
  const handleExportFile = async (file: FileData) => {
    try {
      const blob = new Blob([file.data], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting file:", error);
    }
  };

  // Open file
  const handleOpenFile = async (file: FileData) => {
    try {
      // Use electron API to open the file
      const blob = new Blob([file.data], { type: file.type || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      window.electron.openUrl(url);
    } catch (error) {
      console.error("Error opening file:", error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (file: FileData) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'ppt', 'pptx', 'xls', 'xlsx'];
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'json'];
    const archiveExtensions = ['zip', 'rar', 'tar', 'gz', '7z'];
    
    if (imageExtensions.includes(extension)) return <ImageIcon size={18} className="text-blue-500" />;
    if (documentExtensions.includes(extension)) return <FileText size={18} className="text-green-500" />;
    if (codeExtensions.includes(extension)) return <Code size={18} className="text-purple-500" />;
    if (archiveExtensions.includes(extension)) return <Archive size={18} className="text-amber-500" />;
    
    return <FileIcon size={18} className="text-gray-500" />;
  };

  // Toggle sort direction 
  const handleSortChange = (sortKey: "name" | "size" | "type") => {
    if (sortBy === sortKey) {
      // Toggle direction if same key
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New key, default to ascending
      setSortBy(sortKey);
      setSortDirection("asc");
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex flex-row h-full">
        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">
                {t("fileManagement.title")}
              </h1>

              {/* Upload button */}
              <label className="relative px-6 py-2.5 text-white cursor-pointer confirm-btn flex items-center">
                <Upload size={18} className="mr-2" />
                {t("fileManagement.uploadButton")}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  multiple
                  disabled={isLoading}
                />
              </label>
            </div>

            {/* Search and filters */}
            <div className="flex items-center mb-4">
              <div className="relative flex-grow">
                <Search size={16} className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder={t("fileManagement.search")}
                  className="w-full px-10 py-2 pl-10 input-box"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative ml-4">
                <button 
                  className="flex items-center px-3 py-2 rounded-md input-box"
                  onClick={() => {
                    const options = document.getElementById('sortOptions');
                    options?.classList.toggle('hidden');
                  }}
                >
                  <span className="mr-2">
                    {t("fileManagement.sortBy")}
                  </span>
                  <ChevronDown size={16} />
                </button>
                <div id="sortOptions" className="absolute right-0 z-10 hidden mt-1 bg-white border rounded-md shadow-lg image-generation-popup">
                  <div className="py-1">
                    <button 
                      className={`flex items-center w-full px-4 py-2 ${sortBy === 'name' ? 'image-generation-provider-selected' : 'image-generation-provider-item'}`}
                      onClick={() => handleSortChange('name')}
                    >
                      {t("fileManagement.fileName")} {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button 
                      className={`flex items-center w-full px-4 py-2 ${sortBy === 'type' ? 'image-generation-provider-selected' : 'image-generation-provider-item'}`}
                      onClick={() => handleSortChange('type')}
                    >
                      {t("fileManagement.fileType")} {sortBy === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button 
                      className={`flex items-center w-full px-4 py-2 ${sortBy === 'size' ? 'image-generation-provider-selected' : 'image-generation-provider-item'}`}
                      onClick={() => handleSortChange('size')}
                    >
                      {t("fileManagement.fileSize")} {sortBy === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* File list */}
            <div className="flex-1 overflow-auto form-textarea-border major-area-bg-color">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-4 rounded-full border-primary-300 border-t-primary-600 animate-spin"></div>
                </div>
              ) : sortedFiles.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary-50">
                      <th className="px-4 py-3 text-left">{t("fileManagement.fileName")}</th>
                      <th className="px-4 py-3 text-left">{t("fileManagement.fileType")}</th>
                      <th className="px-4 py-3 text-left">{t("fileManagement.fileSize")}</th>
                      <th className="px-4 py-3 text-center">{t("fileManagement.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFiles.map((file) => (
                      <tr 
                        key={file.fileId} 
                        className="border-b border-primary-100 hover:bg-primary-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {getFileIcon(file)}
                            <span className="ml-2">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{file.type.split("/").pop() || "Unknown"}</td>
                        <td className="px-4 py-3">{formatFileSize(file.size)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedFile(file);
                                setNewFileName(file.name);
                                setShowRenameModal(true);
                              }}
                              className="p-2 rounded-md message-icon-btn"
                              title={t("fileManagement.rename")}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleExportFile(file)}
                              className="p-2 rounded-md message-icon-btn"
                              title={t("fileManagement.export")}
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenFile(file)}
                              className="p-2 rounded-md message-icon-btn"
                              title={t("fileManagement.open")}
                            >
                              <ExternalLink size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedFile(file);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-500 rounded-md message-icon-btn"
                              title={t("fileManagement.delete")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <FileIcon size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">
                    {t("fileManagement.noFiles")}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t("fileManagement.noFilesDescription")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">
              {t("fileManagement.confirmDelete")}
            </h2>
            <p className="mb-6 text-gray-600">
              {t("fileManagement.confirmDeleteMessage")}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 cancel-btn"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDeleteFile}
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-xl font-bold">
              {t("fileManagement.renameFile")}
            </h2>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                {t("fileManagement.newFileName")}
              </label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full p-2 input-box"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 cancel-btn"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleRenameFile}
                disabled={!newFileName.trim()}
                className="px-4 py-2 confirm-btn"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagementPage; 