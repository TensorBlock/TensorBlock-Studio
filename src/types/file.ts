export interface File {
  fileId: string;
  name: string;
  type: string;
  size: number;
  data: ArrayBuffer;
}