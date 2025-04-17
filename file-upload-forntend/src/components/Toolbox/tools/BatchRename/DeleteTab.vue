<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <el-form label-width="80px">
        <el-form-item label="文本移除">
          <div class="flex gap-2">
            <el-input v-model="deleteText" placeholder="要删除的文本" class="flex-1"></el-input>
            <el-select v-model="deleteOption" class="flex-1">
              <el-option label="全部删除" value="all"></el-option>
              <el-option label="仅首次" value="first"></el-option>
              <el-option label="仅最后" value="last"></el-option>
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="索引移除">
          <div class="flex gap-2 items-center">
            <el-input-number v-model="startPos" :min="0" size="small" placeholder="起始"></el-input-number>
            <span>至</span>
            <el-input-number v-model="endPos" :min="0" size="small" placeholder="结束"></el-input-number>
            <span>字符</span>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div>
      <el-form label-width="80px">
        <el-form-item label="清空名称">
          <el-checkbox v-model="keepExt">保留扩展名</el-checkbox>
          <el-button type="danger" size="small" class="ml-2" @click="deleteAllNames">删除所有名称</el-button>
        </el-form-item>
        <el-form-item label="移除扩展">
          <div class="flex gap-2">
            <el-button size="small" @click="removeAllExt">移除所有扩展名</el-button>
            <el-input v-model="specificExt" placeholder=".ext" style="width: 100px;"></el-input>
            <el-button size="small" @click="removeSpecificExt">移除特定扩展名</el-button>
          </div>
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
      deleteText: this.rules.deleteText || '',
      deleteOption: this.rules.deleteOption || 'all',
      startPos: this.rules.startPos || 0,
      endPos: this.rules.endPos || 0,
      keepExt: this.rules.keepExt !== undefined ? this.rules.keepExt : true,
      specificExt: this.rules.specificExt || ''
    }
  },
  watch: {
    deleteText() { this.emitRules() },
    deleteOption() { this.emitRules() },
    startPos() { this.emitRules() },
    endPos() { this.emitRules() },
    keepExt() { this.emitRules() },
    specificExt() { this.emitRules() }
  },
  methods: {
    deleteAllNames() {
      this.$emit('updateRules', { ...this.getRules(), deleteAllNames: true })
      this.$message.success('已删除所有文件名')
    },
    removeAllExt() {
      this.$emit('updateRules', { ...this.getRules(), removeAllExt: true })
      this.$message.success('已移除所有扩展名')
    },
    removeSpecificExt() {
      if (!this.specificExt) {
        this.$message.warning('请输入要移除的扩展名')
        return
      }
      this.emitRules()
      this.$message.success(`已移除扩展名 ${this.specificExt}`)
    },
    getRules() {
      return {
        deleteText: this.deleteText,
        deleteOption: this.deleteOption,
        startPos: this.startPos,
        endPos: this.endPos,
        keepExt: this.keepExt,
        deleteAllNames: false,
        removeAllExt: false,
        specificExt: this.specificExt
      }
    },
    emitRules() {
      this.$emit('updateRules', this.getRules())
    }
  }
}
</script>