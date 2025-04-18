<template>
  <div class="upload-container" :style="{ width: computedWidth }">
    <div class="upload">
      <div
        class="upload-section"
        :class="{ 'has-file-list': fileList.length > 0 }"
        :style="{ height: computedHeight }"
      >
        <el-upload
          ref="upload"
          class="upload-demo"
          drag
          action="/"
          multiple
          :accept="accept"
          :http-request="handleHttpRequest"
          :show-file-list="false"
        >
          <!-- 插槽：允许自定义上传框内容 -->
          <slot name="uploadContent">
            <!-- 默认内容 -->
            <div class="el-upload__content">
              <i class="el-icon-upload" style="font-size: 60px"></i>
              <div class="el-upload__text">
                <p
                  style="font-size: 15px; color: #797979"
                  v-if="fileList.length > 0"
                >
                  点击空白区域继续上传
                </p>
                <p style="font-size: 15px; color: #797979" v-else>
                  拖拽文件到此处或点击上传
                </p>
                <p style="color: #999999">
                  支持{{ accept }} 格式，单个文件最大
                  {{ maxSize / 1024 / 1024 }}MB
                </p>
              </div>
            </div>
          </slot>
        </el-upload>
      </div>

      <transition
        name="float-box"
        @before-enter="beforeEnter"
        @after-leave="afterLeave"
      >
        <!-- 文件列表悬浮框 -->
        <div
          class="file-list-float"
          v-if="showFileList && fileList.length > 0"
          :style="floatStyle"
        >
          <div class="file-list-header">
            <span>上传列表 ({{ fileList.length }})</span>
            <div class="header-actions">
              <!-- 一键重试图标 -->
              <el-tooltip content="一键重试" placement="top">
                <el-button type="text" @click="retryFile" class="action-btn">
                  <i class="el-icon-refresh"></i>
                </el-button>
              </el-tooltip>
              <!-- 清空列表图标 -->
              <el-tooltip content="清空列表" placement="top">
                <el-button
                  type="text"
                  @click="clearFileList"
                  class="action-btn"
                >
                  <i class="el-icon-delete"></i>
                </el-button>
              </el-tooltip>
              <!-- 关闭按钮改为横线 -->
              <el-tooltip content="收起" placement="top">
                <el-button
                  type="text"
                  @click="toggleFileList"
                  class="close-btn"
                >
                  <i class="el-icon-minus"></i>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="file-list-content">
            <ul>
              <li
                v-for="(file, index) in sortedFileList"
                :key="index"
                class="file-item"
                :style="getBackgroundStyle(file)"
              >
                <i :class="getFileIcon(file.name)" class="file-icon"></i>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <div class="file-meta">
                    <span class="file-size">{{
                      formatFileSize(file.fileSize)
                    }}</span>
                    <span class="file-speed">{{
                      file.status === "uploading" ? `${file.speed} MB/s` : ""
                    }}</span>
                    <span class="file-status">{{
                      getStatusText(file.status, file.retries)
                    }}</span>
                    <div class="file-actions">
                      <i
                        :class="
                          file.status === 'uploading'
                            ? 'el-icon-video-pause'
                            : 'el-icon-video-play'
                        "
                        class="action-icon"
                        @click="togglePause(file)"
                      ></i>
                      <i
                        class="el-icon-delete action-icon"
                        @click="handleRemoveFile(file, index)"
                      ></i>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </transition>

      <!-- 悬浮框切换按钮 -->
      <div
        class="progress-ring-wrapper"
        :style="ringStyle"
        v-if="fileList.length > 0"
      >
        <el-button
          class="float-toggle-btn"
          circle
          icon="el-icon-folder-opened"
          @click="toggleFileList"
        >
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import md5 from "@/utils/md5";
import Queue from "promise-queue-plus";
import axios from "axios";
import { baseUrl } from "@/utils/http";
import {
  getUploadProgress,
  createMultipartUpload,
  getPreSignUploadUrl,
  merge,
  uploadFile,
  uploadPart,
  httpExtra,
} from "@/utils/api";

