<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="card p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">故事小站</h1>
        <p class="text-gray-400 mt-2">Create Your Account</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">用户名</label>
          <input
            v-model="username"
            type="text"
            class="input"
            placeholder="3-20个字符"
            required
            minlength="3"
            maxlength="20"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">密码</label>
          <input
            v-model="password"
            type="password"
            class="input"
            placeholder="至少6个字符"
            required
            minlength="6"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="input"
            placeholder="再次输入密码"
            required
          />
        </div>

        <div v-if="error" class="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
          {{ error }}
        </div>

        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <p class="text-center text-gray-400 mt-6">
        已有账号？
        <router-link to="/login" class="text-primary-400 hover:text-primary-300">
          登录
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.register(username.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : '注册失败'
  } finally {
    loading.value = false
  }
}
</script>
