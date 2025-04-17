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
              <template slot-scope="scope">
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

<script>
import SelectDir from '@/components/SelectDir/SelectDir.vue'
import InsertTab from './BatchRename/InsertTab.vue'
import DeleteTab from './BatchRename/DeleteTab.vue'
import NumberingTab from './BatchRename/NumberingTab.vue'
import { batchRenameFile } from '@/utils/api'

export default {
  components: {
    SelectDir,
    InsertTab,
    DeleteTab,
    NumberingTab
  },
  data() {
    return {
      files: [],
      activeTab: 'insert',
      isDragging: false,
      filePaths: '',
      // Insert/Replace tab rules
      insertRules: {
        position: 'start',
        text: '',
        searchText: '',
        replaceText: '',
        replaceOption: 'all',
        regexPattern: '',
        regexReplace: '',
        caseOption: ''
      },
      // Delete tab rules
      deleteRules: {
        deleteText: '',
        deleteOption: 'all',
        startPos: 0,
        endPos: 0,
        keepExt: true,
        deleteAllNames: false,
        removeAllExt: false,
        specificExt: ''
      },
      // Numbering tab rules
      numberingRules: {
        startNum: 1,
        step: 1,
        repeat: 1,
        digits: 1,
        numberPosition: 'start',
        position: 1,
        padZero: true,
        padChar: '0',
        format: '{n}'
      }
    }
  },
  computed: {
    previewData() {
      return this.files.map((file, index) => {
        let newName = file.name
        let ext = newName.includes('.') ? newName.substring(newName.lastIndexOf('.')) : ''
        let nameWithoutExt = newName.includes('.') ? newName.substring(0, newName.lastIndexOf('.')) : newName
        let num, paddedNum, formattedNum, pos
        
        // Apply rules based on active tab
        switch (this.activeTab) {
          case 'insert':
            // Insert/Replace rules
            if (this.insertRules.text) {
              if (this.insertRules.position === 'start') {
                nameWithoutExt = this.insertRules.text + nameWithoutExt
              } else if (this.insertRules.position === 'end') {
                nameWithoutExt = nameWithoutExt + this.insertRules.text
              }
            }
            
            if (this.insertRules.searchText && this.insertRules.replaceText) {
              if (this.insertRules.replaceOption === 'all') {
                const regex = new RegExp(this.insertRules.searchText, 'g')
                nameWithoutExt = nameWithoutExt.replace(regex, this.insertRules.replaceText)
              } else if (this.insertRules.replaceOption === 'first') {
                const index = nameWithoutExt.indexOf(this.insertRules.searchText)
                if (index !== -1) {
                  nameWithoutExt = nameWithoutExt.substring(0, index) + 
                           this.insertRules.replaceText + 
                           nameWithoutExt.substring(index + this.insertRules.searchText.length)
                }
              } else if (this.insertRules.replaceOption === 'last') {
                const lastIndex = nameWithoutExt.lastIndexOf(this.insertRules.searchText)
                if (lastIndex !== -1) {
                  nameWithoutExt = nameWithoutExt.substring(0, lastIndex) + 
                           this.insertRules.replaceText + 
                           nameWithoutExt.substring(lastIndex + this.insertRules.searchText.length)
                }
              }
            }
            
            if (this.insertRules.regexPattern && this.insertRules.regexReplace) {
              try {
                const regex = new RegExp(this.insertRules.regexPattern)
                nameWithoutExt = nameWithoutExt.replace(regex, this.insertRules.regexReplace)
              } catch (e) {
                console.error('Invalid regex pattern:', e)
              }
            }

            if (this.insertRules.caseOption) {
              switch (this.insertRules.caseOption) {
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
            if (this.deleteRules.deleteText && nameWithoutExt) {
              if (this.deleteRules.deleteOption === 'all') {
                const regex = new RegExp(this.deleteRules.deleteText, 'g')
                nameWithoutExt = nameWithoutExt.replace(regex, '')
              } else if (this.deleteRules.deleteOption === 'first') {
                const index = nameWithoutExt.indexOf(this.deleteRules.deleteText)
                if (index !== -1) {
                  nameWithoutExt = nameWithoutExt.substring(0, index) + 
                           nameWithoutExt.substring(index + this.deleteRules.deleteText.length)
                }
              } else if (this.deleteRules.deleteOption === 'last') {
                const lastIndex = nameWithoutExt.lastIndexOf(this.deleteRules.deleteText)
                if (lastIndex !== -1) {
                  nameWithoutExt = nameWithoutExt.substring(0, lastIndex) + 
                           nameWithoutExt.substring(lastIndex + this.deleteRules.deleteText.length)
                }
              }
            }

            if (this.deleteRules.startPos && this.deleteRules.endPos) {
              const start = Math.max(0, this.deleteRules.startPos - 1)
              const end = Math.min(nameWithoutExt.length, this.deleteRules.endPos)
              if (start < end) {
                nameWithoutExt = nameWithoutExt.substring(0, start) + nameWithoutExt.substring(end)
              }
            }

            if (this.deleteRules.deleteAllNames) {
              nameWithoutExt = ''
            }

            if (this.deleteRules.removeAllExt) {
              ext = ''
            } else if (this.deleteRules.specificExt && ext.toLowerCase() === this.deleteRules.specificExt.toLowerCase()) {
              ext = ''
            }
            break

          case 'numbering':
            // Numbering rules
            num = this.numberingRules.startNum + (index * this.numberingRules.step)
            paddedNum = this.numberingRules.padZero 
              ? String(num).padStart(this.numberingRules.digits, this.numberingRules.padChar)
              : String(num)
            
            formattedNum = this.numberingRules.format
              .replace('{n}', paddedNum)
              .replace('{name}', nameWithoutExt)
              .replace('{ext}', ext)

            switch (this.numberingRules.numberPosition) {
              case 'start':
                nameWithoutExt = paddedNum + nameWithoutExt
                break
              case 'end':
                nameWithoutExt = nameWithoutExt + paddedNum
                break
              case 'position':
                pos = Math.min(this.numberingRules.position - 1, nameWithoutExt.length)
                nameWithoutExt = nameWithoutExt.substring(0, pos) + paddedNum + nameWithoutExt.substring(pos)
                break
              case 'replace':
                nameWithoutExt = formattedNum
                break
            }
            break
        }

        // Combine name and extension
        newName = nameWithoutExt + (this.deleteRules.keepExt ? ext : '')
        
        return {
          original: file.name,
          new: newName,
          path: file.path
        }
      })
    }
  },
  methods: {
    handlePathChange(newPaths) {
      this.filePaths = newPaths
      
      // Handle both string and array inputs
      const pathArray = Array.isArray(newPaths) ? newPaths : [newPaths]
      
      // Get the paths of currently selected files
      const currentPaths = new Set(pathArray)
      
      // Remove files that are no longer selected
      this.files = this.files.filter(file => currentPaths.has(file.path))
      
      // Add new files that weren't in the list before
      const newFiles = pathArray
        .filter(path => !this.files.some(file => file.path === path))
        .map(path => ({
          name: path.split('\\').pop(), // Get the last part of the path as filename
          path: path // Store the full path
        }))
      
      this.files.push(...newFiles)
    },
    handleDrop(e) {
      this.unhighlight()
      const newFiles = [...e.dataTransfer.files]
      this.addFiles(newFiles)
    },
    handleFileInput() {
      const newFiles = [...this.$refs.fileInput.files]
      this.addFiles(newFiles)
    },
    highlight() {
      this.isDragging = true
    },
    unhighlight() {
      this.isDragging = false
    },
    addFiles(newFiles) {
      newFiles = newFiles.filter(newFile =>
        !this.files.some(f =>
          f.name === newFile.name &&
          f.size === newFile.size &&
          f.lastModified === newFile.lastModified
        )
      )
      this.files = [...this.files, ...newFiles]
    },
    removeFile(index) {
      this.files.splice(index, 1)
    },
    clearFiles() {
      this.files = []
    },
    reset() {
      this.$message.success('所有重命名规则已重置')
    },
    rename() {
      if (this.files.length === 0) {
        this.$message.warning('请选择要重命名的文件')
        return
      }

      // Prepare the data for the API call using the preview data
      const fileRenames = this.previewData.map(file => ({
        absolutePath: file.path,
        newName: file.new
      }))

      // Call the backend API
      batchRenameFile(fileRenames)
        .then(response => {
          console.log(response)
          this.$message.success('文件重命名成功')
          // Clear both the file list and SelectDir component
          this.clearFiles()
          this.filePaths = '' // Clear the SelectDir component
        })
        .catch(error => {
          console.error('重命名失败:', error)
          this.$message.error('文件重命名失败: ' + (error.message || '未知错误'))
        })
    },
    updateInsertRules(rules) {
      this.insertRules = { ...this.insertRules, ...rules }
    },
    updateDeleteRules(rules) {
      this.deleteRules = { ...this.deleteRules, ...rules }
    },
    updateNumberingRules(rules) {
      this.numberingRules = { ...this.numberingRules, ...rules }
    }
  }
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