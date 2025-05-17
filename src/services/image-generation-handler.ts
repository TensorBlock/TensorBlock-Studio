import { v4 as uuidv4 } from 'uuid';
import { ImageGenerationResult } from '../types/image';
import { MessageContent, MessageContentType } from '../types/chat';
import { DatabaseIntegrationService } from './database-integration';

export enum ImageGenerationStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  seed: string;
  aspectRatio: string;
  provider: string;
  providerName: string;
  model: string;
  number: number;
}

export class ImageGenerationHandler {
  private imageResultId: string;
  private status: ImageGenerationStatus;
  private options: ImageGenerationOptions;
  private images: MessageContent[] = [];
  private errorMessage: string | null = null;
  private onStatusChangeCallback: (handler: ImageGenerationHandler) => void;
  private dbService: DatabaseIntegrationService;
  private updatedAt: Date;

  constructor(
    options: ImageGenerationOptions,
    onStatusChangeCallback: (handler: ImageGenerationHandler) => void
  ) {
    this.imageResultId = uuidv4();
    this.options = options;
    this.status = ImageGenerationStatus.PENDING;
    this.onStatusChangeCallback = onStatusChangeCallback;
    this.dbService = DatabaseIntegrationService.getInstance();
    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.imageResultId;
  }

  public getStatus(): ImageGenerationStatus {
    return this.status;
  }

  public getOptions(): ImageGenerationOptions {
    return this.options;
  }

  public getImages(): MessageContent[] {
    return this.images;
  }

  public getError(): string | null {
    return this.errorMessage;
  }

  public getResult(): ImageGenerationResult {
    return {
      imageResultId: this.imageResultId,
      prompt: this.options.prompt,
      negativePrompt: this.options.negativePrompt || '',
      seed: this.options.seed,
      number: this.options.number,
      status: this.status,
      aspectRatio: this.options.aspectRatio,
      provider: this.options.provider,
      providerName: this.options.providerName,
      model: this.options.model,
      images: this.images,
      updatedAt: this.updatedAt
    };
  }

  public setGenerating(): void {
    this.status = ImageGenerationStatus.GENERATING;
    this.updatedAt = new Date();
    this.notifyStatusChange();
  }

  public async setSuccess(imageUrls: string[]): Promise<void> {
    this.status = ImageGenerationStatus.SUCCESS;
    this.updatedAt = new Date();
    this.images = imageUrls.map(url => ({
      type: MessageContentType.Image,
      content: url,
      dataJson: ''
    }));
    
    // Save to database
    await this.saveToDatabase();
    this.notifyStatusChange();
  }

  public setFailed(error: Error): void {
    this.status = ImageGenerationStatus.FAILED;
    this.updatedAt = new Date();
    this.errorMessage = error.message;
    this.notifyStatusChange();
  }

  private notifyStatusChange(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this);
    }
  }

  private async saveToDatabase(): Promise<void> {
    try {
      await this.dbService.saveImageGenerationResult(this.getResult());
    } catch (error) {
      console.error('Failed to save image generation result to database:', error);
    }
  }
}

export class ImageGenerationManager {
  private static instance: ImageGenerationManager;
  private handlers: Map<string, ImageGenerationHandler> = new Map();
  private onUpdateCallback: (handlers: Map<string, ImageGenerationHandler>) => void = () => {};

  private constructor() {}

  public static getInstance(): ImageGenerationManager {
    if (!ImageGenerationManager.instance) {
      ImageGenerationManager.instance = new ImageGenerationManager();
    }
    return ImageGenerationManager.instance;
  }

  public createHandler(
    options: ImageGenerationOptions
  ): ImageGenerationHandler {
    const handler = new ImageGenerationHandler(
      options,
      (updatedHandler) => this.onHandlerUpdate(updatedHandler)
    );
    
    this.handlers.set(handler.getId(), handler);
    this.notifyUpdate();
    
    return handler;
  }

  public getHandler(id: string): ImageGenerationHandler | undefined {
    return this.handlers.get(id);
  }

  public removeHandler(id: string): void {
    if (this.handlers.has(id)) {
      this.handlers.delete(id);
      this.notifyUpdate();
    }
  }

  public getAllHandlers(): Map<string, ImageGenerationHandler> {
    return this.handlers;
  }

  public setUpdateCallback(callback: (handlers: Map<string, ImageGenerationHandler>) => void): void {
    this.onUpdateCallback = callback;
  }

  private onHandlerUpdate(handler: ImageGenerationHandler): void {
    this.handlers.set(handler.getId(), handler);
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.handlers);
    }
  }
} 