<template>
  <div class="passcode-page">
    <div class="passcode-card">
      <div class="logo-area">
        <div class="logo-icon">⚡</div>
        <h1>QueryExport</h1>
        <p class="subtitle">Enter your access code to continue</p>
      </div>
      <form @submit.prevent="handleSubmit" class="passcode-form">
        <div class="input-group" :class="{ error: errorMsg, shake: shaking }">
          <input
            ref="inputRef"
            v-model="code"
            type="password"
            placeholder="Access Code"
            autocomplete="off"
            maxlength="50"
          />
          <button type="submit" :disabled="!code.trim()">
            <span class="arrow">→</span>
          </button>
        </div>
        <transition name="fade">
          <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>
        </transition>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PASSCODE } from '../config/passcode.js'

const router = useRouter()
const code = ref('')
const errorMsg = ref('')
const shaking = ref(false)
const inputRef = ref(null)

onMounted(() => {
  if (sessionStorage.getItem('qe_authenticated') === 'true') {
    router.replace('/dashboard')
    return
  }
  inputRef.value?.focus()
})

function handleSubmit() {
  if (code.value.trim() === PASSCODE) {
    sessionStorage.setItem('qe_authenticated', 'true')
    router.push('/dashboard')
  } else {
    errorMsg.value = 'Incorrect access code'
    shaking.value = true
    setTimeout(() => {
      shaking.value = false
    }, 500)
    code.value = ''
    inputRef.value?.focus()
  }
}
</script>

<style scoped>
.passcode-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 50%, #f0f4f8 100%);
  padding: 1rem;
}

.passcode-card {
  background: #ffffff;
  backdrop-filter: blur(20px);
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08);
}

.logo-area {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.logo-area h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  color: #1e293b;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.input-group.error input {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.input-group button {
  padding: 0.875rem 1.25rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.input-group button:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.input-group button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.error-text {
  color: #dc2626;
  font-size: 0.85rem;
  margin: 0.75rem 0 0;
  text-align: center;
}

.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(6px); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
