<template>
  <div :class="['flex gap-3', isOwn ? 'flex-row-reverse' : '']">
    <!-- 头像 -->
    <div class="w-10 h-10 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center">
      <span class="text-white font-medium">{{ message.username?.[0]?.toUpperCase() }}</span>
    </div>

    <!-- 消息内容 -->
    <div :class="['max-w-[70%]', isOwn ? 'items-end' : 'items-start']">
      <!-- 用户名和时间 -->
      <div :class="['flex items-center gap-2 mb-1', isOwn ? 'flex-row-reverse' : '']">
        <span class="text-sm font-medium text-gray-200">{{ message.username }}</span>
        <span v-if="message.is_admin" class="text-xs bg-primary-600 text-white px-1.5 py-0.5 rounded">管理员</span>
        <span class="text-xs text-gray-500">{{ formatTime(message.created_at) }}</span>
      </div>

      <!-- 回复内容 -->
      <div v-if="message.reply_to && message.reply_content" :class="[
        'mb-1 p-2 rounded-lg text-sm border-l-2',
        isOwn ? 'bg-dark-300 border-primary-400 text-right' : 'bg-gray-800 border-primary-400'
      ]">
        <div class="text-xs text-primary-400 mb-0.5">回复 {{ message.reply_username }}</div>
        <div class="text-gray-400">{{ message.reply_content }}</div>
      </div>

      <!-- 消息气泡 -->
      <div :class="[
        'px-4 py-2.5 rounded-2xl',
        isOwn 
          ? 'bg-primary-600 text-white rounded-br-sm' 
          : 'bg-dark-100 text-gray-100 rounded-bl-sm'
      ]">
        {{ message.content }}
      </div>

      <!-- 操作按钮 -->
      <div :class="['flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity', isOwn ? 'flex-row-reverse' : '']">
        <button
          @click="$emit('reply', message)"
          class="text-xs text-gray-500 hover:text-primary-400"
        >
          回复
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Message {
  id: number
  user_id: number
  username: string
  avatar: string
  is_admin: number
  content: string
  type: string
  reply_to: number | null
  reply_content: string | null
  reply_username: string | null
  created_at: string
}

const props = defineProps<{
  message: Message
  currentUserId?: number
}>()

defineEmits<{
  reply: [message: Message]
}>()

const isOwn = computed(() => props.message.user_id === props.currentUserId)

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>
