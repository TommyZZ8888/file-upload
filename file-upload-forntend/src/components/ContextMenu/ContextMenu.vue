<!-- ContextMenu.vue -->
<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="{ top: top + 'px', left: left + 'px' }"
    @click.stop
  >
    <div class="menu-item" @click="copyLink">复制链接</div>
    <div class="menu-item" @click="shareFile">共享文件</div>
    <div class="menu-item" @click="deleteFile">删除文件</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

interface File {
  id: string;
  fileName: string;
  accessUrl: string;
  [key: string]: any;
}

const props = defineProps<{
  file: File;
  top: number;
  left: number;
}>();

const emit = defineEmits<{
  (e: "copy-link"): void;
  (e: "share-file"): void;
  (e: "delete-file"): void;
}>();

const visible = ref(false);

watch(
  () => props.file,
  (newFile) => {
    if (newFile) {
      show();
    } else {
      hide();
    }
  },
  { immediate: true }
);

const show = () => {
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

const copyLink = () => {
  emit("copy-link");
};

const shareFile = () => {
  emit("share-file");
};

const deleteFile = () => {
  emit("delete-file");
};
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  min-width: 150px;
  z-index: 3000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.3s;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}
</style>
