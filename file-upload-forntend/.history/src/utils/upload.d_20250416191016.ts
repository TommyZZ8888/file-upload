declare module "@/utils/upload" {
  interface UploadResponse {
    code: number;
    data: {
      url: string;
      filename: string;
    };
    msg?: string;
  }

  export function uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse>;
}
