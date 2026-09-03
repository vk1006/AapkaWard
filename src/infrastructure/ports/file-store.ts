export interface FileMeta {
  contentType: string;
  size: number;
}

export interface FileStorePort {
  put(key: string, body: Buffer, meta: FileMeta): Promise<string>;
  getSignedUrl(key: string, ttlSec: number): Promise<string>;
  delete(key: string): Promise<void>;
}
