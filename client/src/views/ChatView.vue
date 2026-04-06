<template>
  <div class="h-screen flex">
    <!-- 左侧边栏 -->
    <aside class="w-64 bg-dark-100 border-r border-gray-800 flex flex-col">
      <!-- 用户信息 -->
      <div class="p-4 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <span class="text-white font-medium">{{ authStore.user?.username?.[0]?.toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white font-medium truncate">{{ authStore.user?.username }}</div>
            <div class="text-xs text-gray-400 flex items-center gap-1">
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              在线
            </div>
          </div>
          <button @click="handleLogout" class="p-2 hover:bg-dark-300 rounded-lg transition-colors">
            <LogOut class="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <!-- 导航 -->
      <nav class="flex-1 overflow-y-auto p-2">
        <button
          @click="currentTab = 'chat'"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1',
            currentTab === 'chat' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-300'
          ]"
        >
          <MessageCircle class="w-5 h-5" />
          <span>群聊</span>
        </button>
        <button
          @click="currentTab = 'private'"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1',
currentTab === 'private' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-300'
          ]"
        >
          <Mail class="w-5 h-5" />
          <span>私信</span>
          <span v-if="unreadPrivateCount > 0" class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {{ unreadPrivateCount }}
          </span>
        </button>
        <button
          @click="currentTab = 'chain'"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1',
            currentTab === 'chain' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-300'
          ]"
        >
          <GitBranch class="w-5 h-5" />
          <span>接龙</span>
        </button>
        <button
          @click="currentTab = 'announcement'"
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-1',
            currentTab === 'announcement' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-dark-300'
          ]"
        >
          <Megaphone class="w-5 h-5" />
          <span>通告</span>
        </button>
      </nav>

      <!-- 在线用户 -->
      <div class="border-t border-gray-800 p-4">
        <h3 class="text-sm font-medium text-gray-400 mb-3">在线用户 ({{ onlineUsers.length }})</h3>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          <div
            v-for="user in onlineUsers"
            :key="user.id"
            class="flex items-center gap-2"
          >
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            <span class="text-sm text-gray-300 truncate">{{ user.username }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col">
      <!-- 群聊 -->
      <template v-if="currentTab === 'chat'">
        <ChatRoom
          :replying-to="replyingTo"
          @send="sendMessage"
          @reply="setReply"
          @cancel-reply="replyingTo = null"
        />
      </template>

      <!-- 私信 -->
      <template v-else-if="currentTab === 'private'">
        <PrivateChat
          :selected-user-id="selectedPrivateUser"
          @select="selectPrivateUser"
        />
      </template>

      <!-- 接龙 -->
      <template v-else-if="currentTab === 'chain'">
        <ChainRoom @join="handleJoinChain" />
      </template>

      <!-- 通告 -->
      <template v-else-if="currentTab === 'announcement'">
        <AnnouncementPanel />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle, Mail, GitBranch, Megaphone, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import { api } from '../composables/useApi'
import ChatRoom from '../components/ChatRoom.vue'
import PrivateChat from '../components/PrivateChat.vue'
import ChainRoom from '../components/ChainRoom.vue'
import AnnouncementPanel from '../components/AnnouncementPanel.vue'

const router = useRouter()
const authStore = useAuthStore()
const { connect, getSocket } = useSocket()

const currentTab = ref<'chat' | 'private' | 'chain' | 'announcement'>('chat')
const onlineUsers = ref<Array<{ id: number; username: string }>>([])
const replyingTo = ref<{ id: number; content: string; username: string } | null>(null)
const selectedPrivateUser = ref<number | null>(null)
const unreadPrivateCount = ref(0)

// 消息处理
function sendMessage(content: string) {
  const socket = getSocket()
  if (socket) {
    socket.emit('message', {
      content,
      type: 'normal',
      reply_to: replyingTo.value?.id
    })
    replyingTo.value = null
  }
}

function setReply(message: { id: number; content: string; username: string }) {
  replyingTo.value = message
}

function selectPrivateUser(userId: number) {
  selectedPrivateUser.value = userId
}

function handleJoinChain(data: { chainId: number; word: string }) {
  const socket = getSocket()
  if (socket) {
    socket.emit('chain_update', data)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  // 连接Socket
  connect()

  const socket = getSocket()
  if (socket) {
    socket.on('online_users', (users) => {
      onlineUsers.value = users
    })

    socket.on('users_list', (users) => {
      onlineUsers.value = users.filter((u: any) => u.is_online)
    })
  }

  // 获取初始用户列表
  try {
    const data = await api('/api/users')
    onlineUsers.value = data.users.filter((u: any) => u.is_online)
  } catch (e) {
    console.error('Failed to fetch users:', e)
  }
})
</script>
