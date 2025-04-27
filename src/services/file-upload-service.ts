import { SettingsService } from './settings-service';
import { FileJsonData, MessageContent, MessageContentType } from '../types/chat';
import { DatabaseIntegrationService } from './database-integration';

// Define provider-specific file size limits
export interface ProviderFileLimits {
  maxFileSizeBytes: number;
  supportedFileTypes: string[];
}

const DEFAULT_FILE_LIMITS: ProviderFileLimits = {
  maxFileSizeBytes: 20 * 1024 * 1024, // 20MB default
  supportedFileTypes: ['*'] // All file types by default
};

// Provider-specific file limits
const PROVIDER_FILE_LIMITS: Record<string, ProviderFileLimits> = {
  'OpenAI': {
    maxFileSizeBytes: 25 * 1024 * 1024, // 25MB limit for OpenAI
    supportedFileTypes: [
      '.c', '.cpp', '.csv', '.docx', '.html', '.java', '.json', '.md', '.pdf', 
      '.php', '.pptx', '.py', '.rb', '.tex', '.txt', '.css', '.jpeg', '.jpg', 
      '.js', '.gif', '.png', '.tar', '.ts', '.xlsx', '.xml', '.zip'
    ]
  }
  // Other providers can be added here
};

/**
 * Service for handling file uploads to various AI providers
 */
export class FileUploadService {
  private static instance: FileUploadService;
  
  private constructor() { }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }
  
  /**
   * Get file limits for a specific provider
   */
  public getProviderFileLimits(providerName: string): ProviderFileLimits {
    return PROVIDER_FILE_LIMITS[providerName] || DEFAULT_FILE_LIMITS;
  }
  
  /**
   * Check if a file is valid for a specific provider
   */
  public isFileValidForProvider(file: File, providerName: string): boolean {
    const limits = this.getProviderFileLimits(providerName);
    
    // Check file size
    if (file.size > limits.maxFileSizeBytes) {
      return false;
    }
    
    // Check file type if specific types are provided
    if (limits.supportedFileTypes.length > 0 && limits.supportedFileTypes[0] !== '*') {
      const fileExtension = this.getFileExtension(file.name).toLowerCase();
      return limits.supportedFileTypes.includes(fileExtension);
    }
    
    return true;
  }
  
  /**
   * Get the file extension from a filename
   */
  private getFileExtension(filename: string): string {
    const extension = filename.split('.').pop();
    return extension ? `.${extension}` : '';
  }
  
  /**
   * Read a file and convert it to a base64 string (if needed)
   */
  public async readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Process uploaded files for a specific provider
   * Returns message contents to be added to the message
   */
  public async processUploadedFiles(files: File[]): Promise<MessageContent[]> {
    const provider = SettingsService.getInstance().getSelectedProvider();
    const results: MessageContent[] = [];
    
    for (const file of files) {
      if (!this.isFileValidForProvider(file, provider)) {
        throw new Error(`File ${file.name} exceeds size limit or is not supported by ${provider}`);
      }
      
      const arrayBuffer = await this.readFile(file);

      const fileJsonData: FileJsonData = {
        name: file.name,
        type: file.type,
        size: file.size
      };

      // Store the file in the database
      const dbService = DatabaseIntegrationService.getInstance();
      const fileId = await dbService.saveFile(fileJsonData, arrayBuffer);
      
      // Create a message content object for this file
      const fileContent: MessageContent = {
        type: MessageContentType.File,
        content: fileId, // Store the file ID
        dataJson: JSON.stringify(fileJsonData)
      };

      results.push(fileContent);
    }
    
    return results;
  }

  public static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public static base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  }
  
}