interface FileItem {
  file: File;
  name: string;
  status: "pending" | "uploading" | "success" | "error" | "failed" | "paused";
  progress: number;
  speed: string;
  uid: string;
  fileSize: number;
  lastUploadedSize: number;
  startTime: number;
  identifier: string;
  retries: number;
  fileId: string | null;
  paused: boolean;
  url?: string;
}

const props = defineProps({
  accept: { type: String, default: ".jpg,.png,.mp4,.exe" },
  maxSize: { type: Number, default: 200 * 1024 * 1024 },
  fileList: { type: Array as () => FileItem[], default: () => [] },
  folder: { type: String, default: "default" },
  width: { type: [String, Number], default: "100%" },
  height: { type: [String, Number], default: "250px" },
  storageType: { type: String, default: "local" },
});

const emit = defineEmits(["update:fileList"]);

const upload = ref();
const showFileList = ref(false);
const retryInterval = ref<number | null>(null);
const floatStyle = ref({});

const fileUploadChunkQueue = ref<Record<string, any>>({});

const computedWidth = computed(() => {
  return typeof props.width === "number" ? `${props.width}px` : props.width;
});

const computedHeight = computed(() => {
  return typeof props.height === "number" ? `${props.height}px` : props.height;
});

const successCount = computed(() => {
  return props.fileList.filter((file) => file.status === "success").length;
});

const uploadProgress = computed(() => {
  return props.fileList.length > 0
    ? Number(((successCount.value / props.fileList.length) * 100).toFixed(2))
    : 0;
});

const sortedFileList = computed(() => {
  const statusPriority = {
    error: 0,
    failed: 1,
    uploading: 2,
    paused: 3,
    pending: 4,
    success: 5,
  };
  return [...props.fileList].sort((a, b) => {
    return statusPriority[a.status] - statusPriority[b.status];
  });
});

const ringStyle = computed(() => {
  const progress = uploadProgress.value / 100;
  const circumference = 2 * Math.PI * 40; // 半径40px的圆周长

  return {
    "--progress": progress,
    "--stroke-dashoffset": circumference * (1 - progress),
    "--ring-color": getRingColor(uploadProgress.value),
  };
});

const getRingColor = (progress: number) => {
  if (props.fileList.some((file) => file.status === "error")) {
    return "#F56C6C"; // 错误红色
  }

  if (progress === 100) return "#409EFF"; // 完成蓝色
  if (progress > 70) return "#67C23A"; // 绿色
  if (progress > 40) return "#E6A23C"; // 黄色
  return "#C0C4CC"; // 灰色
};

const beforeEnter = (el: HTMLElement) => {
  // 获取按钮位置作为动画起点
  const btn = document.querySelector(".float-toggle-btn");
  if (btn) {
    const rect = btn.getBoundingClientRect();
    el.style.transformOrigin = `${rect.right}px ${rect.bottom}px`; // 动态设置 transformOrigin
  }
};

const afterLeave = (el: HTMLElement) => {
  el.style.transformOrigin = "bottom right";
};

const formatFileSize = (size: number) => {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size; // 假设 size 是字节数
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  // 保留两位小数，去掉多余的 0
  return `${value.toFixed(2).replace(/\.?0+$/, "")} ${units[unitIndex]}`;
};

const togglePause = (file: FileItem) => {
  console.log("暂停/继续文件:", file.name);
  const queue = fileUploadChunkQueue.value[file.uid];
  if (!queue) {
    ElMessage.warning(`${file.name} 没有正在进行的上传任务`);
    return;
  }

  const fileIndex = props.fileList.findIndex((f) => f.uid === file.uid);
  if (fileIndex === -1) return;

  const newFileList = [...props.fileList];

  if (file.status === "uploading") {
    // 暂停
    queue.stop();
    newFileList[fileIndex].status = "paused";
    newFileList[fileIndex].pauseTime = new Date().getTime(); // 记录暂停时间
    newFileList[fileIndex].speed = "0"; // 暂停时速度归零
    ElMessage.info(`${file.name} 已暂停`);
  } else if (file.status === "paused") {
    // 继续
    queue.start();
    newFileList[fileIndex].status = "uploading";
    newFileList[fileIndex].startTime =
      new Date().getTime() -
      (newFileList[fileIndex].pauseTime - newFileList[fileIndex].startTime); // 调整开始时间
    delete newFileList[fileIndex].pauseTime;
    ElMessage.info(`${file.name} 已继续`);
  }
  emit("update:fileList", newFileList);
};

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "el-icon-document";
    case "jpg":
    case "jpeg":
    case "png":
      return "el-icon-picture-outline";
    default:
      return "el-icon-files";
  }
};

