<template>
  <div class="flex-1 flex">
    <!-- 左侧：用户列表 -->
    <div class="w-64 border-r border-gray-800 flex flex-col">
      <div class="p-4 border-b border-gray-800">
        <h2 class="text-lg font-medium text-white">私信</h2>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="user in users"
          :key="user.id"
          @click="$emit('select', user.id)"
          :class="[
            'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-300 transition-colors',
            selectedUserId === user.id ? 'bg-dark-300' : ''
          ]"
        >
          <div class="relative">
            <div class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span class="text-white font-medium">{{ user.username?.[0]?.toUpperCase() }}</span>
            </div>
            <span
              v-if="user.is_online"
              class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-200"
            ></span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-200 truncate">{{ user.username }}</div>
            <div v-if="user.unread_count" class="text-xs text-red-400">{{ user.unread_count }} 条未读</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：聊天区域 -->
    <div class="flex-1 flex flex-col">
      <template v-if="selectedUserId">
        <!-- 消息列表 -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
          <div v-else-if="messages.length === 0" class="text-center text-gray-400 py-8">开始和 {{ selectedUsername }} 聊天吧！</div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['flex gap-3', isOwn(msg) ? 'flex-row-reverse' : '']"
          >
            <div class="w-10 h-10 rounded-full bg-primary-600 flex-shrink-0 flex items-center justify-center">
              <span class="text-white font-medium">{{ getUsername(msg)?.[0]?.toUpperCase() }}</span>
            </div>
            <div :class="['max-w-[70%]']">
              <div :class="['flex items-center gap-2 mb-1', isOwn(msg) ? 'flex-row-reverse' : '']">
                <span class="text-sm font-medium text-gray-200">{{ getUsername(msg) }}</span>
                <span class="text-xs text-gray-500">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div :class="[
                'px-4 py-2.5 rounded-2xl',
                isOwn(msg) ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-dark-100 text-gray-100 rounded-bl-sm'
              ]">
                {{ msg.content }}
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="p-4 bg-dark-100 border-t border-gray-800">
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <textarea
                v-model="newMessage"
                @keydown.enter.exact.prevent="sendMessage"
                class="input resize-none"
                rows="1"
                placeholder="输入私信..."
              ></textarea>
            </div>
            <button @click="sendMessage" :disabled="!newMessage.trim()" class="btn-primary px-6">
              <Send class="w-5 h-5" />
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="flex-1 flex items-center justify-center text-gray-400">
          选择一个用户开始私信
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { Send } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import { api } from '../composables/useApi'

interface User {
  id: number
  username: string
  avatar: string
  is_online: number
  unread_count?: number
}

interface PrivateMessage {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  sender_username: string
}

const props = defineProps<{
  selectedUserId: number | null
}>()

const emit = defineEmits<{
  select: [userId: number]
}>()

const authStore = useAuthStore()
const { getSocket } = useSocket()

const users = ref<User[]>([])
const messages = ref<PrivateMessage[]>([])
const newMessage = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const selectedUsername = ref('')

async function loadUsers() {
  try {
    const data = await api('/api/users')
    users.value = data.users.filter((u: User) => u.id !== authStore.user?.id)
  } catch (e) {
    console.error('Failed to load users:', e)
  }
}

async function loadMessages() {
  if (!props.selectedUserId) return
  
  loading.value = true
  try {
    const data = await api(`/api/messages/private/${props.selectedUserId}`)
    messages.value = data.messages
    selectedUsername.value = users.value.find(u => u.id === props.selectedUserId)?.username || ''
    scrollToBottom()
  } catch (e) {
    console.error('Failed to load messages:', e)
  } finally {
    loading.value = false
  }
}

function sendMessage() {
  if (!newMessage.value.trim() || !props.selectedUserId) return
  
  const socket = getSocket()
  if (socket) {
    socket.emit('private', {
receiver_id: props.selectedUserId,
      content: newMessage.value.trim()
    })
    newMessage.value = ''
  }
}

function isOwn(msg: PrivateMessage) {
  return msg.sender_id === authStore.user?.id
}

function getUsername(msg: PrivateMessage) {
  return msg.sender_username
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(() => props.selectedUserId, () => {
  if (props.selectedUserId) {
    loadMessages()
  }
})

onMounted(() => {
  loadUsers()

  const socket = getSocket()
  if (socket) {
    socket.on('private', (msg: PrivateMessage) => {
      if (msg.sender_id === props.selectedUserId || msg.receiver_id === props.selectedUserId) {
        messages.value.push(msg)
        scrollToBottom()
      }
    })

    socket.on('private_sent', (msg: PrivateMessage) => {
      messages.value.push(msg)
      scrollToBottom()
    })
  }
})
</script>
