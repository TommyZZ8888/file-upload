<template>
  <div class="file-encrypt-container">
    <el-form :model="form" label-width="100px">
      <!-- 文件上传 -->
      <el-form-item label="文件">
        <SelectDir
            v-model="form.file"
            @change="handlePathChange"
            :showFiles="true"
            :allowSelectFolder="false"
            style="width: 400px; margin-right: 10px;"
        />
      </el-form-item>

      <!-- 加密密钥 -->
      <el-form-item label="密钥">
        <el-input
            v-model="form.key"
            placeholder="请输入密钥"
            style="width: 400px;"
        ></el-input>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="success" @click="encryptFile" :disabled="!form.file || !form.key">加密文件</el-button>
        <el-button type="warning" @click="decryptFile" :disabled="!form.file || !form.key">解密文件</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { encryptFile as apiEncryptFile, decryptFile as apiDecryptFile } from '@/utils/api';
import SelectDir from '@/components/SelectDir/SelectDir.vue';

// 定义表单数据
const form = reactive({
  file: '',
  key: '',
});

// 表单校验
const validateForm = (): boolean => {
  if (!form.file) {
    ElMessage.warning('请选择文件');
    return false;
  }
  if (!form.key) {
    ElMessage.warning('请输入密钥');
    return false;
  }
  return true;
};

// 加密文件
const encryptFile = async () => {
  if (!validateForm()) return;

  try {
    const res = await apiEncryptFile(form.file, form.key);
    if (res.code === 200) {
      ElMessage.success('文件加密成功，请前往目录查看');
    }
  } catch (error) {
    ElMessage.error('加密请求失败');
    console.error(error);
  }
};

// 解密文件
const decryptFile = async () => {
  if (!validateForm()) return;

  try {
    const res = await apiDecryptFile(form.file, form.key);
    if (res.code === 200) {
      ElMessage.success('文件解密成功，请前往目录查看');
    }
  } catch (error) {
    ElMessage.error('解密请求失败');
    console.error(error);
  }
};

// 文件路径变化处理
const handlePathChange = (newPath: string) => {
  form.file = newPath;
};
</script>

<style scoped>
.file-encrypt-container {
  height: 400px;
  padding: 20px;
}

.download-section {
  margin-top: 20px;
}
</style>