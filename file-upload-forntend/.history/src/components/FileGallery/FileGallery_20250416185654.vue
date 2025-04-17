<!-- FileGallery.vue -->
<template>
  <div class="file-gallery">
    <div class="gallery-header">
      <div class="storage-type">
        <el-select v-model="storageType" placeholder="选择存储类型">
          <el-option label="本地存储" value="local" />
          <el-option label="云存储" value="cloud" />
        </el-select>
      </div>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件名"
          prefix-icon="el-icon-search"
          clearable
        />
      </div>
    </div>

    <div class="gallery-content">
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="files.length === 0" class="empty-state">
        <el-empty description="暂无文件" />
      </div>
      <div v-else class="file-grid">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-item"
          @click="handleFileClick(file)"
          @contextmenu.prevent="showContextMenu($event, file)"
        >
          <div class="file-icon">
            <i :class="getFileIcon(file.type)" />
          </div>
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span>{{ formatFileSize(file.size) }}</span>
              <span>{{ formatDate(file.uploadTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <context-menu
      v-if="contextMenuVisible"
      :file="selectedFile"
      :position="contextMenuPosition"
      @copy-link="copyFileLink"
      @share="shareFile"
      @delete="deleteFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import ContextMenu from "../ContextMenu/ContextMenu.vue";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadTime: string;
  url: string;
}

const storageType = ref("local");
const searchQuery = ref("");
const loading = ref(false);
const files = ref<FileItem[]>([]);
const contextMenuVisible = ref(false);
const selectedFile = ref<FileItem | null>(null);
const contextMenuPosition = ref({ top: 0, left: 0 });

const filteredFiles = computed(() => {
  if (!searchQuery.value) return files.value;
  const query = searchQuery.value.toLowerCase();
  return files.value.filter((file) => file.name.toLowerCase().includes(query));
});

const getFileIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    image: "el-icon-picture",
    video: "el-icon-video-camera",
    audio: "el-icon-headset",
    document: "el-icon-document",
    archive: "el-icon-folder",
    default: "el-icon-document",
  };
  return iconMap[type] || iconMap.default;
};

const formatFileSize = (size: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(1)} ${units[index]}`;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};

const handleFileClick = (file: FileItem) => {
  window.open(file.url, "_blank");
};

const showContextMenu = (event: MouseEvent, file: FileItem) => {
  selectedFile.value = file;
  contextMenuPosition.value = {
    top: event.clientY,
    left: event.clientX,
  };
  contextMenuVisible.value = true;
};

const copyFileLink = async () => {
  if (!selectedFile.value) return;
  try {
    await navigator.clipboard.writeText(selectedFile.value.url);
    ElMessage.success("链接已复制到剪贴板");
  } catch (error) {
    ElMessage.error("复制链接失败");
  }
};

const shareFile = () => {
  if (!selectedFile.value) return;
  // TODO: 实现文件分享功能
  ElMessage.info("分享功能开发中");
};

const deleteFile = async () => {
  if (!selectedFile.value) return;
  try {
    // TODO: 调用删除文件 API
    const index = files.value.findIndex((f) => f.id === selectedFile.value?.id);
    if (index !== -1) {
      files.value.splice(index, 1);
    }
    ElMessage.success("文件已删除");
  } catch (error) {
    ElMessage.error("删除文件失败");
  }
};

// 监听点击事件以关闭上下文菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

onMounted(() => {
  document.addEventListener("click", closeContextMenu);
  // TODO: 加载文件列表
});

onUnmounted(() => {
  document.removeEventListener("click", closeContextMenu);
});
</script>

<style scoped>
.file-gallery {
  padding: 20px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.storage-type {
  width: 200px;
}

.search-box {
  width: 300px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.file-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.file-icon {
  font-size: 40px;
  color: #409eff;
  text-align: center;
  margin-bottom: 10px;
}

.file-info {
  text-align: center;
}

.file-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.loading-state,
.empty-state {
  padding: 40px;
  text-align: center;
}
</style>