const getBackgroundStyle = (file: FileItem) => {
  const progress = file.progress || 0;
  const color = getProgressColor(file.status);
  if (progress === 0 || progress === 100) {
    return {
      background: color,
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
    };
  }
  return {
    background: `linear-gradient(to right,
      ${color} ${progress}%,
      rgba(255, 255, 255, 0.92) ${progress}%)`,
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
  };
};

const getProgressColor = (status: string) => {
  const colors: Record<string, string> = {
    success: "rgba(56, 178, 108, 0.18)", // 加深的青瓷绿
    error: "rgba(255, 86, 110, 0.15)", // 深珊瑚红
    failed: "rgba(255, 86, 110, 0.15)", // 同步加深
    uploading: "rgba(76, 155, 245, 0.18)", // 深海蓝
    paused: "rgba(255, 165, 0, 0.18)", // 橙色
    default: "rgba(226, 232, 240, 0.7)", // 加深的雾灰色
  };
  return colors[status] || colors.default;
};

const getStatusText = (status: string, retries: number) => {
  if (status === "error" && retries) return `失败 (${retries})`;
  return (
    {
      success: "成功",
      error: "失败",
      uploading: "上传中",
      paused: "已暂停",
      pending: "等待",
    }[status] || "等待"
  );
};

const toggleFileList = () => {
  showFileList.value = !showFileList.value;
};

// 添加进度条文本格式化方法
const formatProgress = (percentage: number) => {
  return `上传进度: ${successCount.value}/${props.fileList.length} (${percentage}%)`;
};

