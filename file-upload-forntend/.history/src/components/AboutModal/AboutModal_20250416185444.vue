<template>
  <div v-if="show" class="about-modal" @click="closeOnOutside">
    <div class="about-content" @click.stop>
      <h2>关于</h2>
      <p>这个人很懒，什么都没有留下，只说自己爱吃炸排骨。。。</p>
      <span class="version">版本号：{{ version }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import packageInfo from "../../../package.json"

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const version = ref(packageInfo.version)

const close = () => {
  emit('close')
}

const closeOnOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('about-modal')) close()
}
</script>

<style scoped>
.about-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.about-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

h2 {
  margin-top: 0;
  color: #303133;
}

.version {
  display: block;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}
</style>