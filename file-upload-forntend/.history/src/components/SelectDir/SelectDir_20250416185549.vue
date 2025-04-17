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
            <i :class="isDropdownVisible ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
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
          ref="tree"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <template v-if="multiple">
                <el-checkbox
                  v-model="selectedPaths"
                  :label="data.path"
                  @change="handleCheckboxChange(data)"
                  :disabled="!allowSelectFolder && data.folder"
                >
                </el-checkbox>
              </template>
              <template v-else>
                <el-radio
                  v-model="selectedPath"
                  @change="handleRadioChange(data)"
                  :disabled="!allowSelectFolder && data.folder"
                ></el-radio>
              </template>
              <i :class="data.folder ? 'el-icon-folder' : 'el-icon-document'"></i>
              <span>{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElTree } from 'element-plus'
import { getLocalDrives, getFileTree } from '@/utils/api'

interface TreeNode {
  path: string
  label: string
  folder: boolean
  children?: TreeNode[]
}

interface Props {
  modelValue?: string | string[]
  placeholder?: string
  multiple?: boolean
  allowSelectFolder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择目录',
  multiple: false,
  allowSelectFolder: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void
  (e: 'change', value: string | string[]): void
}>()

const tree = ref<InstanceType<typeof ElTree>>()
const displayValue = ref('')
const isDropdownVisible = ref(false)
const treeData = ref<TreeNode[]>([])
const selectedPath = ref('')
const selectedPaths = ref<string[]>([])

const defaultProps = {
  children: 'children',
  label: 'label',
  isLeaf: 'leaf'
}

watch(() => props.modelValue, (newVal) => {
  if (props.multiple) {
    selectedPaths.value = Array.isArray(newVal) ? newVal : []
    displayValue.value = selectedPaths.value.join(', ')
  } else {
    selectedPath.value = newVal as string
    displayValue.value = selectedPath.value
  }
}, { immediate: true })

const toggleDropdown = () => {
  isDropdownVisible.value = !isDropdownVisible.value
}

const handleInputChange = (value: string) => {
  if (!props.multiple) {
    emit('update:modelValue', value)
    emit('change', value)
  }
}

const loadNode = async (node: any, resolve: (data: TreeNode[]) => void) => {
  if (node.level === 0) {
    // 加载根节点
    try {
      const res = await getLocalDrives()
      if (res.code === 200) {
        treeData.value = res.data.map(drive => ({
          name: drive,
          path: drive,
          folder: true,
          children: null
        }))
        resolve(treeData.value)
      } else {
        console.error('获取磁盘列表失败:', res.msg || '获取磁盘列表失败')
        resolve([])
      }
    } catch (error) {
      console.error('获取磁盘列表失败:', error)
      resolve([])
    }
  } else {
    // TODO: 实现加载子节点的逻辑
    resolve([])
  }
}

const handleNodeClick = (data: TreeNode) => {
  if (data.folder) {
    tree.value.store.nodesMap[data.path].expanded =
      !tree.value.store.nodesMap[data.path].expanded
  }
}

const handleRadioChange = (data: TreeNode) => {
  if (!props.allowSelectFolder && data.folder) {
    return
  }
  selectedPath.value = data.path
  displayValue.value = data.path
  emit('update:modelValue', data.path)
  emit('change', data.path)
  isDropdownVisible.value = false
}

const handleCheckboxChange = (data: TreeNode) => {
  if (!props.allowSelectFolder && data.folder) {
    return
  }
  displayValue.value = selectedPaths.value.join(', ')
  emit('update:modelValue', selectedPaths.value)
  emit('change', selectedPaths.value)
}
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