const handleHttpRequest = async (options: any, retries?: number) => {
  const file = options.file;
  const fileSize = file.size;

  // 校验文件大小
  if (fileSize > props.maxSize) {
    ElMessage.error(
      `文件 ${file.name} 大小超过限制（${props.maxSize / 1024 / 1024}MB）`
    );
    return; // 如果超过大小限制，直接返回，不继续上传
  }

  // 校验文件类型
  const acceptTypes = props.accept.split(",").map((type) => type.trim()); // 将 accept 字符串转为数组
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase(); // 获取文件扩展名
  if (!acceptTypes.includes(fileExtension)) {
    ElMessage.error(
      `文件 ${file.name} 类型不支持，仅支持 ${props.accept} 格式`
    );
    return; // 如果类型不符合要求，直接返回
  }

  // 计算文件的 identifier（基于 MD5）
  const identifier = await md5(file);

  // 检查 fileList 中是否已存在相同 identifier 且状态为 'success' 的文件
  const existingFile = props.fileList.find((f) => f.identifier === identifier);
  if (existingFile) {
    // 如果文件已存在且上传成功，则跳过上传
    if (existingFile.status === "success") {
      ElMessage.info(`文件 ${file.name} 已上传成功，跳过上传。`);
      return;
    } else if (existingFile.status === "uploading") {
      // 如果文件正在上传中，则跳过上传
      ElMessage.info(`文件 ${file.name} 正在上传中，跳过上传。`);
      return;
    } else if (
      existingFile.status === "failed" ||
      existingFile.status === "error"
    ) {
      // 更新已有文件状态为 'uploading'
      const newFileList = [...props.fileList];
      const fileIndex = newFileList.findIndex(
        (f) => f.identifier === identifier
      );
      newFileList[fileIndex].status = "uploading";
      newFileList[fileIndex].retries = retries || 0;
      newFileList[fileIndex].progress = 0; // 重置进度
      emit("update:fileList", newFileList);
    }
  } else {
    // 添加新文件到 fileList
    const newFile: FileItem = {
      file: file,
      name: file.name,
      status: "pending",
      progress: 0,
      speed: "0",
      uid: file.uid,
      fileSize: fileSize,
      lastUploadedSize: 0,
      startTime: new Date().getTime(),
      identifier: identifier,
      retries: retries || 0,
      fileId: null,
      paused: false,
    };
    const newFileList = [...props.fileList];
    newFileList.push(newFile);
    emit("update:fileList", newFileList);
  }

  showFileList.value = true;

  if (fileSize <= 5 * 1024 * 1024) {
    // 小文件上传逻辑
    try {
      updateFileStatus(file.uid, "uploading", 10);
      const response = await uploadFile({
        file: file,
        folder: props.folder,
        storageType: props.storageType,
      });
      if (response.code === 200) {
        updateFileStatus(
          file.uid,
          "success",
          100,
          response.data.accessUrl,
          response.data.fileId
        );
      }
    } catch (error) {
      updateFileStatus(file.uid, "failed");
    }
  } else {
    // 大文件分片上传逻辑
    const task = await getTaskInfo(file);
    if (task) {
      const { finished, path, taskRecord } = task;
      const { fileIdentifier: identifier, id: fileId } = taskRecord;
      if (finished) {
        // 如果文件已上传完成，更新状态并传递地址
        updateFileStatus(file.uid, "success", 100, path, fileId);
      } else {
        try {
          const errorList = await handleUpload(file, taskRecord, options);
          if (errorList.length > 0) {
            updateFileStatus(file.uid, "failed");
          } else {
            const { code, data } = await merge(identifier, props.storageType);
            if (code === 200) {
              updateFileStatus(
                file.uid,
                "success",
                100,
                data.accessUrl,
                data.id
              );
            } else {
              updateFileStatus(file.uid, "failed");
            }
          }
        } catch (error) {
          updateFileStatus(file.uid, "failed");
        }
      }
    } else {
      updateFileStatus(file.uid, "failed");
    }
  }
};

const updateFileStatus = (
  uid: string,
  status: string,
  progress = 0,
  url = null,
  fileId = null
) => {
  const newFileList = [...props.fileList];
  const fileIndex = newFileList.findIndex((f) => f.uid === uid);
  if (fileIndex !== -1) {
    newFileList[fileIndex].status = status;
    newFileList[fileIndex].progress = progress;
    if (url) {
      newFileList[fileIndex].url = url; // 添加上传成功的地址
    }
    if (fileId) {
      newFileList[fileIndex].fileId = fileId;
    }
    // 通知父组件更新 fileList
    emit("update:fileList", newFileList);
  }
};

const handleRemoveFile = (file: FileItem) => {
  // 遍历找到uid在fileList中的索引
  const index = props.fileList.findIndex((f) => f.uid === file.uid);
  const newFileList = [...props.fileList];
  newFileList.splice(index, 1);
  const queueObject = fileUploadChunkQueue.value[file.uid];
  if (queueObject) {
    queueObject.stop();
    fileUploadChunkQueue.value[file.uid] = undefined;
  }
  // 通知父组件更新 fileList
  emit("update:fileList", newFileList);
};

const getTaskInfo = async (file: File) => {
  let task;
  try {
    const identifier = await md5(file);
    const { code, data, msg } = await getUploadProgress(
      identifier,
      props.storageType
    );
    console.log("getTaskInfo", code, data, msg);
    if (code === 200) {
      task = data;
      if (!task) {
        const { code, data, msg } = await createMultipartUpload({
          identifier,
          fileName: file.name,
          totalSize: file.size,
          chunkSize: 5 * 1024 * 1024,
          contentType: file.type,
          folder: props.folder,
          storageType: props.storageType,
        });
        if (code === 200) {
          task = data;
        } else {
          ElMessage.error(msg);
        }
      }
    } else {
      const fileIndex = props.fileList.findIndex((f) => f.uid === file.uid);
      if (fileIndex !== -1) {
        const newFileList = [...props.fileList];
        newFileList[fileIndex].status = "failed";
        emit("update:fileList", newFileList);
      }
    }
  } catch (e) {
    console.log("getTaskInfo", e);
    const fileIndex = props.fileList.findIndex((f) => f.uid === file.uid);
    if (fileIndex !== -1) {
      const newFileList = [...props.fileList];
      newFileList[fileIndex].status = "failed";
      emit("update:fileList", newFileList);
    }
  }
  return task;
};

