<template>
  <div class="upload-container" :style="{ width: computedWidth }">
    <div class="upload">
      <div class="upload-section" :class="{ 'has-file-list': fileList.length > 0 }" :style="{ height: computedHeight }">
        <el-upload ref="upload" class="upload-demo" drag action="/" multiple :accept="props.accept"
                   :http-request="handleHttpRequest" :show-file-list="false">
          <!-- Slot: Allows custom upload box content -->
          <slot name="uploadContent">
            <!-- Default content -->
            <div class="el-upload__content" >
              <i class="el-icon-upload" style="font-size: 60px;"></i>
              <div class="el-upload__text">
                <p style="font-size: 15px; color: #797979" v-if="fileList.length > 0">Click blank area to continue uploading</p>
                <p style="font-size: 15px; color: #797979" v-else>Drag file here or click to upload</p>
                <p style="color: #999999">Supports {{ props.accept }} format, single file max {{ maxSize /1024/1024 }}MB</p>
              </div>
            </div>
          </slot>
        </el-upload>
      </div>

      <transition name="float-box" @before-enter="beforeEnter" @after-leave="afterLeave">
        <!-- File list floating box -->
        <div class="file-list-float" v-if="showFileList && fileList.length > 0" :style="floatStyle">
          <div class="file-list-header">
            <span>Upload List ({{ fileList.length }})</span>
            <div class="header-actions">
              <el-tooltip content="Retry All" placement="top">
                <el-button type="text" @click="retryFile" class="action-btn">
                  <i class="el-icon-refresh"></i>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Clear List" placement="top">
                <el-button type="text" @click="clearFileList" class="action-btn">
                  <i class="el-icon-delete"></i>
                </el-button>
              </el-tooltip>
              <el-tooltip content="Collapse" placement="top">
                <el-button type="text" @click="toggleFileList" class="close-btn">
                  <i class="el-icon-minus"></i>
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <div class="file-list-content">
            <ul>
              <li v-for="(file, index) in sortedFileList" :key="index" class="file-item"
                  :style="getBackgroundStyle(file)">
                <i :class="getFileIcon(file.name)" class="file-icon"></i>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                    <span class="file-speed">{{ file.status === 'uploading' ? `${file.speed} MB/s` : '' }}</span>
                    <span class="file-status">{{ getStatusText(file.status, file.retries) }}</span>
                    <div class="file-actions">
                      <i :class="file.status === 'uploading' ? 'el-icon-video-pause' : 'el-icon-video-play'"
                         class="action-icon" @click="togglePause(file)"></i>
                      <i class="el-icon-delete action-icon" @click="handleRemoveFile(file, index)"></i>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </transition>

      <!-- Floating box toggle button -->
      <div class="progress-ring-wrapper" :style="ringStyle" v-if="fileList.length > 0">
        <el-button class="float-toggle-btn" circle icon="el-icon-folder-opened"
                   @click="toggleFileList">
        </el-button>
      </div>
    </div>
  </div>
</template>

<script  setup lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import md5 from '@/utils/md5'
import Queue from 'promise-queue-plus'
import axios from 'axios'
import { baseUrl } from '@/utils/http'
import { getUploadProgress, createMultipartUpload, getPreSignUploadUrl, merge, uploadFile, uploadPart } from '@/utils/api'

interface FileItem {
  file: File
  name: string
  status: 'success' | 'error' | 'uploading' | 'paused' | 'pending' | 'failed'
  progress: number
  speed: string
  uid: string
  fileSize: number
  lastUploadedSize: number
  startTime: number
  identifier: string
  retries: number
  fileId: string | null
  pauseTime?: number
  url?: string
}

interface UploadOptions {
  file: File
  onProgress: (e: { percent: number }) => void
  onSuccess?: () => void
  onError?: (err: any) => void
}

interface TaskRecord {
  exitPartList?: any[]
  chunkSize: number
  chunkNum: number
  fileIdentifier: string
  id: string
  finished?: boolean
  path?: string
}

const fileUploadChunkQueue: Record<string, any> = {}

