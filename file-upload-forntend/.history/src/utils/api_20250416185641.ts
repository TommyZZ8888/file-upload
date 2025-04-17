import { http, httpExtra } from "./http";

interface UploadProgressParams {
  identifier: string;
  storageType: string;
}

interface MultipartUploadParams {
  identifier: string;
  fileName: string;
  totalSize: number;
  chunkSize: number;
  contentType: string;
  folder: string;
  storageType: string;
}

interface PreSignUrlParams {
  identifier: string;
  partNumber: number;
  storageType: string;
}

interface UploadFileParams {
  file: File;
  folder?: string;
  fileType?: number;
  storageType: string;
}

interface UploadPartParams {
  uploadId: string;
  partNumber: number;
  partFile: File;
  storageType: string;
}

interface PageFilesParams {
  page?: number;
  pageSize?: number;
  storageType: string;
  fileName?: string;
}

interface StorageConfigParams {
  type: string;
}

interface SetStorageConfigParams {
  id: number;
  type: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

interface TestStorageConfigParams {
  type: string;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

interface EnableShareParams {
  enable: boolean;
}

interface FileOperationParams {
  fileIdentifier: string;
}

interface FileEncryptionParams {
  filePath: string;
  password: string;
}

interface FileRenameParams {
  fileRenames: Array<{
    oldPath: string;
    newPath: string;
  }>;
}

/**
 * 获取上传进度
 */
const getUploadProgress = ({
  identifier,
  storageType,
}: UploadProgressParams) => {
  return http.get("/upload/getUploadProgress", {
    params: { identifier },
    headers: { "Storage-Type": storageType },
  });
};

/**
 * 创建分片上传任务
 */
const createMultipartUpload = ({
  identifier,
  fileName,
  totalSize,
  chunkSize,
  contentType,
  folder,
  storageType,
}: MultipartUploadParams) => {
  return http.post(
    "/upload/createMultipartUpload",
    {
      identifier,
      fileName,
      totalSize,
      chunkSize,
      contentType,
      folder,
    },
    {
      headers: { "Storage-Type": storageType },
    }
  );
};

/**
 * 获取预签名分片上传 URL
 */
const getPreSignUploadUrl = ({
  identifier,
  partNumber,
  storageType,
}: PreSignUrlParams) => {
  return http.get("/upload/getPreSignUploadUrl", {
    params: { identifier, partNumber },
    headers: { "Storage-Type": storageType },
  });
};

/**
 * 合并分片
 */
const merge = (identifier: string, storageType: string) => {
  return http.post("/upload/merge", null, {
    params: { identifier },
    headers: { "Storage-Type": storageType },
  });
};

/**
 * 上传文件到后端 /upload 接口
 */
const uploadFile = ({
  file,
  folder,
  fileType,
  storageType,
}: UploadFileParams) => {
  const formData = new FormData();
  formData.append("file", file);
  if (folder) formData.append("folder", folder);
  if (fileType !== undefined) formData.append("fileType", fileType.toString());

  return http.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Storage-Type": storageType,
    },
  });
};

/**
 * 上传单个分片
 */
const uploadPart = ({
  uploadId,
  partNumber,
  partFile,
  storageType,
}: UploadPartParams) => {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("partNumber", partNumber.toString());
  formData.append("file", partFile);

  return http.post("/upload/part", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "Storage-Type": storageType,
    },
  });
};

/**
 * 分页获取文件列表
 */
const pageFiles = ({
  page = 1,
  pageSize = 10,
  storageType,
  fileName,
}: PageFilesParams) => {
  return http.get("/file/page", {
    params: { page, pageSize, storageType, fileName },
  });
};

/**
 * 根据存储类型获取存储配置
 */
const getStorageConfig = ({ type }: StorageConfigParams) => {
  return http.get("/config", {
    params: { type },
  });
};

/**
 * 修改存储配置
 */
const setStorageConfig = ({
  id,
  type,
  endpoint,
  accessKey,
  secretKey,
  bucket,
}: SetStorageConfigParams) => {
  return http.patch("/config", {
    id,
    type,
    endpoint,
    accessKey,
    secretKey,
    bucket,
  });
};