const handleUpload = async (file: File, taskRecord: any, options: any) => {
  let lastUploadedSize = 0;
  let uploadedSize = 0;
  const totalSize = file.size || 0;
  const startMs = new Date().getTime();
  const { exitPartList, chunkSize, chunkNum, fileIdentifier } = taskRecord;

  const updateSpeed = (
    fileUid: string,
    uploadedSize: number,
    startTime: number
  ) => {
    const newFileList = [...props.fileList];
    const fileIndex = newFileList.findIndex((f) => f.uid === fileUid);
    if (fileIndex !== -1) {
      const file = newFileList[fileIndex];
      if (file.status !== "paused") {
        const currentTime = new Date().getTime();
        const elapsedTime = (currentTime - startTime) / 1000; // 转换为秒
        // 计算速度 (MB/s)
        newFileList[fileIndex].speed = (
          uploadedSize /
          1024 /
          1024 /
          elapsedTime
        ).toFixed(2);
        newFileList[fileIndex].status = "uploading";
        newFileList[fileIndex].progress = Math.floor(
          (uploadedSize / totalSize) * 100
        );
        emit("update:fileList", newFileList);
      }
    }
  };

  const uploadNext = async (partNumber: number) => {
    const start = chunkSize * (partNumber - 1);
    const end = start + chunkSize;
    const blob = file.slice(start, end);

    if (props.storageType === "local") {
      // 本地存储上传逻辑
      const formData = new FormData();
      formData.append("uploadId", fileIdentifier); // 上传任务的唯一标识
      formData.append("partNumber", partNumber.toString()); // 分片编号
      formData.append("file", blob); // 分片数据

      try {
        const response = await uploadPart({
          uploadId: fileIdentifier,
          partNumber: partNumber,
          partFile: blob,
          storageType: props.storageType,
        });
        // 假设服务器返回成功状态
        return Promise.resolve({
          partNumber: partNumber,
          uploadedSize: blob.size,
        });
      } catch (error) {
        return Promise.reject(`分片${partNumber}上传失败: ${error.message}`);
      }
    } else {
      const { code, data, msg } = await getPreSignUploadUrl({
        identifier: fileIdentifier,
        partNumber: partNumber,
        storageType: props.storageType,
      });
      if (code === 200 && data) {
        await axios.request({
          url: data,
          method: "PUT",
          data: blob,
          headers: { "Content-Type": "application/octet-stream" },
        });
        return Promise.resolve({
          partNumber: partNumber,
          uploadedSize: blob.size,
        });
      }
      return Promise.reject(`分片${partNumber}，获取上传地址失败`);
    }
  };

  const updateProcess = (increment: number, fileUid: string) => {
    increment = Number(increment);
    const { onProgress } = options;
    let factor = 1000;
    let from = 0;
    while (from <= increment) {
      from += factor;
      uploadedSize += factor;
      const percent = Math.round((uploadedSize / totalSize) * 100).toFixed(2);
      onProgress({ percent: percent });
      updateSpeed(fileUid, uploadedSize, startMs); // 更新上传速度
    }
  };

  return new Promise((resolve) => {
    const failArr = [];
    const queue = Queue(5, {
      retry: 3,
      retryIsJump: false,
      workReject: function (reason: string) {
        failArr.push(reason);
      },
      queueEnd: function () {
        resolve(failArr);
      },
    });
    fileUploadChunkQueue.value[file.uid] = queue;

    for (let partNumber = 1; partNumber <= chunkNum; partNumber++) {
      const exitPart = (exitPartList || []).find(
        (exitPart) => exitPart.partNumber === partNumber
      );
      if (exitPart) {
        lastUploadedSize += Number(exitPart.size);
        updateProcess(exitPart.size, file.uid);
      } else {
        queue.push(() =>
          uploadNext(partNumber).then((res) => {
            updateProcess(res.uploadedSize, file.uid);
          })
        );
      }
    }

    if (queue.getLength() === 0) {
      resolve(failArr);
      return;
    }

    queue.start();
  });
};

