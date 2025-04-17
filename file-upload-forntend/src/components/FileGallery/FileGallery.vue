<template>
  <!-- Template remains exactly the same -->
  <div class="gallery-container" @scroll="handleScroll" @contextmenu.prevent>
    <div class="gallery-header">
      <label for="storage-select">存储类型:</label>
      <select id="storage-select" v-model="selectedStorageType" @change="fetchFiles(true)">
        <option v-for="option in props.storageOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <label for="file-name-input">&nbsp;&nbsp;&nbsp;&nbsp;文件名:</label>
      <el-input v-model="selectedFileName" placeholder="请输入文件名" class="file-name-input" style="width: 150px;"
                @change="fetchFiles(true)"></el-input>
    </div>
    <div v-if="filePage.length === 0 && !loading" class="empty-tips">
      🖼️ 暂无已上传的文件
    </div>
    <div v-else-if="loading && filePage.length === 0" class="loading-tips">
      加载中...
    </div>
    <div v-else class="file-grid">
      <div v-for="file in filePage" :key="file.id" class="file-card"
           @contextmenu.prevent="showContextMenu($event, file)">
        <div class="preview-wrapper">
          <img v-if="isImage(file)" :src="file.accessUrl" :alt="file.fileName" class="preview-image"
               @click="openImagePreview(file)" loading="lazy"/>
          <div v-else-if="isVideo(file)" class="video-preview" @click="openVideoPreview(file)">
            <div class="play-button">▶</div>
          </div>
          <div v-else-if="isPdf(file)" class="pdf-preview" @click="openPdfPreview(file)">
            <div class="pdf-icon">📜</div>
          </div>
          <div v-else class="file-icon">📄</div>
        </div>
        <div class="file-meta">
          <div class="filename">{{ file.fileName }}</div>
          <div class="file-size-status">
            <div class="file-size">{{ formatSize(file.totalSize) }}</div>
            <div class="status-indicator">{{ formattedDate(file.createTime) }}</div>
          </div>
        </div>
      </div>

      <context-menu v-if="contextMenu.file" :file="contextMenu.file" :top="contextMenu.top" :left="contextMenu.left"
                    @copy-link="copyUrl" @share-file="shareFile" @delete-file="deleteFile"/>

    </div>
    <div v-if="loading && filePage.length > 0" class="loading-more">加载更多...</div>

    <!-- 预览弹窗 -->
    <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
      <div class="image-preview-content" @click.stop>
        <img :src="selectedImageUrl" alt="预览图片" class="full-image"/>
        <div class="close-button" @click="closeImagePreview">✖</div>
      </div>
    </div>
    <div v-if="showVideoPreview" class="video-preview-modal" @click="closeVideoPreview">
      <div class="video-preview-content" @click.stop>
        <video :src="selectedVideoUrl" controls class="full-video" autoplay></video>
        <div class="close-button" @click="closeVideoPreview">✖</div>
      </div>
    </div>
    <div v-if="showPdfPreview" class="pdf-preview-modal" @click="closePdfPreview">
      <div class="pdf-preview-content" @click.stop>
        <div v-if="loadingPdf" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>加载 PDF 中...</p>
        </div>
        <iframe v-show="!loadingPdf" :src="selectedPdfUrl" class="full-pdf" frameborder="0" @load="onPdfLoad"></iframe>
        <div class="close-button" @click="closePdfPreview">✖</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue'
import {ElMessage} from 'element-plus'
import ContextMenu from '../ContextMenu/ContextMenu.vue'
import {pageFiles, addSharedFile, deleteFile} from '@/utils/api'

interface FileItem {
  id: string
  fileName: string
  accessUrl: string
  contentType: string
  totalSize: number
  createTime: string
  fileIdentifier: string
}

interface StorageOption {
  label: string
  value: string
}

interface ContextMenuState {
  file: FileItem | null
  top: number
  left: number
}

const props = withDefaults(
    defineProps<{
      storageOptions?: StorageOption[]
    }>(),
    {
      storageOptions: () => [{label: 'Local', value: 'local'},
        {label: 'MinIO', value: 'minio'},
        {label: 'OSS', value: 'oss'}]
    }
)

const selectedStorageType = ref('local')
const selectedFileName = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const hasMore = ref(true)
const filePage = ref<FileItem[]>([])
const showImagePreview = ref(false)
const selectedImageUrl = ref('')
const showVideoPreview = ref(false)
const selectedVideoUrl = ref('')
const showPdfPreview = ref(false)
const selectedPdfUrl = ref('')
const loadingPdf = ref(false)
const contextMenu = ref<ContextMenuState>({
  file: null,
  top: 0,
  left: 0
})

