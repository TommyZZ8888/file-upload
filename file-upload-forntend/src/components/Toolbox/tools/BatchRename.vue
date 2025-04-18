<template>
  <div class="file-renamer">
    <SelectDir v-model="filePaths" @change="handlePathChange" :showFiles="true" :allowSelectFolder="false"
               :multiple="true" style="width: 100%;" />
    <el-container>
      <el-main>

        <!-- 重命名选项 -->
        <el-card class="mt-4">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="插入/替换" name="insert">
              <InsertTab :rules="insertRules" @updateRules="updateInsertRules" />
            </el-tab-pane>
            <el-tab-pane label="删除" name="delete">
              <DeleteTab :rules="deleteRules" @updateRules="updateDeleteRules" />
            </el-tab-pane>
            <el-tab-pane label="编号" name="numbering">
              <NumberingTab :rules="numberingRules" @updateRules="updateNumberingRules" />
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 文件列表与预览 -->
        <el-card v-show="files.length > 0" class="mt-4">
          <div slot="header" class="flex justify-between items-center">
            <span>文件重命名预览</span>
            <el-button type="danger" size="small" @click="clearFiles" style="margin-left: 10px;">
              <i class="el-icon-delete mr-1"></i>全部清除
            </el-button>
          </div>
          <el-table :data="previewData" max-height="400">
            <el-table-column prop="original" label="原文件名" width="300"></el-table-column>
            <el-table-column label="→" width="50" align="center"></el-table-column>
            <el-table-column prop="new" label="新文件名" width="300"></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="text" size="small" @click="removeFile(scope.$index)">
                  <i class="el-icon-close text-red-500"></i>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 操作按钮组 -->
        <div class="action-buttons mt-4">
          <el-button size="medium" @click="reset" :disabled="files.length === 0">重置</el-button>
          <el-button size="medium" type="primary" @click="rename" :disabled="files.length === 0">重命名</el-button>
        </div>

      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import SelectDir from '@/components/SelectDir/SelectDir.vue'
import InsertTab from './BatchRename/InsertTab.vue'
import DeleteTab from './BatchRename/DeleteTab.vue'
import NumberingTab from './BatchRename/NumberingTab.vue'
import { batchRenameFile } from '@/utils/api'

interface FileItem {
  name: string
  path: string
}

interface PreviewItem {
  original: string
  new: string
  path: string
}

interface InsertRules {
  position: string
  text: string
  searchText: string
  replaceText: string
  replaceOption: string
  regexPattern: string
  regexReplace: string
  caseOption: string
}

interface DeleteRules {
  deleteText: string
  deleteOption: string
  startPos: number
  endPos: number
  keepExt: boolean
  deleteAllNames: boolean
  removeAllExt: boolean
  specificExt: string
}

interface NumberingRules {
  startNum: number
  step: number
  repeat: number
  digits: number
  numberPosition: string
  position: number
  padZero: boolean
  padChar: string
  format: string
}

const files = ref<FileItem[]>([])
const activeTab = ref<string>('insert')
const isDragging = ref<boolean>(false)
const filePaths = ref<string | string[]>('')

// Insert/Replace tab rules
const insertRules = ref<InsertRules>({
  position: 'start',
  text: '',
  searchText: '',
  replaceText: '',
  replaceOption: 'all',
  regexPattern: '',
  regexReplace: '',
  caseOption: ''
})

// Delete tab rules
const deleteRules = ref<DeleteRules>({
  deleteText: '',
  deleteOption: 'all',
  startPos: 0,
  endPos: 0,
  keepExt: true,
  deleteAllNames: false,
  removeAllExt: false,
  specificExt: ''
})

// Numbering tab rules
const numberingRules = ref<NumberingRules>({
  startNum: 1,
  step: 1,
  repeat: 1,
  digits: 1,
  numberPosition: 'start',
  position: 1,
  padZero: true,
  padChar: '0',
  format: '{n}'
})

