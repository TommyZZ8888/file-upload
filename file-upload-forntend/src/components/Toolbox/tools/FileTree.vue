<template>
  <div class="file-tree-container">
    <!-- 目录路径输入框和获取按钮 -->
    <div class="input-section">
      <SelectDir
          v-model="directoryPath"
          :showFiles="false"
          style="width: 300px; margin-right: 10px;"
      />
      <el-input
          v-model.number="maxDepth"
          type="number"
          placeholder="输入目录深度"
          style="width: 120px; margin-right: 10px;"
          :min="0"
      ></el-input>
      <el-button type="primary" @click="fetchFileTree">获取文件树</el-button>
    </div>

    <!-- 过滤选项 -->
    <div class="filter-section" style="margin-top: 20px;">
      <el-input
          v-model="filterText"
          placeholder="输入关键字过滤"
          style="width: 200px; margin-right: 20px;"
      ></el-input>
      <el-checkbox v-model="showFiles">显示文件</el-checkbox>
      <el-checkbox v-model="showFolders">显示文件夹</el-checkbox>
    </div>

    <!-- 文件树和文本展示区域 -->
    <div class="content-section" style="margin-top: 20px;">
      <!-- 文件树 -->
      <div class="tree-section">
        <el-tree
            :data="fileTreeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            ref="treeRef"
            node-key="path"
            default-expand-all
            class="tree-container"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <i :class="data.folder ? 'el-icon-folder' : 'el-icon-document'"></i>
              <span style="margin-left: 8px;">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 文本树展示 -->
      <div class="text-section">
        <el-input
            type="textarea"
            v-model="textTree"
            placeholder="文件树文本格式将显示在这里"
            class="text-tree-input"
            readonly
        ></el-input>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { getFileTree } from '@/utils/api';
import SelectDir from '@/components/SelectDir/SelectDir.vue';

// 定义响应式数据
const directoryPath = ref('');
const filterText = ref('');
const showFiles = ref(true);
const showFolders = ref(true);
const maxDepth = ref(3); // 默认深度为 3
const fileTreeData = ref<any[]>([]);
const textTree = ref('');
const treeRef = ref<any>(null);

const defaultProps = {
  children: 'children',
  label: 'name',
};

// 监听器
watch(directoryPath, (newVal) => {
  if (newVal) fetchFileTree();
});

watch(filterText, (val) => {
  treeRef.value?.filter(val);
  nextTick(() => updateTextTree());
});

watch([showFiles, showFolders, maxDepth], () => {
  if (directoryPath.value) fetchFileTree();
});

// 获取文件树
const fetchFileTree = async () => {
  if (!directoryPath.value) {
    ElMessage.warning('请选择目录路径');
    return;
  }
  try {
    const res = await getFileTree(directoryPath.value, showFiles.value, showFolders.value, maxDepth.value);
    if (res.code === 200) {
      fileTreeData.value = [res.data];
      nextTick(() => updateTextTree());
      ElMessage.success('文件树获取成功');
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或路径');
    console.error(error);
  }
};

// 过滤节点方法
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.toLowerCase().includes(value.toLowerCase());
};

// 更新文本树
const updateTextTree = () => {
  const visibleNodes = getVisibleNodes();
  generateTextTreeFromVisibleNodes(visibleNodes);
};

// 获取可见节点
const getVisibleNodes = () => {
  const allNodes: any[] = [];

  const collectVisibleNodes = (node: any): any | null => {
    if (!node) return null;
    if (node.visible) {
      const nodeData = { ...node.data };
      if (node.childNodes && node.childNodes.length > 0) {
        nodeData.children = [];
        node.childNodes.forEach((child: any) => {
          if (child.visible) {
            nodeData.children.push(collectVisibleNodes(child));
          }
        });
        if (nodeData.children.length === 0) delete nodeData.children;
      }
      return nodeData;
    }
    return null;
  };

  treeRef.value.root.childNodes.forEach((rootNode: any) => {
    const visibleNode = collectVisibleNodes(rootNode);
    if (visibleNode) allNodes.push(visibleNode);
  });

  return allNodes.length > 0 ? { name: '', children: allNodes } : { name: '' };
};

// 生成文本树
const generateTextTreeFromVisibleNodes = (
    node: any,
    level = 0,
    isLast = false,
    prefix = ''
) => {
  let result = '';
  if (!node) return result;

  if (level === 0 && !node.name) {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any, index: number) => {
        const isChildLast = index === node.children.length - 1;
        result += generateTextTreeFromVisibleNodes(child, 0, isChildLast, '');
      });
    }
  } else {
    const indent = ' '.repeat(level * 2);
    const connector = isLast ? '└── ' : '├── ';
    result += `${prefix}${indent}${connector}${node.name}\n`;

    if (node.children && node.children.length > 0) {
      const newPrefix = prefix + indent + (isLast ? '    ' : '│   ');
      node.children.forEach((child: any, index: number) => {
        const isChildLast = index === node.children.length - 1;
        result += generateTextTreeFromVisibleNodes(child, level + 1, isChildLast, newPrefix);
      });
    }
  }

  textTree.value = result.trim();
  return result;
};
</script>

<style scoped>
.file-tree-container {
  padding: 20px;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.input-section,
.filter-section {
  display: flex;
  align-items: center;
}

.content-section {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.tree-section {
  flex: 1;
  overflow: hidden;
  margin-right: 20px;
}

.tree-container {
  height: 100%;
  overflow-y: auto;
}

.text-section {
  flex: 1;
  overflow: hidden;
}

.text-tree-input {
  height: 100%;
}

.text-tree-input >>> .el-textarea__inner {
  height: 100%;
  resize: none;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px;
  background-color: #fff;
  color: #303133;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.text-tree-input >>> .el-textarea__inner:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.text-tree-input >>> .el-textarea__inner::-webkit-scrollbar {
  width: 8px;
}

.text-tree-input >>> .el-textarea__inner::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 4px;
}

.text-tree-input >>> .el-textarea__inner::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
}

.text-tree-input >>> .el-textarea__inner::-webkit-scrollbar-track {
  background-color: #f1f1f1;
  border-radius: 4px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
}
</style>