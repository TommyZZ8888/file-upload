
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

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  rules: {
    startNum?: number
    step?: number
    repeat?: number
    digits?: number
    numberPosition?: 'start' | 'end' | 'position' | 'replace'
    position?: number
    padZero?: boolean
    padChar?: string
    format?: string
  }
}

const props = defineProps<Props>()
const emit = defineEmits(['updateRules'])

// 定义响应式数据
const startNum = ref<number>(props.rules.startNum || 1)
const step = ref<number>(props.rules.step || 1)
const repeat = ref<number>(props.rules.repeat || 1)
const digits = ref<number>(props.rules.digits || 1)
const numberPosition = ref<'start' | 'end' | 'position' | 'replace'>(props.rules.numberPosition || 'start')
const position = ref<number>(props.rules.position || 1)
const padZero = ref<boolean>(props.rules.padZero !== undefined ? props.rules.padZero : true)
const padChar = ref<string>(props.rules.padChar || '0')
const format = ref<string>(props.rules.format || '{n}')

// 监听所有数据的变化并触发更新
watch(
    [startNum, step, repeat, digits, numberPosition, position, padZero, padChar, format],
    () => {
      emitRules()
    }
)

// 预览数字
const previewNumber = () => {
  const result: string[] = []
  for (let i = 0; i < repeat.value; i++) {
    const num = startNum.value + i * step.value
    const paddedNum = padZero.value
        ? String(num).padStart(digits.value, padChar.value)
        : String(num)

    const preview = format.value
        .replace('{n}', paddedNum)
        .replace('{name}', 'example')
        .replace('{ext}', '.txt')

    result.push(preview)
  }

  ElMessage.success(`预览: ${result.join(', ')}`)
}

// 触发规则更新事件
const emitRules = () => {
  emit('updateRules', {
    startNum: startNum.value,
    step: step.value,
    repeat: repeat.value,
    digits: digits.value,
    numberPosition: numberPosition.value,
    position: position.value,
    padZero: padZero.value,
    padChar: padChar.value,
    format: format.value
  })
}
</script>