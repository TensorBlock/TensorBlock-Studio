import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';

/**
 * Configuration options for the HTTP client
 */
export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  retryConfig?: RetryConfig;
}

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  shouldRetry?: (error: AxiosError) => boolean;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: API_CONFIG.http.retries.max,
  initialDelayMs: API_CONFIG.http.retries.initialDelayMs,
  backoffFactor: API_CONFIG.http.retries.backoffFactor,
  maxDelayMs: API_CONFIG.http.retries.maxDelayMs,
  shouldRetry: (error: AxiosError) => {
    // Retry on network errors or specific HTTP status codes
    return (
      !error.response || 
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      [408, 429, 500, 502, 503, 504].includes(error.response?.status || 0)
    );
  }
};

/**
 * Interface for enhanced error with original error attached
 */
interface EnhancedError extends Error {
  originalError?: AxiosError;
}

/**
 * Base HTTP client with common functionality
 * for making requests to external APIs
 */
export class HttpClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;
  private requestInterceptors: Array<number> = [];
  private responseInterceptors: Array<number> = [];

  /**
   * Create a new HTTP client
   */
  constructor(config: HttpClientConfig) {
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config.retryConfig
    };

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || API_CONFIG.http.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    // Add request logging in development
    if (import.meta.env.DEV) {
      this.addRequestInterceptor(
        (config) => {
          console.debug(`[HttpClient] Request: ${config.method?.toUpperCase()} ${config.url}`, config);
          return config;
        },
        (error) => {
          console.error('[HttpClient] Request Error:', error);
          return Promise.reject(error);
        }
      );

      this.addResponseInterceptor(
        (response) => {
          console.debug(`[HttpClient] Response: ${response.status} ${response.config.url}`);
          return response;
        },
        (error) => {
          console.error('[HttpClient] Response Error:', error);
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Add a request interceptor
   */
  public addRequestInterceptor(
    onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
    onRejected?: (error: AxiosError) => Promise<AxiosError> | AxiosError
  ): void {
    const interceptorId = this.client.interceptors.request.use(onFulfilled, onRejected);
    this.requestInterceptors.push(interceptorId);
  }

  /**
   * Add a response interceptor
   */
  public addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: AxiosError) => Promise<unknown> | unknown
  ): void {
    const interceptorId = this.client.interceptors.response.use(onFulfilled, onRejected);
    this.responseInterceptors.push(interceptorId);
  }

  /**
   * Clear all interceptors
   */
  public clearInterceptors(): void {
    this.requestInterceptors.forEach(id => {
      this.client.interceptors.request.eject(id);
    });
    this.responseInterceptors.forEach(id => {
      this.client.interceptors.response.eject(id);
    });
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Make a GET request
   */
  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config
    });
  }

  /**
   * Make a POST request
   */
  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * Make a PUT request
   */
  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * Make a DELETE request
   */
  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config
    });
  }

  /**
   * Make a request with automatic retry for failures
   */
  private async request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    let lastError: AxiosError | null = null;
    let attempt = 0;

    console.log("Request Data:", config.data);

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        const response = await this.client.request<T>(config);
        return response.data;
      } catch (error) {
        lastError = error as AxiosError;
        
        // Enhanced error logging for API request failures
        if (lastError.response) {
          console.error(`API Error (${lastError.response.status}):`, {
            url: config.url,
            method: config.method,
            statusText: lastError.response.statusText,
            data: lastError.response.data,
            headers: lastError.response.headers
          });
        } else if (lastError.request) {
          console.error('API Request Error (No Response):', {
            url: config.url,
            method: config.method,
            request: lastError.request
          });
        } else {
          console.error('API Error:', lastError.message, {
            url: config.url,
            method: config.method
          });
        }
        
        // Check if we should retry
        if (
          attempt < this.retryConfig.maxRetries && 
          this.retryConfig.shouldRetry && 
          this.retryConfig.shouldRetry(lastError)
        ) {
          // Calculate delay with exponential backoff
          const delayMs = Math.min(
            this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.backoffFactor, attempt),
            this.retryConfig.maxDelayMs
          );
          
          console.warn(`Request failed, retrying (${attempt + 1}/${this.retryConfig.maxRetries}) in ${delayMs}ms...`, {
            url: config.url,
            method: config.method,
            status: lastError.response?.status
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempt++;
        } else {
          break;
        }
      }
    }

    throw this.createEnhancedError(lastError as AxiosError, config);
  }

  /**
   * Create an enhanced error with more context
   */
  private createEnhancedError(error: AxiosError, config: AxiosRequestConfig): Error {
    const baseMessage = error.message || 'Unknown error';
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const url = config.url;
    
    let enhancedMessage = `API Error: ${baseMessage}`;
    
    if (status) {
      enhancedMessage = `API Error (${status} ${statusText}): ${baseMessage}`;
    }
    
    if (url) {
      enhancedMessage += ` [${config.method?.toUpperCase() || 'GET'} ${url}]`;
    }
    
    const enhancedError = new Error(enhancedMessage) as EnhancedError;
    enhancedError.originalError = error;
    
    return enhancedError;
  }

  /**
   * Set a new base URL for the client
   * This can be useful when switching between different environments
   * @param baseURL The new base URL
   */
  public setBaseURL(baseURL: string): void {
    this.client.defaults.baseURL = baseURL;
  }
} 