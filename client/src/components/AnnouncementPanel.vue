<template>
  <div class="flex-1 flex flex-col p-4">
    <!-- 管理员发布通告 -->
    <div v-if="authStore.user?.is_admin" class="card p-4 mb-4">
      <h3 class="text-lg font-medium text-white mb-3">发布通告</h3>
      <div class="space-y-3">
        <textarea
          v-model="newContent"
          class="input resize-none"
          rows="3"
          placeholder="通告内容..."
        ></textarea>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-400">优先级:</label>
            <select v-model="newPriority" class="input w-auto">
              <option :value="0">普通</option>
              <option :value="1">重要</option>
              <option :value="2">紧急</option>
            </select>
          </div>
          <button @click="createAnnouncement" :disabled="!newContent" class="btn-primary px-6">
            发布
          </button>
        </div>
      </div>
    </div>

    <!-- 通告列表 -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
      <div v-else-if="announcements.length === 0" class="text-center text-gray-400 py-8">暂无通告</div>

      <div
        v-for="ann in announcements"
        :key="ann.id"
        :class="[
          'card p-4 border-l-4',
          ann.priority === 2 ? 'border-l-red-500 bg-red-500/5' :
          ann.priority === 1 ? 'border-l-yellow-500 bg-yellow-500/5' :
          'border-l-primary-500'
        ]"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <span v-if="ann.priority === 2" class="px-2 py-0.5 bg-red-500 text-white text-xs rounded">紧急</span>
            <span v-else-if="ann.priority === 1" class="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded">重要</span>
            <span class="text-sm text-gray-400">{{ ann.creator_name }}</span>
            <span class="text-xs text-gray-500">{{ formatTime(ann.created_at) }}</span>
          </div>
          <button
            v-if="authStore.user?.is_admin"
            @click="deleteAnnouncement(ann.id)"
            class="text-gray-500 hover:text-red-400"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
        <p class="text-gray-200">{{ ann.content }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import { api } from '../composables/useApi'

interface Announcement {
  id: number
  content: string
  priority: number
  creator_name: string
  created_at: string
}

const authStore = useAuthStore()
const { getSocket } = useSocket()

const announcements = ref<Announcement[]>([])
const newContent = ref('')
const newPriority = ref(0)
const loading = ref(false)

async function loadAnnouncements() {
  loading.value = true
  try {
    const data = await api('/api/announcements')
    announcements.value = data.announcements
  } catch (e) {
    console.error('Failed to load announcements:', e)
  } finally {
    loading.value = false
  }
}

async function createAnnouncement() {
  if (!newContent.value) return

  try {
    await api('/api/announcements', {
      method: 'POST',
      body: {
        content: newContent.value,
        priority: newPriority.value
      }
    })
    newContent.value = ''
    newPriority.value = 0
    loadAnnouncements()

    // 广播通告更新
    const socket = getSocket()
    if (socket) {
      socket.emit('announcement_update', { type: 'new' })
    }
  } catch (e) {
    console.error('Failed to create announcement:', e)
  }
}

async function deleteAnnouncement(id: number) {
  if (!confirm('确定要删除这条通告吗？')) return

  try {
    await api(`/api/announcements/${id}`, { method: 'DELETE' })
    loadAnnouncements()
  } catch (e) {
    console.error('Failed to delete announcement:', e)
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadAnnouncements()

  const socket = getSocket()
  if (socket) {
    socket.on('announcement', () => {
      loadAnnouncements()
    })
  }
})
</script>
