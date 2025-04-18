<!-- FileConverter.vue -->
<template>
  <div class="container">
    <!-- Main Conversion Area -->
    <div class="conversion-box">
      <div class="inner-box">
        <div class="flex-container">
          <!-- File Upload Area -->
          <div class="flex-item">
            <el-upload
                ref="upload"
                class="upload-demo"
                drag
                :auto-upload="false"
                :on-change="handleFileSelect"
                :on-remove="handleRemove"
                :limit="1"
                :show-file-list="false"
            >
              <div class="upload-icon" style="margin-top: 20px;"></div>
              <div class="el-upload__text">
                <h3 class="upload-title">拖放文件到这里</h3>
                <p>或点击选择文件</p>
              </div>
              <template #tip>
                <div class="support-text">支持PDF, DOCX, PPTX, XLSX, JPG, PNG, MP4等格式</div>
              </template>
            </el-upload>
            <div v-if="selectedFile" class="file-info">
              <div class="file-details">
                <div class="file-icon"></div>
                <div class="file-content">
                  <div class="file-header">
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                  </div>
                  <div class="progress-container">
                    <div class="progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
                  </div>
                </div>
                <button class="remove-button" @click="resetFileInput">×</button>
              </div>
            </div>
          </div>

          <!-- Conversion Options -->
          <div class="flex-item">
            <div class="options-container">
              <div>
                <label class="label">原始格式</label>
                <select v-model="fromFormat" class="select-box" disabled>
                  <option value="">自动检测</option>
                  <option v-if="detectedFormat" :value="detectedFormat.value">{{ detectedFormat.text }}</option>
                </select>
              </div>

              <div class="swap-container">
                <button @click="swapFormats" class="swap-button">⇅</button>
              </div>

              <div>
                <label class="label">目标格式</label>
                <select v-model="toFormat" class="select-box">
                  <option value="">选择目标格式</option>
                  <optgroup label="文档">
                    <option value="pdf">PDF</option>
                    <option value="docx">Word (DOCX)</option>
                    <option value="pptx">PowerPoint (PPTX)</option>
                    <option value="xlsx">Excel (XLSX)</option>
                    <option value="txt">纯文本 (TXT)</option>
                  </optgroup>
                  <optgroup label="图像">
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="gif">GIF</option>
                    <option value="webp">WebP</option>
                  </optgroup>
                  <optgroup label="音频">
                    <option value="mp3">MP3</option>
                    <option value="wav">WAV</option>
                    <option value="flac">FLAC</option>
                  </optgroup>
                  <optgroup label="视频">
                    <option value="mp4">MP4</option>
                    <option value="mov">MOV</option>
                    <option value="avi">AVI</option>
                  </optgroup>
                </select>
              </div>

              <div class="convert-button-container">
                <button
                    @click="startConversion"
                    :disabled="!selectedFile || !toFormat || isConverting"
                    class="convert-button"
                >
                  <span>开始转换</span>
                  <span v-show="isConverting" class="spinner"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Result Modal -->
    <div v-if="showResultModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-inner">
          <div class="modal-header">
            <h3 class="modal-title">转换完成!</h3>
            <button @click="showResultModal = false" class="close-button">×</button>
          </div>
          <div class="modal-body">
            <div class="success-icon"></div>
            <p class="modal-text">文件已成功转换</p>
            <div class="modal-buttons">
              <a :href="downloadLink" :download="downloadFileName" class="download-button">
                下载文件
              </a>
              <button @click="newConversion" class="new-convert-button">
                新转换
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

// 定义响应式数据
const selectedFile = ref<File | null>(null);
const uploadProgress = ref(0);
const fromFormat = ref('');
const toFormat = ref('');
const isConverting = ref(false);
const showResultModal = ref(false);
const downloadLink = ref('');
const downloadFileName = ref('');
const conversionHistory = ref([
  { id: 1, name: 'document.pdf', from: 'pdf', to: 'docx', date: '2023-05-15', size: '2.4 MB' },
  { id: 2, name: 'presentation.pptx', from: 'pptx', to: 'pdf', date: '2023-05-10', size: '5.1 MB' },
  { id: 3, name: 'image.jpg', from: 'jpg', to: 'png', date: '2023-05-05', size: '1.2 MB' }
]);

// 计算属性：检测文件格式
const detectedFormat = computed(() => {
  if (!selectedFile.value) return null;
  const extension = selectedFile.value.name.split('.').pop()?.toLowerCase() || '';
  const formatMap: Record<string, string> = {
    pdf: 'PDF',
    doc: 'Word (DOC)',
    docx: 'Word (DOCX)',
    ppt: 'PowerPoint (PPT)',
    pptx: 'PowerPoint (PPTX)',
    xls: 'Excel (XLS)',
    xlsx: 'Excel (XLSX)',
    jpg: 'JPG',
    jpeg: 'JPEG',
    png: 'PNG',
    gif: 'GIF',
    mp3: 'MP3',
    wav: 'WAV',
    mp4: 'MP4',
    mov: 'MOV',
    avi: 'AVI',
    txt: 'Text'
  };
  return formatMap[extension] ? { value: extension, text: formatMap[extension] } : { value: extension, text: extension.toUpperCase() };
});

// 方法：文件选择处理
const handleFileSelect = (file: any, fileList: any[]) => {
  selectedFile.value = file.raw; // 获取原始文件对象
  if (selectedFile.value) {
    simulateUploadProgress();
    fromFormat.value = detectedFormat.value?.value || '';
  }
};

// 方法：移除文件
const handleRemove = () => {
  resetFileInput();
};

