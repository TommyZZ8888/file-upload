declare module "@/utils/api" {
  interface ApiResponse<T = any> {
    code: number;
    data: T;
    msg?: string;
  }

  interface PasswordConfig {
    enable: boolean;
    password: string;
  }

  interface UploadResponse {
    accessUrl: string;
    fileId: string;
  }

  interface TaskRecord {
    fileIdentifier: string;
    id: string;
    exitPartList?: Array<{ partNumber: number; size: number }>;
    chunkSize: number;
    chunkNum: number;
  }

  export function getPassword(): Promise<ApiResponse<PasswordConfig>>;
  export function setPassword(config: PasswordConfig): Promise<ApiResponse>;
  export function getUploadProgress(
    identifier: string,
    storageType: string
  ): Promise<ApiResponse>;
  export function createMultipartUpload(params: {
    identifier: string;
    fileName: string;
    totalSize: number;
    chunkSize: number;
    contentType: string;
    folder: string;
    storageType: string;
  }): Promise<ApiResponse>;
  export function getPreSignUploadUrl(params: {
    identifier: string;
    partNumber: number;
    storageType: string;
  }): Promise<ApiResponse<string>>;
  export function merge(
    identifier: string,
    storageType: string
  ): Promise<ApiResponse<UploadResponse>>;
  export function uploadFile(params: {
    file: File;
    folder: string;
    storageType: string;
  }): Promise<ApiResponse<UploadResponse>>;
  export function uploadPart(params: {
    uploadId: string;
    partNumber: number;
    partFile: Blob;
    storageType: string;
  }): Promise<ApiResponse>;
}