/**
 * 重试失败的文件
 */
const retryFailedFiles = async () => {
  // 使用 for...of 循环遍历失败的文件
  const newFileList = [...props.fileList];

  for (const [i, failedFile] of newFileList.entries()) {
    // 检查文件对象是否有效
    if (!failedFile) {
      console.warn(`文件对象无效，跳过`);
      continue;
    }

    const { file, retries, status } = failedFile;

    // 确保文件对象存在
    if (!file || typeof failedFile.status === "undefined") {
      console.warn("无法找到文件对象或status未定义", failedFile);
      continue;
    }

    // 如果该文件正在上传中，则跳过当前的重试，等下次再试
    if (status !== "failed") {
      console.log("文件正在上传，跳过当前重试");
      continue;
    }

    console.log("重试文件开始:" + file.name + "-" + file.uid);

    if (retries >= 3) {
      failedFile.status = "error";
      ElMessage.error(`${file.name} 上传失败，已达最大重试次数`);
      continue;
    }

    try {
      failedFile.retries += 1;

      const newOptions = {
        file: file,
        onProgress: (e: any) => {
          handleUploadProgress(file, e, failedFile);
        },
        onSuccess: () => {
          handleUploadSuccess(file, failedFile);
        },
        onError: (err: any) => {
          handleUploadError(file, err, failedFile);
        },
      };

      await handleHttpRequest(newOptions, failedFile.retries);
    } catch (error) {
      console.error(`${file.name} 第 ${failedFile.retries} 次重试失败:`, error);
      if (failedFile.retries >= 3) {
        failedFile.status = "error";
        ElMessage.error(`${file.name} 已超过最大重试次数`);
      }
    }
  }
  // 更新 fileList 到父组件
  emit("update:fileList", newFileList);
};

const handleUploadProgress = (file: File, e: any, failedFile: FileItem) => {
  const uploadFile = upload.value?.uploadFiles.find(
    (f: any) => f.uid === file.uid
  );
  if (uploadFile) {
    upload.value.handleProgress(e, uploadFile);
  }
  if (failedFile) {
    failedFile.progress = Math.round(e.percent);
  }
};

const handleUploadSuccess = (file: File, failedFile: FileItem) => {
  if (failedFile) {
    failedFile.status = "success";
  }
  ElMessage.success(`${file.name} 上传成功`);
};

const handleUploadError = (file: File, err: any, failedFile: FileItem) => {
  console.error(`${file.name} 上传失败:`, err);
  if (failedFile) {
    failedFile.status = "failed";
  }
  ElMessage.error(`${file.name} 上传失败`);
};

//手动重试
const retryFile = () => {
  //将fileList中所有状态为error的文件状态改为failed，设置重试次数为0
  const newFileList = [...props.fileList];
  newFileList.forEach((file) => {
    if (file.status === "error") {
      file.status = "failed";
      file.retries = 0;
    }
  });
  retryFailedFiles();
};

const startAutoRetry = () => {
  retryInterval.value = window.setInterval(() => {
    // 遍历fileList，判断是否存在status为failed的数据，存在咋调用重试方法
    for (let i = 0; i < props.fileList.length; i++) {
      if (props.fileList[i].status === "failed") {
        console.log(
          "存在失败的文件，开始重试" +
            props.fileList[i].name +
            "，重试次数" +
            props.fileList[i].retries
        );
        retryFailedFiles();
        return;
      }
    }
  }, 30000); // 每30秒检查一次失败文件队列
};

const clearFileList = () => {
  emit("update:fileList", []);
};

onMounted(() => {
  startAutoRetry();
});

