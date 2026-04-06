import { io, Socket } from 'socket.io-client'
import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'

let socket: Socket | null = null
const connected = ref(false)

export function useSocket() {
  const authStore = useAuthStore()

  function connect() {
    if (socket?.connected) return socket

    const token = authStore.token
    if (!token) {
      console.error('No token available')
      return null
    }

    socket = io({
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      connected.value = true
      console.log('Socket connected')
    })

    socket.on('disconnect', () => {
      connected.value = false
      console.log('Socket disconnected')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    return socket
  }

  function disconnect() {
    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }
  }

  function getSocket() {
    return socket
  }

  onUnmounted(() => {
    // 不在这里断开连接，让它保持活跃
  })

  return {
    connect,
    disconnect,
    getSocket,
    connected
  }
}
