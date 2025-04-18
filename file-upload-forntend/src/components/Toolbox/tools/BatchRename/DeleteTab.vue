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

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  rules: {
    deleteText?: string
    deleteOption?: 'all' | 'first' | 'last'
    startPos?: number
    endPos?: number
    keepExt?: boolean
    specificExt?: string
  }
}

const props = defineProps<Props>()
const emit = defineEmits(['updateRules'])

// 定义响应式数据
const deleteText = ref(props.rules.deleteText || '')
const deleteOption = ref<'all' | 'first' | 'last'>(props.rules.deleteOption || 'all')
const startPos = ref<number>(props.rules.startPos || 0)
const endPos = ref<number>(props.rules.endPos || 0)
const keepExt = ref<boolean>(props.rules.keepExt !== undefined ? props.rules.keepExt : true)
const specificExt = ref<string>(props.rules.specificExt || '')

// 监听数据变化并触发 updateRules
watch([deleteText, deleteOption, startPos, endPos, keepExt, specificExt], () => {
  emitRules()
})

// 删除所有名称
const deleteAllNames = () => {
  emit('updateRules', { ...getRules(), deleteAllNames: true })
  ElMessage.success('已删除所有文件名')
}

// 移除所有扩展名
const removeAllExt = () => {
  emit('updateRules', { ...getRules(), removeAllExt: true })
  ElMessage.success('已移除所有扩展名')
}

// 移除特定扩展名
const removeSpecificExt = () => {
  if (!specificExt.value) {
    ElMessage.warning('请输入要移除的扩展名')
    return
  }
  emitRules()
  ElMessage.success(`已移除扩展名 ${specificExt.value}`)
}

// 获取当前规则
const getRules = () => ({
  deleteText: deleteText.value,
  deleteOption: deleteOption.value,
  startPos: startPos.value,
  endPos: endPos.value,
  keepExt: keepExt.value,
  deleteAllNames: false,
  removeAllExt: false,
  specificExt: specificExt.value
})

// 触发更新规则事件
const emitRules = () => {
  emit('updateRules', getRules())
}
</script>