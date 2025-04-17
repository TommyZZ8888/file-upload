import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path"; // 导入 node 的 path 模块
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    vue(),
  ],
  server: {
    host: "0.0.0.0", // 这个用于启动，允许外部访问
    port: 8092, // 指定启动端口，注意这里应该是数字而非字符串
    open: false, // 启动后是否自动打开浏览器
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // 使用绝对路径
    },
  },
});
