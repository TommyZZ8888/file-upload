<template>
  <div id="app">
    <div class="app-container">
      <router-view />
    </div>
  </div>

  <div>sss</div>
</template>

<script setup>
// 使用 <script setup> 是 Vue 3 的新特性，用于简化组合式 API 的写法
import { defineComponent } from "vue";

// 定义组件名称
defineComponent({
  name: "App",
});
</script>

<style scoped>
#app {
  box-sizing: border-box;
  background: linear-gradient(135deg, #f5f9ff 0%, #e6f0ff 100%);
  height: 100vh;
  padding: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: auto;
  padding-top: 80px;
}

.app-container {
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
}
</style>

<style>
/* 全局样式 */
body,
html {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>