const previewData = computed<PreviewItem[]>(() => {
  return files.value.map((file, index) => {
    let newName = file.name
    let ext = newName.includes('.') ? newName.substring(newName.lastIndexOf('.')) : ''
    let nameWithoutExt = newName.includes('.') ? newName.substring(0, newName.lastIndexOf('.')) : newName
    let num: number, paddedNum: string, formattedNum: string, pos: number

    // Apply rules based on active tab
    switch (activeTab.value) {
      case 'insert':
        // Insert/Replace rules
        if (insertRules.value.text) {
          if (insertRules.value.position === 'start') {
            nameWithoutExt = insertRules.value.text + nameWithoutExt
          } else if (insertRules.value.position === 'end') {
            nameWithoutExt = nameWithoutExt + insertRules.value.text
          }
        }

        if (insertRules.value.searchText && insertRules.value.replaceText) {
          if (insertRules.value.replaceOption === 'all') {
            const regex = new RegExp(insertRules.value.searchText, 'g')
            nameWithoutExt = nameWithoutExt.replace(regex, insertRules.value.replaceText)
          } else if (insertRules.value.replaceOption === 'first') {
            const index = nameWithoutExt.indexOf(insertRules.value.searchText)
            if (index !== -1) {
              nameWithoutExt = nameWithoutExt.substring(0, index) +
                  insertRules.value.replaceText +
                  nameWithoutExt.substring(index + insertRules.value.searchText.length)
            }
          } else if (insertRules.value.replaceOption === 'last') {
            const lastIndex = nameWithoutExt.lastIndexOf(insertRules.value.searchText)
            if (lastIndex !== -1) {
              nameWithoutExt = nameWithoutExt.substring(0, lastIndex) +
                  insertRules.value.replaceText +
                  nameWithoutExt.substring(lastIndex + insertRules.value.searchText.length)
            }
          }
        }

        if (insertRules.value.regexPattern && insertRules.value.regexReplace) {
          try {
            const regex = new RegExp(insertRules.value.regexPattern)
            nameWithoutExt = nameWithoutExt.replace(regex, insertRules.value.regexReplace)
          } catch (e) {
            console.error('Invalid regex pattern:', e)
          }
        }

        if (insertRules.value.caseOption) {
          switch (insertRules.value.caseOption) {
            case 'uppercase':
              nameWithoutExt = nameWithoutExt.toUpperCase()
              break
            case 'lowercase':
              nameWithoutExt = nameWithoutExt.toLowerCase()
              break
            case 'titlecase':
              nameWithoutExt = nameWithoutExt.split(' ').map(word =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ')
              break
          }
        }
        break

      case 'delete':
        // Delete rules
        if (deleteRules.value.deleteText && nameWithoutExt) {
          if (deleteRules.value.deleteOption === 'all') {
            const regex = new RegExp(deleteRules.value.deleteText, 'g')
            nameWithoutExt = nameWithoutExt.replace(regex, '')
          } else if (deleteRules.value.deleteOption === 'first') {
            const index = nameWithoutExt.indexOf(deleteRules.value.deleteText)
            if (index !== -1) {
              nameWithoutExt = nameWithoutExt.substring(0, index) +
                  nameWithoutExt.substring(index + deleteRules.value.deleteText.length)
            }
          } else if (deleteRules.value.deleteOption === 'last') {
            const lastIndex = nameWithoutExt.lastIndexOf(deleteRules.value.deleteText)
            if (lastIndex !== -1) {
              nameWithoutExt = nameWithoutExt.substring(0, lastIndex) +
                  nameWithoutExt.substring(lastIndex + deleteRules.value.deleteText.length)
            }
          }
        }

        if (deleteRules.value.startPos && deleteRules.value.endPos) {
          const start = Math.max(0, deleteRules.value.startPos - 1)
          const end = Math.min(nameWithoutExt.length, deleteRules.value.endPos)
          if (start < end) {
            nameWithoutExt = nameWithoutExt.substring(0, start) + nameWithoutExt.substring(end)
          }
        }

        if (deleteRules.value.deleteAllNames) {
          nameWithoutExt = ''
        }

        if (deleteRules.value.removeAllExt) {
          ext = ''
        } else if (deleteRules.value.specificExt && ext.toLowerCase() === deleteRules.value.specificExt.toLowerCase()) {
          ext = ''
        }
        break

      case 'numbering':
        // Numbering rules
        num = numberingRules.value.startNum + (index * numberingRules.value.step)
        paddedNum = numberingRules.value.padZero
            ? String(num).padStart(numberingRules.value.digits, numberingRules.value.padChar)
            : String(num)

        formattedNum = numberingRules.value.format
            .replace('{n}', paddedNum)
            .replace('{name}', nameWithoutExt)
            .replace('{ext}', ext)

        switch (numberingRules.value.numberPosition) {
          case 'start':
            nameWithoutExt = paddedNum + nameWithoutExt
            break
          case 'end':
            nameWithoutExt = nameWithoutExt + paddedNum
            break
          case 'position':
            pos = Math.min(numberingRules.value.position - 1, nameWithoutExt.length)
            nameWithoutExt = nameWithoutExt.substring(0, pos) + paddedNum + nameWithoutExt.substring(pos)
            break
          case 'replace':
            nameWithoutExt = formattedNum
            break
        }
        break
    }

    // Combine name and extension
    newName = nameWithoutExt + (deleteRules.value.keepExt ? ext : '')

    return {
      original: file.name,
      new: newName,
      path: file.path
    }
  })
})

const handlePathChange = (newPaths: string | string[]) => {
  filePaths.value = newPaths

  // Handle both string and array inputs
  const pathArray = Array.isArray(newPaths) ? newPaths : [newPaths]

  // Get the paths of currently selected files
  const currentPaths = new Set(pathArray)

  // Remove files that are no longer selected
  files.value = files.value.filter(file => currentPaths.has(file.path))

  // Add new files that weren't in the list before
  const newFiles = pathArray
      .filter(path => !files.value.some(file => file.path === path))
      .map(path => ({
        name: path.split('\\').pop() || '', // Get the last part of the path as filename
        path: path // Store the full path
      }))

  files.value.push(...newFiles)
}

const handleDrop = (e: DragEvent) => {
  unhighlight()
  if (e.dataTransfer) {
    const newFiles = [...e.dataTransfer.files]
    addFiles(newFiles)
  }
}

const highlight = () => {
  isDragging.value = true
}

const unhighlight = () => {
  isDragging.value = false
}

const addFiles = (newFiles: File[]) => {
  const filteredFiles = newFiles.filter(newFile =>
      !files.value.some(f =>
          f.name === newFile.name
      )
  )
  files.value = [...files.value, ...filteredFiles.map(file => ({
    name: file.name,
    path: file.name // In a real app, you might want to use file.path or similar
  }))]
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const clearFiles = () => {
  files.value = []
}

const reset = () => {
  ElMessage.success('所有重命名规则已重置')
}

const rename = () => {
  if (files.value.length === 0) {
    ElMessage.warning('请选择要重命名的文件')
    return
  }

  // Prepare the data for the API call using the preview data
  const fileRenames = previewData.value.map(file => ({
    absolutePath: file.path,
    newName: file.new
  }))

  // Call the backend API
  batchRenameFile(fileRenames)
      .then(response => {
        console.log(response)
        ElMessage.success('文件重命名成功')
        // Clear both the file list and SelectDir component
        clearFiles()
        filePaths.value = '' // Clear the SelectDir component
      })
      .catch(error => {
        console.error('重命名失败:', error)
        ElMessage.error('文件重命名失败: ' + (error.message || '未知错误'))
      })
}

const updateInsertRules = (rules: Partial<InsertRules>) => {
  insertRules.value = { ...insertRules.value, ...rules }
}

const updateDeleteRules = (rules: Partial<DeleteRules>) => {
  deleteRules.value = { ...deleteRules.value, ...rules }
}

const updateNumberingRules = (rules: Partial<NumberingRules>) => {
  numberingRules.value = { ...numberingRules.value, ...rules }
}
</script>

<style scoped>
.file-renamer {
  padding: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.dropzone {
  border: 2px dashed #dcdcdc;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.preview-area {
  min-height: 200px;
}

.mt-4 {
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0;
}
</style>