onBeforeUnmount(() => {
  if (retryInterval.value) {
    clearInterval(retryInterval.value);
  }
  if (upload.value) {
    upload.value.abort();
  }
});
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.upload {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.upload-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  /* 添加定位上下文 */
  /* 设置最小高度 */
  min-height: 200px;
  height: 100%;
}

.upload-section.has-file-list {
  /* margin-right: 20px; */
}

.upload-demo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 确保 el-upload 本身的高度也填满 */
.upload-demo /deep/ .el-upload {
  width: 100%;
  height: 100%;
}

/* 确保拖拽区域自适应内容 */
.upload-demo /deep/ .el-upload-dragger {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  width: 100%;
  height: 100%;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  padding: 0; /* 移除默认 padding */
}

/* 拖拽区域 hover 效果 */
.upload-demo /deep/ .el-upload-dragger:hover {
  border-color: #409eff;
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 水平居中 */
  justify-content: center;
  /* 垂直居中 */
  text-align: center;
  /* 文字居中 */
  width: 100%;
}

/* 内容样式 */
.el-upload__content {
  display: flex;
  flex-direction: column;
  align-items: center; /* 内容内部水平居中 */
  text-align: center; /* 文字居中 */
}

/* 文字区域样式 */
.el-upload__text {
  margin-top: 10px;
}

/* 调整图标和文字间距 */
.el-upload__contenti {
  margin-bottom: 10px;
}

.upload-button {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
  padding: 10px 30px;
  transition: all 0.3s ease;
}