const fetchFiles = async (reset = false) => {
  if (loading.value || (!reset && !hasMore.value)) return
  loading.value = true
  if (reset) {
    currentPage.value = 1
    filePage.value = []
    hasMore.value = true
  }
  try {
    const response = await pageFiles({
      page: currentPage.value,
      pageSize: pageSize.value,
      storageType: selectedStorageType.value,
      fileName: selectedFileName.value
    })
    const files = response.data.records || []
    filePage.value = reset ? files : [...filePage.value, ...files]
    hasMore.value = files.length === pageSize.value
    if (hasMore.value) currentPage.value++
  } catch (error) {
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleScroll = (event: Event) => {
  const container = event.target as HTMLElement
  const isBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10
  if (isBottom && !loading.value && hasMore.value) fetchFiles()
}

const isImage = (file: FileItem) => file.contentType.startsWith('image/')
const isVideo = (file: FileItem) => file.contentType.startsWith('video/')
const isPdf = (file: FileItem) => file.contentType === 'application/pdf'

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formattedDate = (date: string) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const openImagePreview = (file: FileItem) => {
  selectedImageUrl.value = file.accessUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  selectedImageUrl.value = ''
}

const openVideoPreview = (file: FileItem) => {
  selectedVideoUrl.value = file.accessUrl
  showVideoPreview.value = true
}

const closeVideoPreview = () => {
  showVideoPreview.value = false
  selectedVideoUrl.value = ''
}

const openPdfPreview = (file: FileItem) => {
  selectedPdfUrl.value = `${file.accessUrl}?response-content-disposition=inline`
  showPdfPreview.value = true
  loadingPdf.value = true
}

const onPdfLoad = () => {
  loadingPdf.value = false
}

const closePdfPreview = () => {
  showPdfPreview.value = false
  selectedPdfUrl.value = ''
  loadingPdf.value = false
}

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage({message: '文件URL已复制到剪贴板', type: 'success', duration: 2000})
  } catch (error) {
    console.error('复制URL失败:', error)
    ElMessage.error('复制URL失败')
  }
}

const showContextMenu = (event: MouseEvent, file: FileItem) => {
  contextMenu.value.file = file
  contextMenu.value.top = event.clientY
  contextMenu.value.left = event.clientX
}

const shareFile = async (file: FileItem) => {
  const res = await addSharedFile(file.fileIdentifier)
  if (res.code === 200) {
    ElMessage.success('分享成功')
  }
}

const deleteFile = (file: FileItem) => {
  ElMessageBox.confirm('确定要删除此文件吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const res = await deleteFile(file.fileIdentifier)
    if (res.code === 200) {
      fetchFiles(true)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const hideContextMenu = () => {
  contextMenu.value.file = null
}

onMounted(() => {
  document.addEventListener('click', hideContextMenu)
  fetchFiles(true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>


<style scoped>
/* eslint-disable */
.gallery-container {
  padding: 1rem 2rem 2rem;
  height: 400px;
  background: #fcfdff;
  border-top: 1px solid #f0f7ff;
  overflow-y: auto;
}

.gallery-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}

.gallery-header label {
  font-size: 14px;
  color: #333;
}

.gallery-header select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.empty-tips,
.loading-tips {
  text-align: center;
  color: #999;
  font-size: 1.2rem;
  padding: 4rem 0;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.loading-more {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 1rem 0;
}

.file-card {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.file-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(25, 118, 210, 0.2);
}

.preview-wrapper {
  position: relative;
  padding-top: 100%;
  background: #f8fafd;
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-bottom: 1px solid #eee;
}

.file-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  opacity: 0.6;
}

.file-meta {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
}

.file-size-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filename {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.7rem;
  color: #666;
  margin: 0.2rem 0;
}

.status-indicator {
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.65rem;
  background: #e8f5e9;
  color: #2e7d32;
}

.image-preview-modal,
.video-preview-modal,
.pdf-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.image-preview-content,
.video-preview-content,
.pdf-preview-content {
  position: relative;
  width: 90vw;
  height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.full-image,
.full-video {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.full-pdf {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background: #fff;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 18px;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  opacity: 0.8;
  margin-top: -105px;
}

.pdf-preview {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.pdf-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 2rem;
  opacity: 0.8;
  margin-top: -105px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 201;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f7ff;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-overlay p {
  margin-top: 10px;
  color: #fff;
  font-size: 14px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>