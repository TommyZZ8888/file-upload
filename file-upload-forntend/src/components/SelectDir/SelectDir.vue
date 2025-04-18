<template>
  <div class="select-dir-container">
    <div class="input-wrapper">
      <el-input
          v-model="displayValue"
          :placeholder="placeholder"
          class="dir-input"
          @input="handleInputChange"
      >
        <template #append>
          <el-button @click="toggleDropdown">
            <i :class="isDropdownVisible ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
          </el-button>
        </template>
      </el-input>
    </div>

    <div class="dropdown-container" v-show="isDropdownVisible">
      <div class="tree-container">
        <el-tree
            :data="treeData"
            :props="defaultProps"
            node-key="path"
            :load="loadNode"
            lazy
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
            ref="treeRef"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <template v-if="multiple">
                <el-checkbox
                    v-model="selectedPaths"
                    :label="data.path"
                    @change="handleCheckboxChange(data)"
                    :disabled="!allowSelectFolder && data.folder"
                />
              </template>
              <template v-else>
                <el-radio
                    v-model="selectedPath"
                    @change="handleRadioChange(data)"
                    :disabled="!allowSelectFolder && data.folder"
                />
              </template>
              <i :class="data.folder ? 'el-icon-folder' : 'el-icon-document'" />
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { getLocalDrives, getFileTree } from '@/utils/api';

// 定义 Props
const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => ''
  },
  showFiles: {
    type: Boolean,
    default: true
  },
  allowSelectFolder: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: false
  }
});

// 定义 Emits
const emit = defineEmits(['update:modelValue', 'change']);

// 数据定义
const treeData = ref([]);
const isDropdownVisible = ref(false);
const selectedPath = ref(props.multiple ? '' : props.modelValue);
const selectedPaths = ref(props.multiple ? (Array.isArray(props.modelValue) ? props.modelValue : []) : []);
const treeRef = ref(null);

// 计算属性
const displayValue = computed(() => {
  if (props.multiple) {
    return selectedPaths.value.join(',');
  }
  return selectedPath.value;
});

const placeholder = computed(() => {
  return props.multiple ? '请选择多个文件或目录' : '请输入或选择目录路径';
});

// 监听 Props 的变化
watch(
    () => props.modelValue,
    (newVal) => {
      if (props.multiple) {
        selectedPaths.value = Array.isArray(newVal) ? newVal : [];
      } else {
        selectedPath.value = newVal;
      }
    },
    { immediate: true }
);

// 监听 selectedPath 和 selectedPaths 的变化
watch(selectedPath, (newVal) => {
  if (!props.multiple) {
    emit('update:modelValue', newVal);
    emit('change', newVal);
  }
});

watch(
    selectedPaths,
    (newVal) => {
      if (props.multiple) {
        emit('update:modelValue', newVal);
        emit('change', newVal);
      }
    },
    { deep: true }
);

// 初始化磁盘列表
async function initDrives() {
  try {
    const res = await getLocalDrives();
    if (res.code === 200) {
      treeData.value = res.data.map((drive) => ({
        name: drive,
        path: drive,
        folder: true,
        children: null
      }));
    } else {
      ElMessage.error(res.msg || '获取磁盘列表失败');
    }
  } catch (error) {
    console.error('获取磁盘列表失败:', error);
    ElMessage.error('获取磁盘列表失败');
  }
}

// 加载节点数据
async function loadNode(node, resolve) {
  if (node.level === 0) {
    // 根节点，直接返回磁盘列表
    return resolve(treeData.value);
  }

  try {
    const res = await getFileTree(node.data.path, props.showFiles, true, 1);
    if (res.code === 200) {
      const children = res.data.children
          ? res.data.children.map((item) => ({
            name: item.name,
            path: item.path,
            folder: item.folder,
            children: item.folder ? [] : null
          }))
          : [];
      resolve(children);
    } else {
      ElMessage.error(res.msg || '获取目录内容失败');
      resolve([]);
    }
  } catch (error) {
    console.error('获取目录内容失败:', error);
    ElMessage.error('获取目录内容失败');
    resolve([]);
  }
}

// 处理节点点击事件
function handleNodeClick(data) {
  if (data.folder) {
    treeRef.value.store.nodesMap[data.path].expanded = !treeRef.value.store.nodesMap[data.path].expanded;
  }
}

// 处理单选框变化
function handleRadioChange(data) {
  if (!props.allowSelectFolder && data.folder) return;
  selectedPath.value = data.path;
  isDropdownVisible.value = false;
  emit('change', data.path);
}

// 处理复选框变化
function handleCheckboxChange(data) {
  if (!props.allowSelectFolder && data.folder) return;
  emit('change', selectedPaths.value);
}

// 处理输入框变化
function handleInputChange(value) {
  emit('change', value);
}

// 切换下拉框显示状态
function toggleDropdown() {
  isDropdownVisible.value = !isDropdownVisible.value;
}

// 点击外部关闭下拉框
function handleClickOutside(event) {
  const container = document.querySelector('.select-dir-container');
  if (!container.contains(event.target)) {
    isDropdownVisible.value = false;
  }
}

// 生命周期钩子
onMounted(() => {
  initDrives();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.select-dir-container {
  position: relative;
  width: 100%;
}

.input-wrapper {
  width: 100%;
}

.dir-input {
  width: 100%;
}

.dropdown-container {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 5px;
}

.tree-container {
  padding: 10px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
}

.custom-tree-node .el-radio {
  margin-right: 8px;
}

.custom-tree-node i {
  margin-right: 8px;
  font-size: 16px;
}

.custom-tree-node i.el-icon-folder {
  color: #f0c78a;
}

.custom-tree-node i.el-icon-document {
  color: #909399;
}

.checkbox-label {
  margin-left: 8px;
}

:deep(.el-radio__label) {
  width: 0;
  padding: 0;
}

:deep(.el-checkbox__label) {
  display: none;
  padding-left: 0;
}
</style>