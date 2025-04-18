<template>
  <div class="upload-container">
    <div class="upload-window">
      <div class="header-wrapper">
        <h1 class="page-title">
          <span class="cloud-icon">☁️</span>
          文件上传中心
        </h1>
        <div
          class="menu-container"
          @mouseenter="showMenu = true"
          @mouseleave="showMenu = false"
        >
          <div class="menu-icon">☰</div>
          <div v-show="showMenu" class="dropdown-menu">
            <div class="menu-item" v-if="isAdmin" @click="openSettings">
              上传设置
            </div>
            <div class="menu-item" v-if="isAdmin" @click="openStorageConfig">
              存储配置
            </div>
            <div class="menu-item" v-if="isAdmin" @click="openPasswordConfig">
              密码设置
            </div>
            <div class="menu-item" @click="openAbout">关于</div>
          </div>
        </div>
      </div>
      <div class="tab-bar">
        <div
          v-for="tab in filteredTabs"
          :key="tab.value"
          :class="['tab', { active: activeTab === tab.value }]"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
          <div class="tab-underline"></div>
        </div>
      </div>
      <div
        v-if="
          activeTab !== 'gallery' &&
          activeTab !== 'toolbox' &&
          activeTab !== 'shared' &&
          !isWipTab
        "
        class="upload-content"
      >
        <upload-file
          :file-list.sync="fileList"
          :accept="allowedFormats"
          :max-size="maxUploadSize"
          width="100%"
          height="400px"
          :storage-type="activeTab"
        />
      </div>
      <div v-else-if="isWipTab" class="wip-container">
        <div class="wip-message">
          <span class="wip-icon">🚧</span>
          <h2>功能建设中</h2>
          <p v-if="activeTab === 'obs'">正在加班加点搬砖中，敬请期待！</p>
          <p v-else-if="activeTab === 'qiniu'">
            七牛云功能正在被疯狂调教，马上就能和大家见面啦！
          </p>
        </div>
      </div>
      <share-file v-else-if="activeTab === 'shared'" />
      <file-toolbox v-else-if="activeTab === 'toolbox'" />
      <file-gallery v-else />
      <settings-modal
        :show="showSettings"
        :allowed-formats="allowedFormats"
        :max-upload-size="maxUploadSize"
        @save="saveSettings"
        @close="closeSettings"
      />
      <storage-config-modal
        :show="showStorageConfig"
        :storage-options="storageOptions"
        @close="closeStorageConfig"
      />
      <about-modal :show="showAbout" @close="closeAbout" />
      <password-config
        :show="showPasswordConfig"
        @close="closePasswordConfig"
        @main-user="handleMainUser"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import UploadFile from "@/components/UploadFile/UploadFile.vue";
import FileGallery from "@/components/FileGallery/FileGallery.vue";
import SettingsModal from "@/components/SettingsModal/SettingsModal.vue";
import StorageConfigModal from "@/components/StorageConfigModal/StorageConfigModal.vue";
import AboutModal from "@/components/AboutModal/AboutModal.vue";
import ShareFile from "@/components/ShareFile/ShareFile.vue";
import PasswordConfig from "@/components/PasswordConfig/PasswordConfig.vue";
import FileToolbox from "@/components/Toolbox/FileToolbox.vue";


console.log("isAdmin");
interface Tab {
  label: string;
  value: string;
}

interface StorageOption {
  label: string;
  value: string;
}

const fileList = ref<any[]>([]);
const activeTab = ref("local");
const showMenu = ref(false);
const showSettings = ref(false);
const showStorageConfig = ref(false);
const showAbout = ref(false);
const showPasswordConfig = ref(false);
const allowedFormats = ref(".jpg,.png,.mp4");
const maxUploadSize = ref(100 * 1024 * 1024);
const storageOptions = ref<StorageOption[]>([
  { label: "Local", value: "local" },
  { label: "MinIO", value: "minio" },
  { label: "OSS", value: "oss" },
]);
const isAdmin = ref(false);

const filteredTabs = computed<Tab[]>(() => {
  return [
    { label: "Local", value: "local" },
    { label: "MinIO", value: "minio" },
    { label: "OSS", value: "oss" },
    { label: "OBS", value: "obs" },
    { label: "QiNiu", value: "qiniu" },
    { label: "共享文件", value: "shared" },
    ...(isAdmin.value ? [{ label: "已上传文件", value: "gallery" }] : []),
    { label: "工具箱", value: "toolbox" },
  ];
});

const isWipTab = computed(() => {
  return activeTab.value === "obs" || activeTab.value === "qiniu";
});

const switchTab = (tabValue: string) => {
  activeTab.value = tabValue;
  if (isWipTab.value) {
    ElMessage({
      message: tabValue === "obs" ? "OBS功能施工中..." : "七牛云功能开发中...",
      type: "info",
      duration: 2000,
    });
  }
};

const openSettings = () => {
  showSettings.value = true;
  showMenu.value = false;
};

const saveSettings = (settings: {
  allowedFormats: string;
  maxUploadSize: number;
}) => {
  allowedFormats.value = settings.allowedFormats;
  maxUploadSize.value = settings.maxUploadSize;
  showSettings.value = false;
};

const closeSettings = () => {
  showSettings.value = false;
};

const openStorageConfig = () => {
  showStorageConfig.value = true;
  showMenu.value = false;
};

const closeStorageConfig = () => {
  showStorageConfig.value = false;
};

const openAbout = () => {
  showAbout.value = true;
  showMenu.value = false;
};

const closeAbout = () => {
  showAbout.value = false;
};

const openPasswordConfig = () => {
  showPasswordConfig.value = true;
  showMenu.value = false;
};

const closePasswordConfig = () => {
  showPasswordConfig.value = false;
};

const handleMainUser = (isMainUser: boolean) => {
  isAdmin.value = isMainUser;
};
</script>

<style scoped>
.upload-container {
  width: 100%;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(25, 118, 210, 0.1);
  overflow: hidden;
  border: 1px solid #e3f2fd;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: #1976d2;
}

.page-title {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cloud-icon {
  font-size: 1.8rem;
}

.menu-container {
  position: relative;
}

.menu-icon {
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  padding: 0 10px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  z-index: 10;
}

.menu-item {
  padding: 8px 16px;
  color: #333;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background: #f0f7ff;
}

.tab-bar {
  display: flex;
  padding: 0 2rem;
  background: #f8fafd;
  border-bottom: 1px solid #e0eefc;
  gap: 8px;
}

.tab {
  padding: 14px 32px;
  font-size: 14px;
  color: #607d9f;
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  color: #1976d2;
  font-weight: 500;
}

.tab.active .tab-underline {
  width: 100%;
  background: #1976d2;
}

.tab-underline {
  height: 2px;
  width: 0;
  transition: width 0.3s;
}

.upload-content {
  padding: 2rem;
  background: #fcfdff;
  min-height: 400px;
  border-top: 1px solid #f0f7ff;
}

.wip-container {
  padding: 2rem;
  height: 400px;
  background: #fcfdff;
  border-top: 1px solid #f0f7ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wip-message {
  text-align: center;
  color: #666;
}

.wip-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.wip-message h2 {
  font-size: 1.5rem;
  color: #1976d2;
  margin: 0.5rem 0;
}

.wip-message p {
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto;
}
</style>
