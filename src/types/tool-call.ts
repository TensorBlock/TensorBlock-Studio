// Custom tool call types for the application

export interface CustomToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: ToolCallStatus;
  result?: unknown;
  error?: Error;
}

export enum ToolCallStatus {
  CALLED = 'CALLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ImageGenerationArgs {
  prompt: string;
  size?: string;
  style?: 'vivid' | 'natural';
}

export interface ToolCallResult {
  id: string;
  result: unknown;
}

export interface ToolCallError {
  id: string;
  error: Error;
} 