/**
 * 测试存储配置
 */
const testStorageConfig = ({
  type,
  endpoint,
  accessKey,
  secretKey,
  bucket,
}: TestStorageConfigParams) => {
  return http.post("/config/test", {
    type,
    endpoint,
    accessKey,
    secretKey,
    bucket,
  });
};

/**
 * 获取共享文件列表
 */
const getSharedFiles = () => {
  return http.get("/file/sharedFiles");
};

/**
 * 启用或禁用共享
 */
const enableShare = ({ enable }: EnableShareParams) => {
  const formData = new FormData();
  formData.append("enable", enable.toString());
  return http.post("/file/enableShare", formData);
};

/**
 * 获取分享状态
 */
const getShareStatus = () => {
  return http.get("/file/getShareStatus");
};

/**
 * 获取分享地址
 */
const shareAddress = () => {
  const clientPort = window.location.port;
  return http.get("/file/shareAddress?clientPort=" + clientPort);
};

/**
 * 移除共享文件
 */
const unShareFile = (fileIdentifier: string) => {
  const formData = new FormData();
  formData.append("fileIdentifier", fileIdentifier);
  return http.post("/file/unShareFile", formData);
};

/**
 * 添加共享文件
 */
const addSharedFile = (fileIdentifier: string) => {
  const formData = new FormData();
  formData.append("fileIdentifier", fileIdentifier);
  return http.post("/file/addSharedFile", formData);
};

/**
 * 删除文件
 */
const deleteFile = (fileIdentifier: string) => {
  const formData = new FormData();
  formData.append("fileIdentifier", fileIdentifier);
  return http.post("/file/deleteFile", formData);
};

/**
 * 获取密码
 */
const getPassword = () => {
  return http.get("/config/getPassword");
};

/**
 * 设置密码
 */
exportconst setPassword = (password: string) => {
  const formData = new FormData();
  formData.append("password", password);
  return http.post("/config/setPassword", formData);
};

/**
 * 获取磁盘列表
 */
const getLocalDrives = () => {
  return http.get("/localFile/getDrives");
};

/**
 * 构建本地文件索引
 */
const buildIndex = (drives: string[]) => {
  return http.post("/localFile/buildIndex", drives);
};

/**
 * 查找本地文件
 */
const localFileSearch = (keyword: string) => {
  return http.get("/localFile/search", {
    params: { keyword },
  });
};

/**
 * 打开文件资源管理器
 */
const openDir = (dir: string) => {
  const formData = new FormData();
  formData.append("dir", dir);
  return http.post("/localFile/openDir", formData);
};

/**
 * 查询文件树
 */
const getFileTree = (
  path: string,
  showFiles: boolean,
  showFolders: boolean,
  maxDepth: number
) => {
  return http.get("/localFile/getFileTree", {
    params: { path, showFiles, showFolders, maxDepth },
  });
};

/**
 * 加密文件
 */
const encryptFile = ({ filePath, password }: FileEncryptionParams) => {
  const formData = new FormData();
  formData.append("filePath", filePath);
  formData.append("password", password);
  return http.post("/localFile/encrypt", formData);
};

/**
 * 解密文件
 */
const decryptFile = ({ filePath, password }: FileEncryptionParams) => {
  const formData = new FormData();
  formData.append("filePath", filePath);
  formData.append("password", password);
  return http.post("/localFile/decrypt", formData);
};

/**
 * 批量修改文件名
 */
const batchRenameFile = (fileRenames: FileRenameParams["fileRenames"]) => {
  return http.post("/localFile/batchRenameFile", fileRenames);
};

export {
  getUploadProgress,
  createMultipartUpload,
  getPreSignUploadUrl,
  merge,
  uploadFile,
  uploadPart,
  pageFiles,
  getStorageConfig,
  setStorageConfig,
  testStorageConfig,
  getSharedFiles,
  enableShare,
  getShareStatus,
  shareAddress,
  unShareFile,
  getPassword,
  setPassword,
  addSharedFile,
  deleteFile,
  getLocalDrives,
  buildIndex,
  localFileSearch,
  openDir,
  getFileTree,
  encryptFile,
  decryptFile,
  batchRenameFile,
  httpExtra,
};