/* 进度条容器 */
.upload-info {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

/* 进度条容器 */
.upload-progress-bar {
  width: 100%;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 10px;
}

/* 进度条背景 */
.upload-progress-bar /deep/ .el-progress-bar__outer {
  background-color: #f5f7fa;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

/* 进度条填充 */
.upload-progress-bar /deep/ .el-progress-bar__inner {
  background: linear-gradient(to right, #409eff, #66b1ff);
  border-radius: 12px;
  transition: width 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2),
    0 2px 4px rgba(64, 158, 255, 0.2);
}

/* 完成时的样式 */
.upload-progress-bar.completed /deep/ .el-progress-bar__inner {
  background: #409eff;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

/* 进度条文字 */
.upload-progress-bar /deep/ .el-progress-bar__innerText {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 0 8px;
  transition: color 0.3s ease;
  color: var(--text-color, #606266);
  /* 默认颜色 */
}

/* 使用 CSS 条件判断动态颜色 */
.upload-progress-bar {
  --text-color: #606266;
  /* 默认深灰色 */
}

/* 通过内联样式绑定的 --progress-percentage 判断进度 */
.upload-progress-bar[style*="--progress-percentage: 0"],
.upload-progress-bar[style*="--progress-percentage: 1"],
.upload-progress-bar[style*="--progress-percentage: 2"],
.upload-progress-bar[style*="--progress-percentage: 3"],
.upload-progress-bar[style*="--progress-percentage: 4"],
.upload-progress-bar[style*="--progress-percentage: 5"],
.upload-progress-bar[style*="--progress-percentage: 6"],
.upload-progress-bar[style*="--progress-percentage: 7"],
.upload-progress-bar[style*="--progress-percentage: 8"],
.upload-progress-bar[style*="--progress-percentage: 9"],
.upload-progress-bar[style*="--progress-percentage: 10"],
.upload-progress-bar[style*="--progress-percentage: 20"] {
  --text-color: #606266;
  /* 0-20% 使用深灰色 */
}

.upload-progress-bar[style*="--progress-percentage: 30"],
.upload-progress-bar[style*="--progress-percentage: 40"] {
  --text-color: #303133;
  /* 30-40% 使用更深的灰色 */
}

.upload-progress-bar:not([style*="--progress-percentage: 0"]):not(
    [style*="--progress-percentage: 10"]
  ):not([style*="--progress-percentage: 20"]):not(
    [style*="--progress-percentage: 30"]
  ):not([style*="--progress-percentage: 40"])
  /deep/
  .el-progress-bar__innerText {
  color: #ffffff;
  /* 50%以上使用白色 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 4px rgba(64, 158, 255, 0.3);
}

/* 文件列表浮窗 */
.file-list-float {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 500px;
  max-height: 480px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

/* 添加悬浮框内容动画 */
.file-list-content {
  transition: opacity 0.3s ease;
}

.file-list-float:hover .file-list-content {
  opacity: 1;
}

.file-list-header {
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn,
.close-btn {
  padding: 0;
  color: #909399;
  font-size: 16px;
  transition: transform 0.3s ease, opacity 0.2s ease;
}

.action-btn:hover,
.close-btn:hover {
  color: #409eff;
  transform: rotate(90deg);
}

.file-list-content {
  flex: 1;
  overflow-y: auto;
  margin: 0;
  padding: 0;
}

.file-list-content::-webkit-scrollbar {
  width: 6px;
}

.file-list-content::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.file-list-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.file-list-content::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.file-list-content ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.file-item:not(:last-child)::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20px;
  width: calc(100% - 40px);
  height: 1px;
  background: #e4e7ed;
}

.file-icon {
  font-size: 20px;
  color: #606266;
  margin-right: 12px;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 12px;
}

.file-meta {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.file-size {
  font-size: 12px;
  color: #606266;
  width: 100px;
  text-align: center;
}

.file-speed {
  font-size: 12px;
  color: #909399;
  width: 60px;
  text-align: center;
  margin-right: 12px;
}

.file-status {
  font-size: 12px;
  color: #909399;
  width: 60px;
  text-align: center;
  margin-right: 12px;
}

.file-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.action-icon {
  font-size: 16px;
  color: #606266;
  cursor: pointer;
  transition: color 0.3s ease;
}

.action-icon:hover {
  color: #409eff;
}

/* 进度环容器 */
.progress-ring-wrapper {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 999;
  width: 72px; /* 容器缩小 */
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 环形进度条 */
.progress-ring-wrapper::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    var(--ring-color) calc(var(--progress) * 360deg),
    rgba(64, 158, 255, 0.1) 0
  );
  mask: radial-gradient(transparent 29px, #000 30px);
  -webkit-mask: radial-gradient(transparent 29px, #000 30px);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 切换按钮 */
.float-toggle-btn {
  position: fixed;
  /* bottom: 30px;
  right: 30px; */
  z-index: 999;

  color: white;
  border: none;
  width: 48px !important;
  height: 48px !important;
  font-size: 18px;
  background: var(--ring-color);
  transition: background 0.3s, transform 0.3s;
}

.float-toggle-btn:hover {
  transform: scale(1.08) rotate(12deg);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

/* 数字入场动画 */
.scale-enter-active {
  transition: all 0.3s ease-out;
}
.scale-leave-active {
  transition: all 0.2s ease-in;
}
.scale-enter,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-info {
    padding: 10px;
  }

  .upload-progress-bar {
    width: 75%;
  }

  .upload-section {
    padding: 24px;
  }

  .file-list-float {
    width: 360px;
    bottom: 70px;
    right: 15px;
  }

  .progress-ring-wrapper {
    bottom: 20px;
    right: 20px;
    width: 80px;
    height: 80px;
  }

  .float-toggle-btn {
    width: 56px !important;
    height: 56px !important;
    font-size: 20px;
  }

  .file-size {
    width: 40px;
  }

  .file-speed {
    width: 50px;
  }

  .file-status {
    width: 50px;
    margin-right: 8px;
  }
}
</style>

<style>
/* 悬浮框动画 */
.float-box-enter-active {
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease-out, -webkit-backdrop-filter 0.3s ease;
}

.float-box-leave-active {
  transition: transform 0.3s cubic-bezier(0.36, 0, 0.66, -0.56),
    opacity 0.2s ease-in, -webkit-backdrop-filter 0.2s ease;
}

.float-box-enter,
.float-box-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
  -webkit-backdrop-filter: blur(0px);
}

.float-box-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
  -webkit-backdrop-filter: blur(10px);
}
</style>
