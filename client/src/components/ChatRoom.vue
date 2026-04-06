<template>
  <div class="flex-1 flex flex-col">
    <!-- 消息列表 -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="loading" class="text-center text-gray-400 py-8">
        加载中...
      </div>
      
      <div v-else-if="messages.length === 0" class="text-center text-gray-400 py-8">
        还没有消息，快来发起聊天吧！
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :current-user-id="authStore.user?.id"
        @reply="handleReply"
      />
    </div>

    <!-- 回复提示 -->
    <div v-if="replyingTo" class="px-4 py-2 bg-dark-100 border-t border-gray-800 flex items-center gap-2">
      <Reply class="w-4 h-4 text-primary-400" />
      <span class="text-sm text-gray-400">回复 {{ replyingTo.username }}:</span>
      <span class="text-sm text-gray-300 truncate flex-1">{{ replyingTo.content }}</span>
      <button @click="$emit('cancel-reply')" class="text-gray-500 hover:text-white">
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- 输入框 -->
    <div class="p-4 bg-dark-100 border-t border-gray-800">
      <div class="flex items-end gap-3">
        <button
          v-if="!showReplyInput"
          @click="showReplyInput = true"
          class="p-2 hover:bg-dark-300 rounded-lg transition-colors"
        >
          <Reply class="w-5 h-5 text-gray-400" />
        </button>
        
        <div class="flex-1 relative">
          <textarea
            v-model="newMessage"
            @keydown.enter.exact.prevent="send"
            class="input resize-none pr-12"
            rows="1"
            placeholder="输入消息..."
          ></textarea>
        </div>

        <button
          @click="send"
          :disabled="!newMessage.trim()"
          class="btn-primary px-6"
        >
          <Send class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Send, Reply, X } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import { api } from '../composables/useApi'
import MessageBubble from './MessageBubble.vue'

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
  replyingTo: { id: number; content: string; username: string } | null
}>()

const emit = defineEmits<{
  send: [content: string]
  reply: [message: { id: number; content: string; username: string }]
  'cancel-reply': []
}>()

const authStore = useAuthStore()
const { getSocket } = useSocket()

const messages = ref<Message[]>([])
const newMessage = ref('')
const loading = ref(true)
const showReplyInput = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

async function loadMessages() {
  try {
    const data = await api('/api/messages')
    messages.value = data.messages
  } catch (e) {
    console.error('Failed to load messages:', e)
  } finally {
    loading.value = false
  }
}

function send() {
  if (!newMessage.value.trim()) return
  emit('send', newMessage.value)
  newMessage.value = ''
  showReplyInput.value = false
}

function handleReply(message: Message) {
  emit('reply', {
    id: message.id,
    content: message.content,
    username: message.username
  })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  loadMessages()

  const socket = getSocket()
  if (socket) {
    socket.on('message', (msg: Message) => {
      messages.value.push(msg)
      scrollToBottom()
    })
  }
})

onUnmounted(() => {
  const socket = getSocket()
  if (socket) {
    socket.off('message')
  }
})
</script>
