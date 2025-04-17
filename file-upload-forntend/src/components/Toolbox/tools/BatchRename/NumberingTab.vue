<template>
  <div class="grid grid-cols-2 gap-4">
    <div>
      <el-form label-width="80px">
        <el-form-item label="编号选项">
          <div class="grid grid-cols-2 gap-2">
            <el-form-item label="起始" label-width="60px">
              <el-input-number v-model="startNum" :min="0" size="small"></el-input-number>
            </el-form-item>
            <el-form-item label="步长" label-width="60px">
              <el-input-number v-model="step" :min="1" size="small"></el-input-number>
            </el-form-item>
            <el-form-item label="重复" label-width="60px">
              <el-input-number v-model="repeat" :min="1" size="small"></el-input-number>
            </el-form-item>
            <el-form-item label="位数" label-width="60px">
              <el-input-number v-model="digits" :min="1" :max="10" size="small"></el-input-number>
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="数字位置">
          <div class="flex gap-2">
            <el-select v-model="numberPosition" class="flex-1">
              <el-option label="在开头" value="start"></el-option>
              <el-option label="在结尾" value="end"></el-option>
              <el-option label="在指定位置" value="position"></el-option>
              <el-option label="替换整个名称" value="replace"></el-option>
            </el-select>
            <el-input-number v-model="position" :min="1" size="small" v-if="numberPosition === 'position'"></el-input-number>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div>
      <el-form label-width="80px">
        <el-form-item label="填充选项">
          <el-checkbox v-model="padZero">用零填充</el-checkbox>
          <el-input v-model="padChar" maxlength="1" size="small" class="ml-2" style="width: 50px;" v-if="padZero"></el-input>
        </el-form-item>
        <el-form-item label="数字格式">
          <div class="flex gap-2">
            <el-input v-model="format" class="flex-1"></el-input>
            <el-button type="primary" size="small" @click="previewNumber">预览</el-button>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            使用 {n} 表示数字，{name} 表示原文件名，{ext} 表示扩展名（替换整个名称时可用）
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
      startNum: this.rules.startNum || 1,
      step: this.rules.step || 1,
      repeat: this.rules.repeat || 1,
      digits: this.rules.digits || 1,
      numberPosition: this.rules.numberPosition || 'start',
      position: this.rules.position || 1,
      padZero: this.rules.padZero !== undefined ? this.rules.padZero : true,
      padChar: this.rules.padChar || '0',
      format: this.rules.format || '{n}'
    }
  },
  watch: {
    startNum() { this.emitRules() },
    step() { this.emitRules() },
    repeat() { this.emitRules() },
    digits() { this.emitRules() },
    numberPosition() { this.emitRules() },
    position() { this.emitRules() },
    padZero() { this.emitRules() },
    padChar() { this.emitRules() },
    format() { this.emitRules() }
  },
  methods: {
    previewNumber() {
      let result = []
      for (let i = 0; i < this.repeat; i++) {
        const num = this.startNum + (i * this.step)
        const paddedNum = this.padZero 
          ? String(num).padStart(this.digits, this.padChar)
          : String(num)
        
        const preview = this.format
          .replace('{n}', paddedNum)
          .replace('{name}', 'example')
          .replace('{ext}', '.txt')
        
        result.push(preview)
      }

      this.$message.success(`预览: ${result.join(', ')}`)
    },
    emitRules() {
      this.$emit('updateRules', {
        startNum: this.startNum,
        step: this.step,
        repeat: this.repeat,
        digits: this.digits,
        numberPosition: this.numberPosition,
        position: this.position,
        padZero: this.padZero,
        padChar: this.padChar,
        format: this.format
      })
    }
  }
}
</script>