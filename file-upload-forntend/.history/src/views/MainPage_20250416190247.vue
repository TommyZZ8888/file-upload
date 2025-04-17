<template>
  <div class="main-page">
    <div class="header">
      <h1>文件上传中心</h1>
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
      <div class="wip-content">
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
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import UploadFile from "@/components/UploadFile/UploadFile.vue";
import ShareFile from "@/components/ShareFile/ShareFile.vue";
import FileToolbox from "@/components//FileToolbox.vue";
import FileGallery from "@/components/FileGallery/FileGallery.vue";
import SettingsModal from "@/components/SettingsModal/SettingsModal.vue";
import StorageConfigModal from "@/components/StorageConfigModal/StorageConfigModal.vue";
import AboutModal from "@/components/AboutModal/AboutModal.vue";
import PasswordConfig from "@/components/PasswordConfig/PasswordConfig.vue";

const showMenu = ref(false);
const isAdmin = ref(true);
const activeTab = ref("local");
const fileList = ref([]);
const allowedFormats = ref("*");
const maxUploadSize = ref(1024 * 1024 * 1024); // 1GB
const showSettings = ref(false);
const showStorageConfig = ref(false);
const showAbout = ref(false);
const showPasswordConfig = ref(false);
const storageOptions = ref([]);

const filteredTabs = computed(() => {
  return [
    { label: "本地存储", value: "local" },
    { label: "阿里云OSS", value: "aliyun" },
    { label: "腾讯云COS", value: "tencent" },
    { label: "华为云OBS", value: "obs" },
    { label: "七牛云", value: "qiniu" },
    { label: "文件共享", value: "shared" },
    { label: "工具箱", value: "toolbox" },
    { label: "文件库", value: "gallery" },
  ];
});

const isWipTab = computed(() => {
  return ["obs", "qiniu"].includes(activeTab.value);
});

const switchTab = (tab: string) => {
  activeTab.value = tab;
};

const openSettings = () => {
  showSettings.value = true;
};

const closeSettings = () => {
  showSettings.value = false;
};

const saveSettings = (settings: {
  allowedFormats: string;
  maxUploadSize: number;
}) => {
  allowedFormats.value = settings.allowedFormats;
  maxUploadSize.value = settings.maxUploadSize;
  closeSettings();
};

const openStorageConfig = () => {
  showStorageConfig.value = true;
};

const closeStorageConfig = () => {
  showStorageConfig.value = false;
};

const openAbout = () => {
  showAbout.value = true;
};

const closeAbout = () => {
  showAbout.value = false;
};

const openPasswordConfig = () => {
  showPasswordConfig.value = true;
};

const closePasswordConfig = () => {
  showPasswordConfig.value = false;
};

const handleMainUser = () => {
  isAdmin.value = true;
};
</script>

<style scoped>
.main-page {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.menu-container {
  position: relative;
}
.menu-icon {
  cursor: pointer;
  font-size: 24px;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.menu-item {
  padding: 8px 16px;
  cursor: pointer;
}
.menu-item:hover {
  background: #f5f7fa;
}
.tab-bar {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}
.tab {
  padding: 10px 20px;
  cursor: pointer;
  position: relative;
}
.tab.active {
  color: #409eff;
}
.tab-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #409eff;
  transform: scaleX(0);
  transition: transform 0.3s;
}
.tab.active .tab-underline {
  transform: scaleX(1);
}
.upload-content {
  margin-top: 20px;
}
.wip-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
.wip-content {
  text-align: center;
  color: #909399;
}
</style>