const props = withDefaults(
    defineProps<{
      accept?: string;
      maxSize?: number;
      fileList: FileItem[];
      folder?: string;
      width?: string | number;
      height?: string | number;
      storageType?: string;
    }>(),
    {
      accept: '.jpg,.png,.mp4,.exe',
      maxSize: 200 * 1024 * 1024,
      fileList: () => [],
      folder: 'default',
      width: '100%',
      height: '250px',
      storageType: 'local',
    }
);

console.log(props.accept)

    const upload = ref<any>(null)
    const showFileList = ref(false)
    const retryInterval = ref<NodeJS.Timeout | null>(null)
    const floatStyle = ref({})

    const computedWidth = computed(() => {
      return typeof props.width === 'number' ? `${props.width}px` : props.width
    })

    const computedHeight = computed(() => {
      return typeof props.height === 'number' ? `${props.height}px` : props.height
    })

    const successCount = computed(() => {
      return props.fileList.filter(file => file.status === 'success').length
    })

    const uploadProgress = computed(() => {
      return props.fileList.length > 0
          ? Number(((successCount.value / props.fileList.length) * 100).toFixed(2))
          : 0
    })

    const sortedFileList = computed(() => {
      const statusPriority = {
        error: 0,
        failed: 1,
        uploading: 2,
        paused: 3,
        pending: 4,
        success: 5
      }
      return [...props.fileList].sort((a, b) => {
        return statusPriority[a.status] - statusPriority[b.status]
      })
    })

    const ringStyle = computed(() => {
      const progress = uploadProgress.value / 100
      const circumference = 2 * Math.PI * 40

      return {
        '--progress': progress,
        '--stroke-dashoffset': circumference * (1 - progress),
        '--ring-color': getRingColor(uploadProgress.value)
      }
    })

    const beforeEnter = (el: HTMLElement) => {
      const btn = document.querySelector('.float-toggle-btn')
      const rect = btn?.getBoundingClientRect()
      if (rect) {
        el.style.transformOrigin = `${rect.right}px ${rect.bottom}px`
      }
    }

    const afterLeave = (el: HTMLElement) => {
      el.style.transformOrigin = 'bottom right'
    }

    const formatFileSize = (size: number) => {
      if (!size) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let value = size
      let unitIndex = 0

      while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024
        unitIndex++
      }

      return `${value.toFixed(2).replace(/\.?0+$/, '')} ${units[unitIndex]}`
    }