// 方法：模拟上传进度
const simulateUploadProgress = () => {
  uploadProgress.value = 0;
  const interval = setInterval(() => {
    uploadProgress.value += Math.random() * 10;
    if (uploadProgress.value >= 100) {
      uploadProgress.value = 100;
      clearInterval(interval);
    }
  }, 200);
};

// 方法：格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 方法：重置文件输入
const resetFileInput = () => {
  selectedFile.value = null;
  uploadProgress.value = 0;
  fromFormat.value = '';
  toFormat.value = '';
};

// 方法：交换格式
const swapFormats = () => {
  if (!selectedFile.value) return;
  [fromFormat.value, toFormat.value] = [toFormat.value, fromFormat.value];
};

// 方法：开始转换
const startConversion = () => {
  if (!selectedFile.value || !toFormat.value) return;

  isConverting.value = true;
  setTimeout(() => {
    isConverting.value = false;

    const newHistoryItem = {
      id: Date.now(),
      name: selectedFile.value!.name,
      from: fromFormat.value || selectedFile.value!.name.split('.').pop(),
      to: toFormat.value,
      date: new Date().toISOString().split('T')[0],
      size: formatFileSize(selectedFile.value!.size)
    };

    conversionHistory.value.unshift(newHistoryItem);
    downloadLink.value = `data:application/octet-stream,${encodeURIComponent(selectedFile.value!.name)}`;
    downloadFileName.value = `${selectedFile.value!.name.split('.')[0]}.${toFormat.value}`;
    showResultModal.value = true;
  }, 2000);
};

// 方法：新转换
const newConversion = () => {
  showResultModal.value = false;
  resetFileInput();
};
</script>

<style scoped>
.container {
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
}

.conversion-box {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.inner-box {
  padding: 20px;
}

.flex-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (min-width: 768px) {
  .flex-container {
    flex-direction: row;
  }
}

.flex-item {
  flex: 1;
}

.upload-demo .el-upload-dragger {
  width: 100%;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
}

.upload-demo .el-upload-dragger:hover,
.upload-demo .el-upload-dragger.is-dragover {
  border-color: #4a90e2;
  background-color: #f0f7ff;
}

.upload-icon {
  width: 60px;
  height: 60px;
  background: #e6f0fa;
  border-radius: 50%;
  margin: 0 auto 10px;
  position: relative;
}

.upload-icon::before {
  content: "↑";
  font-size: 24px;
  color: #4a90e2;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.upload-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.el-upload__text p {
  color: #666;
  margin-bottom: 10px;
}

.support-text {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

.file-info {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
}

.file-details {
  display: flex;
  align-items: center;
}

.file-icon {
  width: 20px;
  height: 20px;
  background: #4a90e2;
  margin-right: 10px;
  border-radius: 4px;
}

.file-content {
  flex: 1;
}

.file-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.file-name {
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #666;
}

.progress-container {
  width: 100%;
  background: #ddd;
  border-radius: 4px;
  height: 6px;
}

.progress-bar {
  height: 6px;
  background: #4a90e2;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.remove-button {
  margin-left: 10px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.remove-button:hover {
  color: #e74c3c;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.select-box {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.select-box:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.swap-container {
  text-align: center;
}

.swap-button {
  background: #f0f0f0;
  border: none;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.swap-button:hover {
  background: #e0e0e0;
}

.convert-button-container {
  padding-top: 10px;
}

.convert-button {
  width: 100%;
  background: #4a90e2;
  color: #fff;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.convert-button:disabled {
  background: #999;
  cursor: not-allowed;
}

.convert-button:hover:not(:disabled) {
  background: #357abd;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-box {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.history-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.history-content {
  border-top: 1px solid #eee;
}

.empty-history {
  padding: 20px;
  text-align: center;
  color: #666;
}

.empty-icon {
  width: 40px;
  height: 40px;
  background: #ddd;
  border-radius: 50%;
  margin: 0 auto 10px;
}

.history-item {
  padding: 15px 20px;
  transition: all 0.3s;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background: #fafafa;
}

.history-item-content {
  display: flex;
  align-items: center;
}

.history-icon {
  width: 40px;
  height: 40px;
  background: #e6f0fa;
  border-radius: 50%;
  margin-right: 10px;
}

.history-details {
  flex: 1;
}

.history-name-container {
  display: flex;
  justify-content: space-between;
}

.history-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-size {
  font-size: 12px;
  color: #666;
}

.history-format-container {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.history-format {
  font-size: 12px;
  color: #666;
}

.format-tag {
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
}

.arrow {
  margin: 0 4px;
}

.history-date {
  font-size: 12px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: #fff;
  border-radius: 10px;
  max-width: 400px;
  width: 100%;
  margin: 20px;
}

.modal-inner {
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.close-button:hover {
  color: #666;
}

.modal-body {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #e6ffe6;
  border-radius: 50%;
  margin: 0 auto 10px;
  position: relative;
}

.success-icon::before {
  content: "✓";
  font-size: 30px;
  color: #2ecc71;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.modal-text {
  color: #666;
  margin-bottom: 20px;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 640px) {
  .modal-buttons {
    flex-direction: row;
  }
}

.download-button {
  flex: 1;
  background: #4a90e2;
  color: #fff;
  padding: 10px;
  border-radius: 4px;
  text-decoration: none;
  text-align: center;
  transition: background 0.3s;
}

.download-button:hover {
  background: #357abd;
}

.new-convert-button {
  flex: 1;
  background: #f0f0f0;
  color: #333;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.new-convert-button:hover {
  background: #e0e0e0;
}
</style>