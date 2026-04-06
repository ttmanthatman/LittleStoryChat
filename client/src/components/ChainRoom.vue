<template>
  <div class="flex-1 flex flex-col p-4">
    <!-- 接龙列表 -->
    <div class="flex-1 overflow-y-auto space-y-4">
      <!-- 创建接龙 -->
      <div class="card p-4">
        <h3 class="text-lg font-medium text-white mb-3">创建新接龙</h3>
        <div class="flex gap-3">
          <input
            v-model="newChainTitle"
            class="input flex-1"
            placeholder="接龙主题 (如: 成语接龙)"
          />
          <input
            v-model="newChainWord"
            class="input flex-1"
            placeholder="第一个词语"
          />
          <button @click="createChain" :disabled="!newChainTitle || !newChainWord" class="btn-primary px-6">
            创建
          </button>
        </div>
      </div>

      <!-- 接龙卡片 -->
      <div v-if="loading" class="text-center text-gray-400 py-8">加载中...</div>
      <div v-else-if="chains.length === 0" class="text-center text-gray-400 py-8">暂无进行中的接龙</div>

      <div
        v-for="chain in chains"
        :key="chain.id"
        class="card p-4"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="text-lg font-medium text-white">{{ chain.title }}</h3>
            <p class="text-sm text-gray-400">创建者: {{ chain.creator_name }}</p>
          </div>
          <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            进行中 · {{ chain.entry_count }} 条
          </span>
        </div>

        <!-- 当前词语 -->
        <div class="bg-dark-200 rounded-lg p-4 mb-3">
          <div class="text-sm text-gray-400 mb-1">当前词语</div>
          <div class="text-2xl font-bold text-primary-400">{{ chain.current_word }}</div>
          <div class="text-xs text-gray-500 mt-1">
            尾字: "{{ chain.current_word.slice(-1) }}" → 下一个请以这个字开头
          </div>
        </div>

        <!-- 接龙历史 -->
        <div v-if="expandedChains.includes(chain.id)" class="space-y-2 mb-3 max-h-60 overflow-y-auto">
          <div
            v-for="entry in chainEntries[chain.id]"
            :key="entry.id"
            class="flex items-center gap-2 text-sm"
          >
            <span class="text-gray-500">{{ formatTime(entry.created_at) }}</span>
            <span class="text-gray-300">{{ entry.username }}:</span>
            <span class="text-primary-300">{{ entry.word }}</span>
          </div>
        </div>

        <!-- 操作 -->
        <div class="flex gap-3">
          <button
            v-if="!expandedChains.includes(chain.id)"
            @click="toggleChain(chain.id)"
            class="btn-secondary text-sm"
          >
            查看历史
          </button>
          <button
            v-else
            @click="toggleChain(chain.id)"
            class="btn-secondary text-sm"
          >
            收起
          </button>

          <div class="flex-1 flex gap-2">
            <input
              v-model="joinWords[chain.id]"
              class="input flex-1 text-sm"
              :placeholder="`接龙 (接 ${chain.current_word.slice(-1)} 字开头)`"
            />
            <button
              @click="joinChain(chain.id)"
              :disabled="!joinWords[chain.id]"
              class="btn-primary px-4"
            >
              提交
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSocket } from '../composables/useSocket'
import { api } from '../composables/useApi'

interface Chain {
  id: number
  title: string
  current_word: string
  creator_name: string
  entry_count: number
  is_active: number
}

interface ChainEntry {
  id: number
  chain_id: number
  word: string
  username: string
  created_at: string
}

const emit = defineEmits<{
  join: [data: { chainId: number; word: string }]
}>()

const authStore = useAuthStore()
const { getSocket } = useSocket()

const chains = ref<Chain[]>([])
const chainEntries = reactive<Record<number, ChainEntry[]>>({})
const expandedChains = ref<number[]>([])
const joinWords = reactive<Record<number, string>>({})
const newChainTitle = ref('')
const newChainWord = ref('')
const loading = ref(false)

async function loadChains() {
  loading.value = true
  try {
    const data = await api('/api/chains')
    chains.value = data.chains
  } catch (e) {
    console.error('Failed to load chains:', e)
  } finally {
    loading.value = false
  }
}

async function toggleChain(chainId: number) {
  const index = expandedChains.value.indexOf(chainId)
  if (index > -1) {
    expandedChains.value.splice(index, 1)
  } else {
    expandedChains.value.push(chainId)
    if (!chainEntries[chainId]) {
      const data = await api(`/api/chains/${chainId}`)
      chainEntries[chainId] = data.entries
    }
  }
}

async function createChain() {
  if (!newChainTitle.value || !newChainWord.value) return

  try {
    await api('/api/chains', {
      method: 'POST',
      body: { title: newChainTitle.value, word: newChainWord.value }
    })
    newChainTitle.value = ''
    newChainWord.value = ''
    loadChains()
  } catch (e) {
    console.error('Failed to create chain:', e)
  }
}

async function joinChain(chainId: number) {
  const word = joinWords[chainId]
  if (!word) return

  try {
    await api(`/api/chains/${chainId}/join`, {
      method: 'POST',
      body: { word }
    })
    joinWords[chainId] = ''
    
    // 刷新接龙数据
    const data = await api(`/api/chains/${chainId}`)
    chainEntries[chainId] = data.entries
    
    // 更新列表中的当前词语
    const chain = chains.value.find(c => c.id === chainId)
    if (chain) {
      chain.current_word = word
      chain.entry_count++
    }

    emit('join', { chainId, word })
  } catch (e) {
    console.error('Failed to join chain:', e)
    alert(e instanceof Error ? e.message : '加入失败')
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadChains()

  const socket = getSocket()
  if (socket) {
    socket.on('chain_update', (data: { chainId: number; word: string; username: string }) => {
      const chain = chains.value.find(c => c.id === data.chainId)
      if (chain) {
        chain.current_word = data.word
        chain.entry_count++
      }
      if (expandedChains.value.includes(data.chainId)) {
        if (chainEntries[data.chainId]) {
          chainEntries[data.chainId].push({
            id: Date.now(),
            chain_id: data.chainId,
            word: data.word,
            username: data.username,
            created_at: new Date().toISOString()
          })
        }
      }
    })
  }
})
</script>
