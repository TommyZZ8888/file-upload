<template>
  <div>
    <div v-if="show" class="settings-modal" @click="closeOnOutside">
      <div class="settings-content" @click.stop>
        <h2>密码设置</h2>
        <form @submit.prevent="save">
          <div class="form-group">
            <label>是否开启密码校验:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input
                  type="radio"
                  name="enable"
                  :value="true"
                  v-model="tempEnablePassword"
                />
                是
              </label>
              <label class="radio-label">
                <input
                  type="radio"
                  name="enable"
                  :value="false"
                  v-model="tempEnablePassword"
                />
                否
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>密码:</label>
            <input
              v-model="tempPassword"
              type="text"
              placeholder="请输入密码"
              :disabled="!tempEnablePassword"
            />
          </div>
          <div class="form-actions">
            <button type="submit">保存</button>
            <button type="button" @click="close">取消</button>
          </div>
        </form>
      </div>
    </div>
    <div class="password-config-modal">
      <el-dialog
        title="请输入密码"
        v-model="showPasswordDialog"
        width="30%"
        :close-on-click-modal="false"
        :show-close="false"
        custom-class="password-dialog"
      >
        <el-input
          v-model="inputPassword"
          type="text"
          placeholder="请输入密码"
        />
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="verifyPassword">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SparkMD5 from "spark-md5";
import sseManager from "@/utils/sse";
import { getPassword, setPassword } from "@/utils/api";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:show", value: boolean): void;
}>();

const tempEnablePassword = ref(false);
const tempPassword = ref("");
const showPasswordDialog = ref(false);
const inputPassword = ref("");

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      fetchPassword();
    }
  }
);

const fetchPassword = async () => {
  try {
    const response = await getPassword();
    if (response.code === 200) {
      tempEnablePassword.value = response.data.enable;
      tempPassword.value = response.data.password || "";
    }
  } catch (error) {
    console.error("获取密码配置失败:", error);
  }
};

const save = async () => {
  try {
    const response = await setPassword({
      enable: tempEnablePassword.value,
      password: tempPassword.value,
    });
    if (response.code === 200) {
      close();
    }
  } catch (error) {
    console.error("保存密码配置失败:", error);
  }
};

const close = () => {
  emit("update:show", false);
  emit("close");
};

const closeOnOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains("settings-modal")) close();
};

const verifyPassword = () => {
  const hashedPassword = SparkMD5.hash(inputPassword.value);
  if (hashedPassword === localStorage.getItem("password")) {
    showPasswordDialog.value = false;
    inputPassword.value = "";
  } else {
    // TODO: 显示错误提示
  }
};

// 监听 SSE 事件
sseManager.subscribe("setPassword", () => {
  showPasswordDialog.value = true;
});
</script>

<style scoped>
.settings-modal {
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

.settings-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

input[type="text"]:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

button[type="submit"] {
  background-color: #409eff;
  color: white;
}

button[type="submit"]:hover {
  background-color: #66b1ff;
}

button[type="button"] {
  background-color: #f4f4f5;
  color: #606266;
}

button[type="button"]:hover {
  background-color: #e9e9eb;
}

:deep(.password-dialog) {
  border-radius: 8px;
}

:deep(.password-dialog .el-dialog__header) {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.password-dialog .el-dialog__body) {
  padding: 20px;
}

:deep(.password-dialog .el-dialog__footer) {
  padding: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
