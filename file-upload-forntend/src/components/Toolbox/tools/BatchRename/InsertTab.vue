<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <el-form label-width="80px">
        <el-form-item label="插入文本">
          <div class="insert-form-row">
            <el-select v-model="insertPosition">
              <el-option label="在开头" value="start"></el-option>
              <el-option label="在结尾" value="end"></el-option>
              <el-option label="在指定位置" value="position"></el-option>
            </el-select>
            <el-input v-model="insertText" placeholder="要插入的文本"></el-input>
          </div>
        </el-form-item>
        <el-form-item label="替换文本">
          <div class="replace-form-row">
            <el-input v-model="searchText" placeholder="查找"></el-input>
            <el-input v-model="replaceText" placeholder="替换为"></el-input>
          </div>
          <el-radio-group v-model="replaceOption" class="mt-2">
            <el-radio label="all">全部替换</el-radio>
            <el-radio label="first">仅首次</el-radio>
            <el-radio label="last">仅最后</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
    <div>
      <el-form label-width="80px">
        <el-form-item label="正则表达">
          <div class="regex-form-row">
            <el-input v-model="regexPattern" placeholder="正则模式"></el-input>
            <el-input v-model="regexReplace" placeholder="替换为 ($1, $2...)"></el-input>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            使用 $1, $2 等引用捕获组。例如："(.*)\.(.*)" → "$2.$1" 可交换点前后的部分。
          </div>
        </el-form-item>
        <el-form-item label="大小写">
          <el-button-group>
            <el-button size="small" @click="handleCaseChange('uppercase')" :type="caseOption === 'uppercase' ? 'primary' : ''">全大写</el-button>
            <el-button size="small" @click="handleCaseChange('lowercase')" :type="caseOption === 'lowercase' ? 'primary' : ''">全小写</el-button>
            <el-button size="small" @click="handleCaseChange('titlecase')" :type="caseOption === 'titlecase' ? 'primary' : ''">标题格式</el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    rules: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      insertPosition: this.rules.position || 'start',
      insertText: this.rules.text || '',
      searchText: this.rules.searchText || '',
      replaceText: this.rules.replaceText || '',
      replaceOption: this.rules.replaceOption || 'all',
      regexPattern: this.rules.regexPattern || '',
      regexReplace: this.rules.regexReplace || '',
      caseOption: this.rules.caseOption || ''
    }
  },
  watch: {
    insertPosition: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    insertText: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    searchText: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    replaceText: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    replaceOption: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    regexPattern: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    regexReplace: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    },
    caseOption: {
      handler(newVal) {
        this.emitRulesUpdate(newVal)
      }
    }
  },
  methods: {
    handleCaseChange(option) {
      this.caseOption = this.caseOption === option ? '' : option
      this.emitRulesUpdate()
    },
    emitRulesUpdate() {
      this.$emit('updateRules', {
        position: this.insertPosition,
        text: this.insertText,
        searchText: this.searchText,
        replaceText: this.replaceText,
        replaceOption: this.replaceOption,
        regexPattern: this.regexPattern,
        regexReplace: this.regexReplace,
        caseOption: this.caseOption
      })
    }
  }
}
</script>

<style scoped>
.insert-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.insert-form-row :deep(.el-select) {
  width: 120px;
}

.insert-form-row :deep(.el-input) {
  flex: 1;
}

.replace-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.replace-form-row :deep(.el-input) {
  flex: 1;
}

.regex-form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.regex-form-row :deep(.el-input) {
  flex: 1;
}
</style>