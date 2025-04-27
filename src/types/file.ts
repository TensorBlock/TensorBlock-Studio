export interface FileData {
  fileId: string;
  updatedAt: Date;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
}