const emit = defineEmits(['update:fileList'])

    const togglePause = (file: FileItem) => {
      console.log('Pause/Resume file:', file.name)
      const queue = fileUploadChunkQueue[file.uid]
      if (!queue) {
        ElMessage.warning(`${file.name} has no active upload task`)
        return
      }
      const fileIndex = props.fileList.findIndex(f => f.uid === file.uid)
      if (fileIndex === -1) return

      if (file.status === 'uploading') {
        // Pause
        queue.stop()
        props.fileList[fileIndex].status = 'paused'
        props.fileList[fileIndex].pauseTime = new Date().getTime()
        props.fileList[fileIndex].speed = '0'
        ElMessage.info(`${file.name} paused`)
      } else if (file.status === 'paused') {
        // Resume
        queue.start()
        props.fileList[fileIndex].status = 'uploading'
        props.fileList[fileIndex].startTime = new Date().getTime() -
            (props.fileList[fileIndex].pauseTime! - props.fileList[fileIndex].startTime)
        delete props.fileList[fileIndex].pauseTime
        ElMessage.info(`${file.name} resumed`)
      }
      emit('update:fileList', [...props.fileList])
    }

    const getFileIcon = (filename: string) => {
      const ext = filename.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'pdf': return 'el-icon-document'
        case 'jpg':
        case 'jpeg':
        case 'png': return 'el-icon-picture-outline'
        default: return 'el-icon-files'
      }
    }

    const getBackgroundStyle = (file: FileItem) => {
      const progress = file.progress || 0
      const color = getProgressColor(file.status)
      if (progress === 0 || progress === 100) {
        return {
          background: color,
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
        }
      }
      return {
        background: `linear-gradient(to right,
          ${color} ${progress}%,
          rgba(255, 255, 255, 0.92) ${progress}%)`,
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
      }
    }

    const getProgressColor = (status: string) => {
      const colors: Record<string, string> = {
        success: 'rgba(56, 178, 108, 0.18)',
        error: 'rgba(255, 86, 110, 0.15)',
        failed: 'rgba(255, 86, 110, 0.15)',
        uploading: 'rgba(76, 155, 245, 0.18)',
        paused: 'rgba(255, 165, 0, 0.18)',
        default: 'rgba(226, 232, 240, 0.7)'
      }
      return colors[status] || colors.default
    }

    const getStatusText = (status: string, retries: number) => {
      if (status === 'error' && retries) return `Failed (${retries})`
      const statusMap: Record<string, string> = {
        success: 'Success',
        error: 'Failed',
        uploading: 'Uploading',
        paused: 'Paused',
        pending: 'Pending'
      }
      return statusMap[status] || 'Pending'
    }

    const getRingColor = (progress: number) => {
      if (props.fileList.some(file => file.status === 'error')) {
        return '#F56C6C'
      }

      if (progress === 100) return '#409EFF'
      if (progress > 70) return '#67C23A'
      if (progress > 40) return '#E6A23C'
      return '#C0C4CC'
    }

    const toggleFileList = () => {
      showFileList.value = !showFileList.value
    }

    const formatProgress = (percentage: number) => {
      return `Upload progress: ${successCount.value}/${props.fileList.length} (${percentage}%)`
    }

    const updateFileStatus = (uid: string, status: string, progress = 0, url = null, fileId = null) => {
      const fileIndex = props.fileList.findIndex((f) => f.uid === uid)
      if (fileIndex !== -1) {
        props.fileList[fileIndex].status = status as any
        props.fileList[fileIndex].progress = progress
        if (url) {
          props.fileList[fileIndex].url = url
        }
        if (fileId) {
          props.fileList[fileIndex].fileId = fileId
        }
        emit('update:fileList', [...props.fileList])
      }
    }

    const handleRemoveFile = (file: FileItem) => {
      const index = props.fileList.findIndex((f) => f.uid === file.uid)
      props.fileList.splice(index, 1)
      const queueObject = fileUploadChunkQueue[file.uid]
      if (queueObject) {
        queueObject.stop()
        fileUploadChunkQueue[file.uid] = undefined
      }
      emit('update:fileList', [...props.fileList])
    }

    const getTaskInfo = async (file: File) => {
      let task: TaskRecord | null = null
      try {
        const identifier = await md5(file)
        const { code, data, msg } = await getUploadProgress(identifier, props.storageType)
        console.log('getTaskInfo', code, data, msg)
        if (code === 200) {
          task = data
          if (!task) {
            const { code, data, msg } = await createMultipartUpload({
              identifier,
              fileName: file.name,
              totalSize: file.size,
              chunkSize: 5 * 1024 * 1024,
              contentType: file.type,
              folder: props.folder,
              storageType: props.storageType
            })
            if (code === 200) {
              task = data
            } else {
              ElMessage.error(msg)
            }
          }
        } else {
          updateFileStatus(file.uid, 'failed')
        }
      } catch (e) {
        console.log('getTaskInfo', e)
        updateFileStatus(file.uid, 'failed')
      }
      return task
    }

    const handleUpload = async (file: File, taskRecord: TaskRecord, options: UploadOptions) => {
      let lastUploadedSize = 0
      let uploadedSize = 0
      const totalSize = file.size || 0
      const startMs = new Date().getTime()
      const { exitPartList, chunkSize, chunkNum, fileIdentifier } = taskRecord

      const updateSpeed = (fileUid: string, uploadedSize: number, startTime: number) => {
        const fileIndex = props.fileList.findIndex(f => f.uid === fileUid)
        if (fileIndex !== -1) {
          const file = props.fileList[fileIndex]
          if (file.status !== 'paused') {
            const currentTime = new Date().getTime()
            const elapsedTime = (currentTime - startTime) / 1000
            props.fileList[fileIndex].speed = (uploadedSize / 1024 / 1024 / elapsedTime).toFixed(2)
            props.fileList[fileIndex].status = 'uploading'
            props.fileList[fileIndex].progress = Math.floor((uploadedSize / totalSize) * 100)
            emit('update:fileList', [...props.fileList])
          }
        }
      }

      const uploadNext = async (partNumber: number) => {
        const start = chunkSize * (partNumber - 1)
        const end = start + chunkSize
        const blob = file.slice(start, end)

        if (props.storageType === 'local') {
          const formData = new FormData()
          formData.append('uploadId', fileIdentifier)
          formData.append('partNumber', partNumber.toString())
          formData.append('file', blob)

          try {
            const response = await uploadPart({
              uploadId: fileIdentifier,
              partNumber: partNumber,
              partFile: blob,
              storageType: props.storageType
            })
            return Promise.resolve({ partNumber: partNumber, uploadedSize: blob.size })
          } catch (error) {
            return Promise.reject(`Part ${partNumber} upload failed: ${error.message}`)
          }
        } else {
          const { code, data, msg } = await getPreSignUploadUrl({
            identifier: fileIdentifier,
            partNumber: partNumber,
            storageType: props.storageType
          })
          if (code === 200 && data) {
            await axios.request({
              url: data,
              method: 'PUT',
              data: blob,
              headers: { 'Content-Type': 'application/octet-stream' }
            })
            return Promise.resolve({ partNumber: partNumber, uploadedSize: blob.size })
          }
          return Promise.reject(`Part ${partNumber}, failed to get upload URL`)
        }
      }

      const updateProcess = (increment: number, fileUid: string) => {
        increment = Number(increment)
        const { onProgress } = options
        let factor = 1000
        let from = 0
        while (from <= increment) {
          from += factor
          uploadedSize += factor
          const percent = Math.round((uploadedSize / totalSize) * 100).toFixed(2)
          onProgress({ percent: Number(percent) })
          updateSpeed(fileUid, uploadedSize, startMs)
        }
      }

      return new Promise<string[]>((resolve) => {
        const failArr: string[] = []
        const queue = Queue(5, {
          retry: 3,
          retryIsJump: false,
          workReject: function (reason: string) {
            failArr.push(reason)
          },
          queueEnd: function () {
            resolve(failArr)
          }
        })
        fileUploadChunkQueue[file.uid] = queue

        for (let partNumber = 1; partNumber <= chunkNum; partNumber++) {
          const exitPart = (exitPartList || []).find((exitPart: any) => exitPart.partNumber === partNumber)
          if (exitPart) {
            lastUploadedSize += Number(exitPart.size)
            updateProcess(exitPart.size, file.uid)
          } else {
            queue.push(() => uploadNext(partNumber).then(res => {
              updateProcess(res.uploadedSize, file.uid)
            }))
          }
        }

        if (queue.getLength() === 0) {
          resolve(failArr)
          return
        }

        queue.start()
      })
    }

    const handleHttpRequest = async (options: UploadOptions, retries?: number) => {
      const file = options.file
      const fileSize = file.size

      if (fileSize > props.maxSize) {
        ElMessage.error(`File ${file.name} exceeds size limit (${props.maxSize / 1024 / 1024}MB)`)
        return
      }

      const acceptTypes = props.accept.split(',').map(type => type.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptTypes.includes(fileExtension!)) {
        ElMessage.error(`File ${file.name} type not supported, only ${props.accept} formats are supported`)
        return
      }

      const identifier = await md5(file)

      const existingFile = props.fileList.find(
          (f) => f.identifier === identifier
      )
      if (existingFile) {
        if (existingFile.status === 'success') {
          ElMessage.info(`File ${file.name} already uploaded successfully, skipped`)
          return
        } else if (existingFile.status === 'uploading') {
          ElMessage.info(`File ${file.name} is being uploaded, skipped`)
          return
        } else if (existingFile.status === 'failed' || existingFile.status === 'error') {
          existingFile.status = 'uploading'
          existingFile.retries = retries || 0
          existingFile.progress = 0
          emit('update:fileList', [...props.fileList])
        }
      } else {
        const newFile: FileItem = {
          file: file,
          name: file.name,
          status: 'pending',
          progress: 0,
          speed: '0',
          uid: file.uid,
          fileSize: fileSize,
          lastUploadedSize: 0,
          startTime: new Date().getTime(),
          identifier: identifier,
          retries: retries || 0,
          fileId: null,
          paused: false
        }
        props.fileList.push(newFile)
        emit('update:fileList', [...props.fileList])
      }

      showFileList.value = true

      if (fileSize <= 5 * 1024 * 1024) {
        try {
          updateFileStatus(file.uid, 'uploading', 10)
          const response = await uploadFile({
            file: file,
            folder: props.folder,
            storageType: props.storageType
          })
          if (response.code === 200) {
            updateFileStatus(file.uid, 'success', 100, response.data.accessUrl, response.data.fileId)
          }
        } catch (error) {
          updateFileStatus(file.uid, 'failed')
        }
      } else {
        const task = await getTaskInfo(file)
        if (task) {
          const { finished, path, taskRecord } = task
          const { fileIdentifier: identifier, id: fileId } = taskRecord
          if (finished) {
            updateFileStatus(file.uid, 'success', 100, path, fileId)
          } else {
            try {
              const errorList = await handleUpload(file, taskRecord, options)
              if (errorList.length > 0) {
                updateFileStatus(file.uid, 'failed')
              } else {
                const { code, data } = await merge(identifier, props.storageType)
                if (code === 200) {
                  updateFileStatus(file.uid, 'success', 100, data.accessUrl, data.id)
                } else {
                  updateFileStatus(file.uid, 'failed')
                }
              }
            } catch (error) {
              updateFileStatus(file.uid, 'failed')
            }
          }
        } else {
          updateFileStatus(file.uid, 'failed')
        }
      }
    }

    const handleUploadProgress = (file: File, e: { percent: number }, failedFile: FileItem) => {
      const uploadFile = upload.value?.uploadFiles.find((f: any) => f.uid === file.uid)
      if (uploadFile) {
        upload.value?.handleProgress(e, uploadFile)
      }
      if (failedFile) {
        failedFile.progress = Math.round(e.percent)
      }
    }

    const handleUploadSuccess = (file: File, failedFile: FileItem) => {
      if (failedFile) {
        failedFile.status = 'success'
      }
      ElMessage.success(`${file.name} uploaded successfully`)
    }

    const handleUploadError = (file: File, err: any, failedFile: FileItem) => {
      console.error(`${file.name} upload failed:`, err)
      if (failedFile) {
        failedFile.status = 'failed'
      }
      ElMessage.error(`${file.name} upload failed`)
    }

    const retryFile = () => {
      props.fileList.forEach(file => {
        if (file.status === 'error') {
          file.status = 'failed'
          file.retries = 0
        }
      })
      retryFailedFiles()
    }

    const retryFailedFiles = async () => {
      for (const [i, failedFile] of props.fileList.entries()) {
        if (!failedFile) {
          console.warn(`Invalid file object, skipped`)
          continue
        }

        const { file, retries, status } = failedFile

        if (!file || typeof failedFile.status === 'undefined') {
          console.warn('Cannot find file object or status is undefined', failedFile)
          continue
        }

        if (status !== 'failed') {
          console.log('File is being uploaded, skip current retry')
          continue
        }

        console.log('Retry file start:' + file.name + '-' + file.uid)

        if (retries >= 3) {
          failedFile.status = 'error'
          ElMessage.error(`${file.name} upload failed, reached maximum retry count`)
          continue
        }

        try {
          failedFile.retries += 1

          const newOptions: UploadOptions = {
            file: file,
            onProgress: (e) => {
              handleUploadProgress(file, e, failedFile)
            },
            onSuccess: () => {
              handleUploadSuccess(file, failedFile)
            },
            onError: (err) => {
              handleUploadError(file, err, failedFile)
            }
          }

          const path = await handleHttpRequest(newOptions, failedFile.retries)

          const uploadFile = {
            ...file,
            name: file.name,
            url: path,
            status: 'success',
          }

          const index = upload.value?.uploadFiles.findIndex((f: any) => f.uid === file.uid)
          if (index !== -1) {
            upload.value?.uploadFiles.splice(index, 1)
          }

          nextTick(() => {
            upload.value?.uploadFiles.push(uploadFile)
          })

        } catch (error) {
          console.error(`${file.name} retry ${failedFile.retries} failed:`, error)
          if (failedFile.retries >= 3) {
            failedFile.status = 'error'
            ElMessage.error(`${file.name} exceeded maximum retry count`)
          }
        }
      }
      emit('update:fileList', [...props.fileList])
    }

    const startAutoRetry = () => {
      retryInterval.value = setInterval(() => {
        for (let i = 0; i < props.fileList.length; i++) {
          if (props.fileList[i].status === 'failed') {
            console.log('Failed files exist, start retry' + props.fileList[i].name + ", retry count" + props.fileList[i].retries)
            retryFailedFiles()
            return
          }
        }
      }, 30000)
    }

    const clearFileList = () => {
      props.fileList.length = 0
      emit('update:fileList', [])
    }

    onMounted(() => {
      startAutoRetry()
    })

    onBeforeUnmount(() => {
      upload.value?.abort()
      if (retryInterval.value) {
        clearInterval(retryInterval.value)
      }
    })

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
  background-color: #409EFF;
  border-color: #409EFF;
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
  box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.2),
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

