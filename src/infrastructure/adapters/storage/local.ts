import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import type { FileMeta, FileStorePort } from "@/infrastructure/ports/file-store";

export class LocalFileAdapter implements FileStorePort {
  constructor(private readonly basePath: string) {}

  private resolve(key: string): string {
    const safe = key.replace(/\.\./g, "");
    return path.join(this.basePath, safe);
  }

  async put(key: string, body: Buffer, _meta: FileMeta): Promise<string> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);
    return key;
  }

  async getSignedUrl(key: string, _ttlSec: number): Promise<string> {
    return `/api/files/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolve(key));
    } catch {
      // ignore missing files
    }
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }
}
