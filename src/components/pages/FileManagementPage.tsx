import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Trash2, 
  Edit2, 
  Search, 
  File as FileIcon, 
  Code, 
  Image as ImageIcon, 
  FileText,
  Archive,
  ChevronDown,
  FolderOpen,
  Music,
  HardDrive,
  AlertTriangle,
  FolderUp,
  FolderDown
} from "lucide-react";
import { DatabaseIntegrationService } from "../../services/database-integration";
import { FileData } from "../../types/file";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

// Define the file type categories
type FileCategory = 'all' | 'document' | 'image' | 'audio' | 'other';

export const FileManagementPage = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "type" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [activeCategory, setActiveCategory] = useState<FileCategory>('all');
  const [isSortOptionsOpen, setIsSortOptionsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    confirmColor: 'red' as 'red' | 'blue' | 'green' | 'gray'
  });
  
  // Add refs for sort dropdown and button
  const sortOptionsRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

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

  // MIME type helpers to categorize files
  const isDocumentType = (type: string): boolean => {
    const documentMimeTypes = [
      // Text documents
      'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/markdown',
      // Microsoft Office
      'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // PDF
      'application/pdf',
      // OpenDocument
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation',
      // Code files
      'application/json', 'application/xml', 'application/javascript',
      // Other documents
      'application/rtf', 'text/csv', 'text/tab-separated-values'
    ];
    
    // Also check file extensions for common document types
    const extension = getFileExtension(type);
    const documentExtensions = ['txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'md', 'rtf',
      'json', 'xml', 'html', 'htm', 'css', 'js', 'ts', 'tsx', 'jsx', 'csv', 'odt', 'ods', 'odp', 'c', 'cpp', 'h',
      'py', 'java', 'rb', 'php', 'go', 'cs', 'swift', 'kt', 'rust'];
    
    return documentMimeTypes.some(mime => type.includes(mime)) || 
           documentExtensions.includes(extension);
  };

  const isImageType = (type: string): boolean => {
    const imageMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 
      'image/bmp', 'image/svg+xml', 'image/x-icon'
    ];
    
    // Also check file extensions
    const extension = getFileExtension(type);
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'tif', 'bmp', 'svg', 'ico'];
    
    return imageMimeTypes.some(mime => type.includes(mime)) || 
           imageExtensions.includes(extension);
  };

  const isAudioType = (type: string): boolean => {
    const audioMimeTypes = [
      'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
      'audio/aac', 'audio/flac', 'audio/x-m4a', 'audio/mp3'
    ];
    
    // Also check file extensions
    const extension = getFileExtension(type);
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus'];
    
    return audioMimeTypes.some(mime => type.includes(mime)) || 
           audioExtensions.includes(extension);
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileCategory = (file: FileData): FileCategory => {
    if (isDocumentType(file.type) || isDocumentType(file.name)) {
      return 'document';
    } else if (isImageType(file.type) || isImageType(file.name)) {
      return 'image';
    } else if (isAudioType(file.type) || isAudioType(file.name)) {
      return 'audio';
    } else {
      return 'other';
    }
  };

  // Filter files by category and search term
  const filteredFiles = files.filter((file) => {
    const matchesCategory = activeCategory === 'all' || getFileCategory(file) === activeCategory;
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get counts for each category
  const getCategoryCount = (category: FileCategory): number => {
    if (category === 'all') {
      return files.length;
    }
    return files.filter(file => getFileCategory(file) === category).length;
  };

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "size") {
      comparison = a.size - b.size;
    } else if (sortBy === "type") {
      comparison = a.type.localeCompare(b.type);
    } else if (sortBy === "updatedAt") {
      // Sort by date - newest first by default
      comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
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
          size: file.size,
          updatedAt: new Date()
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
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      setSelectedFile(null);
      await loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleCancelDelete = () => {
    // Just close the dialog
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
      if (!window.electron || !window.electron.saveFile) {
        console.error("Electron saveFile API not available");
        return;
      }
      
      const result = await window.electron.saveFile(
        file.data, 
        file.name, 
        file.type || 'application/octet-stream'
      );
      
      if (!result.success) {
        if (result.canceled) {
          // User canceled the save dialog, no need to show error
          return;
        }
        console.error("Error saving file:", result.error);
      }
    } catch (error) {
      console.error("Error exporting file:", error);
    }
  };

  // Open file
  const handleOpenFile = async (file: FileData) => {
    try {
      // First save the file to a temporary location
      if (!window.electron || !window.electron.saveFile || !window.electron.openFile) {
        console.error("Electron API not available");
        return;
      }
      
      // Save file to temp location and then open it
      const saveResult = await window.electron.saveFile(
        file.data,
        file.name,
        file.type || 'application/octet-stream'
      );
      
      if (!saveResult.success || !saveResult.filePath) {
        if (!saveResult.canceled) {
          console.error("Error saving file:", saveResult.error);
        }
        return;
      }
      
      // Now open the file with the default application
      const openResult = await window.electron.openFile(saveResult.filePath);
      
      if (!openResult.success) {
        console.error("Error opening file:", openResult.error);
      }
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

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };

  // Get file icon based on type
  const getFileIcon = (file: FileData) => {
    const category = getFileCategory(file);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md', 'ppt', 'pptx', 'xls', 'xlsx'];
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'cs', 'php', 'rb', 'go', 'json'];
    const archiveExtensions = ['zip', 'rar', 'tar', 'gz', '7z'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    
    if (imageExtensions.includes(extension) || category === 'image') 
      return <ImageIcon size={18} className="text-blue-500" />;
    if (documentExtensions.includes(extension)) 
      return <FileText size={18} className="text-green-500" />;
    if (codeExtensions.includes(extension)) 
      return <Code size={18} className="text-purple-500" />;
    if (archiveExtensions.includes(extension)) 
      return <Archive size={18} className="text-amber-500" />;
    if (audioExtensions.includes(extension) || category === 'audio') 
      return <Music size={18} className="text-red-500" />;
    
    return <FileIcon size={18} className="text-gray-500" />;
  };

  // Get category icon
  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case 'all':
        return <HardDrive size={18} />;
      case 'document':
        return <FileText size={18} />;
      case 'image':
        return <ImageIcon size={18} />;
      case 'audio':
        return <Music size={18} />;
      case 'other':
        return <FolderOpen size={18} />;
    }
  };

  // Handle click outside to close sort options dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortOptionsRef.current && 
        !sortOptionsRef.current.contains(event.target as Node) &&
        sortButtonRef.current && 
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setIsSortOptionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleSortOptions = () => {
    setIsSortOptionsOpen(!isSortOptionsOpen);
  };

  const handleSortChange = (sortKey: "name" | "size" | "type" | "updatedAt") => {
    if (sortBy === sortKey) {
      // Toggle direction if same key
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New key, default to ascending
      setSortBy(sortKey);
      setSortDirection("asc");
    }
    setIsSortOptionsOpen(false);
  };

  const handleDeleteClick = (file: FileData) => {
    // Show confirmation dialog
    setSelectedFile(file);
    setConfirmDialog({
      isOpen: true,
      title: t("fileManagement.confirmDelete"),
      message: t("fileManagement.confirmDeleteMessage"),
      confirmText: t("common.delete"),
      cancelText: t("common.cancel"),
      confirmColor: 'red'
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-white">
      <div className="flex flex-row h-full">
        {/* Left sidebar - Categories */}
        <div className="w-[240px] p-4 flex flex-col gap-2 overflow-y-auto frame-right-border bg-main-background-color">
          
          {/* Upload button */}
          <label className="relative px-6 py-2.5 text-white cursor-pointer confirm-btn flex items-center justify-center">
            <FolderDown size={18} className="mr-2" />
            {t("fileManagement.uploadButton")}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              multiple
              disabled={isLoading}
            />
          </label>

          {/* Category filters */}
          <div className="space-y-1">
            {/* All files */}
            <div
              className={`flex items-center justify-between file-filter-item ${
                activeCategory === "all" ? "file-filter-item-active" : ""
              }`}
              onClick={() => setActiveCategory("all")}
            >
              <div className="flex items-center">
                <div className="file-type-icon file-type-all">
                  {getCategoryIcon("all")}
                </div>
                <span>{t("fileManagement.categories.all")}</span>
              </div>
              <span className="file-filter-count">
                {getCategoryCount("all")}
              </span>
            </div>

            {/* Documents */}
            <div
              className={`flex items-center justify-between file-filter-item ${
                activeCategory === "document" ? "file-filter-item-active" : ""
              }`}
              onClick={() => setActiveCategory("document")}
            >
              <div className="flex items-center">
                <div className="file-type-icon file-type-document">
                  {getCategoryIcon("document")}
                </div>
                <span>{t("fileManagement.categories.document")}</span>
              </div>
              <span className="file-filter-count">
                {getCategoryCount("document")}
              </span>
            </div>

            {/* Images */}
            <div
              className={`flex items-center justify-between file-filter-item ${
                activeCategory === "image" ? "file-filter-item-active" : ""
              }`}
              onClick={() => setActiveCategory("image")}
            >
              <div className="flex items-center">
                <div className="file-type-icon file-type-image">
                  {getCategoryIcon("image")}
                </div>
                <span>{t("fileManagement.categories.image")}</span>
              </div>
              <span className="file-filter-count">
                {getCategoryCount("image")}
              </span>
            </div>

            {/* Audio */}
            <div
              className={`flex items-center justify-between file-filter-item ${
                activeCategory === "audio" ? "file-filter-item-active" : ""
              }`}
              onClick={() => setActiveCategory("audio")}
            >
              <div className="flex items-center">
                <div className="file-type-icon file-type-audio">
                  {getCategoryIcon("audio")}
                </div>
                <span>{t("fileManagement.categories.audio")}</span>
              </div>
              <span className="file-filter-count">
                {getCategoryCount("audio")}
              </span>
            </div>

            {/* Others */}
            <div
              className={`flex items-center justify-between file-filter-item ${
                activeCategory === "other" ? "file-filter-item-active" : ""
              }`}
              onClick={() => setActiveCategory("other")}
            >
              <div className="flex items-center">
                <div className="file-type-icon file-type-other">
                  {getCategoryIcon("other")}
                </div>
                <span>{t("fileManagement.categories.other")}</span>
              </div>
              <span className="file-filter-count">
                {getCategoryCount("other")}
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex flex-col h-full">
            
            {/* Search and filters */}
            <div className="flex items-center mb-4">
              <div className="relative flex-grow">
                <Search
                  size={16}
                  className="absolute text-gray-500 transform -translate-y-1/2 left-3 top-1/2"
                />
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
                  ref={sortButtonRef}
                  className="flex items-center px-3 py-2 rounded-md input-box"
                  onClick={toggleSortOptions}
                >
                  <span className="mr-2">{t("fileManagement.sortBy")}</span>
                  <ChevronDown size={16} />
                </button>
                <div
                  ref={sortOptionsRef}
                  className={`absolute right-0 z-10 mt-1 bg-white border rounded-md shadow-lg image-generation-popup ${
                    !isSortOptionsOpen ? "hidden" : ""
                  }`}
                >
                  <div className="py-1">
                    <button
                      className={`flex items-center w-full px-4 py-2 ${
                        sortBy === "updatedAt"
                          ? "image-generation-provider-selected"
                          : "image-generation-provider-item"
                      }`}
                      onClick={() => handleSortChange("updatedAt")}
                    >
                      {t("fileManagement.updatedAt")}{" "}
                      {sortBy === "updatedAt" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      className={`flex items-center w-full px-4 py-2 ${
                        sortBy === "name"
                          ? "image-generation-provider-selected"
                          : "image-generation-provider-item"
                      }`}
                      onClick={() => handleSortChange("name")}
                    >
                      {t("fileManagement.fileName")}{" "}
                      {sortBy === "name" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      className={`flex items-center w-full px-4 py-2 ${
                        sortBy === "type"
                          ? "image-generation-provider-selected"
                          : "image-generation-provider-item"
                      }`}
                      onClick={() => handleSortChange("type")}
                    >
                      {t("fileManagement.fileType")}{" "}
                      {sortBy === "type" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </button>
                    <button
                      className={`flex items-center w-full px-4 py-2 ${
                        sortBy === "size"
                          ? "image-generation-provider-selected"
                          : "image-generation-provider-item"
                      }`}
                      onClick={() => handleSortChange("size")}
                    >
                      {t("fileManagement.fileSize")}{" "}
                      {sortBy === "size" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
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
                      <th className="px-4 py-3 text-left">
                        {t("fileManagement.fileName")}
                      </th>
                      {/* <th className="px-4 py-3 text-left">
                        {t("fileManagement.fileType")}
                      </th> */}
                      <th className="px-4 py-3 text-left">
                        {t("fileManagement.fileSize")}
                      </th>
                      <th className="px-4 py-3 text-left">
                        {t("fileManagement.updatedAt")}
                      </th>
                      <th className="px-4 py-3 text-center">
                        {t("fileManagement.actions")}
                      </th>
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
                        {/* <td className="px-4 py-3">
                          {file.type.split("/").pop() || "Unknown"}
                        </td> */}
                        <td className="px-4 py-3">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-4 py-3">
                          {formatDate(file.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            {/* <button
                              onClick={() => handleOpenFile(file)}
                              className="p-2 rounded-md message-icon-btn"
                              title={t("fileManagement.open")}
                            >
                              <FolderOpen size={16} />
                            </button> */}
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
                              <FolderUp size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(file)}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        confirmColor={confirmDialog.confirmColor}
        icon={<AlertTriangle className="text-red-600" size={24} />}
        onConfirm={handleDeleteFile}
        onCancel={handleCancelDelete}
      />

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