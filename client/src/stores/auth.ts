import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../composables/useApi'

interface User {
  id: number
  username: string
  avatar: string
  is_admin: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(username: string, password: string) {
    const response = await api('/api/auth/login', {
      method: 'POST',
      body: { username, password }
    })
    
    token.value = response.token
    user.value = response.user
    localStorage.setItem('token', response.token)
    
    return response
  }

  async function register(username: string, password: string) {
    const response = await api('/api/auth/register', {
      method: 'POST',
      body: { username, password }
    })
    
    token.value = response.token
    user.value = response.user
    localStorage.setItem('token', response.token)
    
    return response
  }

  async function fetchUser() {
    if (!token.value) return null
    
    try {
      const response = await api('/api/users/me/profile')
      user.value = response.user
      return response.user
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  // 初始化时恢复用户状态
  if (token.value) {
    fetchUser()
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout
  }
})
