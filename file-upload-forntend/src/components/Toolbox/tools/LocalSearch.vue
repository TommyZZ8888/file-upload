<template>
  <div class="local-search">
    <el-form :model="searchForm" inline>
      <el-form-item label="选择磁盘：">
        <el-checkbox-group v-model="searchForm.drives">
          <el-checkbox v-for="drive in availableDrives" :key="drive" :label="drive" />
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="关键字：" style="margin-left: 30px;">
        <el-input v-model="searchForm.keyword" placeholder="输入关键字" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchFiles" :loading="searching">查找</el-button>
      </el-form-item>
    </el-form>

    <!-- 搜索结果区域 -->
    <div class="results-area">
      <!-- 圆形进度条 -->
      <div v-if="searching" class="progress-container">
        <el-progress type="circle" :percentage="progress" :width="120" :stroke-width="8" color="#409EFF" />
      </div>

      <!-- 文件列表 -->
      <el-table v-else-if="searchResults.length > 0" :data="searchResults" style="width: 100%" max-height="400" stripe>
        <el-table-column prop="name" label="文件名" width="200" />
        <el-table-column prop="path" label="路径" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button type="text" @click="openLocalDir(scope.row.path)">位置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 无结果提示 -->
      <div v-else-if="searched" class="no-results">
        未找到匹配的文件
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getLocalDrives, buildIndex, localFileSearch, openDir } from '@/utils/api';

// 定义响应式数据
const searchForm = ref({
  drives: [] as string[],
  keyword: ''
});
const availableDrives = ref<string[]>(['C:']);
const searchResults = ref<{ name: string; path: string }[]>([]);
const searching = ref(false);
const searched = ref(false);
const progress = ref(0);
let progressTimer: number | null = null;

// 获取可用磁盘
const fetchAvailableDrives = async () => {
  try {
    const res = await getLocalDrives();
    if (res.code === 200) {
      availableDrives.value = res.data;
    } else {
      ElMessage.error('获取磁盘列表失败');
    }
  } catch (error) {
    ElMessage.error('获取磁盘列表失败');
  }
};

// 开始搜索文件
const searchFiles = () => {
  if (!searchForm.value.drives.length) {
    ElMessage.warning('请至少选择一个磁盘');
    return;
  }
  if (!searchForm.value.keyword.trim()) {
    ElMessage.warning('请输入关键字');
    return;
  }

  searching.value = true;
  searched.value = false;
  searchResults.value = [];
  progress.value = 0;

  // 启动进度条动画
  startProgress();

  buildIndex(searchForm.value.drives)
      .then((res) => {
        if (res.code === 200) {
          return localFileSearch(searchForm.value.keyword);
        }
      })
      .then((res) => {
        if (res?.code === 200) {
          searchResults.value = res.data
              .filter((path: string) => searchForm.value.drives.some((drive) => path.startsWith(drive)))
              .map((path: string) => ({
                name: path.split('\\').pop() || '', // 提取文件名
                path: path
              }));
          searched.value = true;
        } else {
          ElMessage.error('搜索失败');
        }
      })
      .catch(() => {
        ElMessage.error('搜索失败');
      })
      .finally(() => {
        clearInterval(progressTimer as number);
        progress.value = 100;
        searching.value = false;
      });
};

// 启动进度条动画
const startProgress = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
  }

  let timeElapsed = 0;
  const totalTime = 60000; // 60秒

  progressTimer = setInterval(() => {
    timeElapsed += 500; // 每0.5秒更新一次

    // 非匀速增长：前快后慢
    const progressRatio = timeElapsed / totalTime;
    progress.value = Math.min(99, Math.floor(100 * (1 - Math.pow(1 - progressRatio, 2))));

    if (timeElapsed >= totalTime) {
      clearInterval(progressTimer as number);
    }
  }, 500);
};

// 打开本地目录
const openLocalDir = (path: string) => {
  openDir(path);
};

// 清理定时器
onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer);
  }
});

// 组件挂载时获取磁盘列表
onMounted(() => {
  fetchAvailableDrives();
});
</script>

<style scoped>
.local-search {
  padding: 10px;
}

.el-form-item {
  margin-bottom: 15px;
}

.results-area {
  margin-top: 20px;
}

.progress-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.el-table {
  margin-top: 15px;
  border-radius: 5px;
  overflow: hidden;
}

.no-results {
  text-align: center;
  color: #909399;
  padding: 20px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