.upload-progress-bar:not([style*="--progress-percentage: 0"]):not([style*="--progress-percentage: 10"]):not([style*="--progress-percentage: 20"]):not([style*="--progress-percentage: 30"]):not([style*="--progress-percentage: 40"]) /deep/ .el-progress-bar__innerText {
  color: #ffffff;
  /* 50%以上使用白色 */
  text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.1),
      0 0 4px rgba(64, 158, 255, 0.3);
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
  box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.12),
      0 8px 16px rgba(0, 0, 0, 0.08),
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
  transition:
      transform 0.3s ease,
      opacity 0.2s ease;
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
  content: '';
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
  width: 72px;  /* 容器缩小 */
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 环形进度条 */
.progress-ring-wrapper::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
      conic-gradient(
          var(--ring-color) calc(var(--progress) * 360deg),
          rgba(64,158,255,0.1) 0
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
  transition:
      background 0.3s,
      transform 0.3s;
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
  transition:
      transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.4s ease-out,
      -webkit-backdrop-filter 0.3s ease;
}

.float-box-leave-active {
  transition:
      transform 0.3s cubic-bezier(0.36, 0, 0.66, -0.56),
      opacity 0.2s ease-in,
      -webkit-backdrop-filter 0.2s ease;
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

<!--<style scoped>-->
<!--/* Keep all your existing styles the same */-->
<!--.upload-container {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  width: 100%;-->
<!--}-->

<!--.upload {-->
<!--  display: flex;-->
<!--  flex-direction: row;-->
<!--  align-items: stretch;-->
<!--}-->
<!--.upload-section {-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--}-->
<!--.upload-demo {-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--}-->

<!--.el-upload__content {-->
<!--  width: 100%;-->
<!--  max-width: 500px;-->
<!--  min-width: 280px;-->
<!--  aspect-ratio: 1.6;-->
<!--  border-radius: 6px;-->
<!--  display: inline-flex;-->
<!--  flex-direction: column;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--  padding: 20px;-->
<!--  box-sizing: border-box;-->
<!--  transition: all 0.3s ease;-->
<!--}-->

<!--.el-upload__text {-->
<!--  margin-top: 10px;-->
<!--  text-align: center;-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--}-->

<!--.el-upload__text p {-->
<!--  margin: 4px 0;-->
<!--  line-height: 1.5;-->
<!--  font-size: 14px;-->
<!--  color: #666;-->
<!--}-->


<!--</style>-->

<!--<style>-->
<!--/* Keep your animation styles the same */-->
<!--.float-box-enter-active {-->
<!--  transition:-->
<!--      transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),-->
<!--      opacity 0.4s ease-out,-->
<!--      -webkit-backdrop-filter 0.3s ease;-->
<!--}-->

<!--/* ... rest of your animation styles ... */-->
<!--</style>-->