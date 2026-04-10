<script setup lang="ts">
import { computed } from 'vue';

// Use Vue's global t function from i18next-vue plugin
const title = computed(() => (window as unknown as { $t: (key: string) => string }).$t?.('generic.accessWarning.title') ?? 'Access Via Device IP');
const message = computed(() => (window as unknown as { $t: (key: string) => string }).$t?.('generic.accessWarning.message') ?? 'You are accessing this admin interface directly. For full functionality, please access this site through your Pixelrunner device\'s local IP address.');
const instruction = computed(() => (window as unknown as { $t: (key: string) => string }).$t?.('generic.accessWarning.instruction') ?? 'Find your device\'s IP address in your router\'s connected devices list, then access this admin interface via: http://[device-ip]');
</script>

<template>
  <Teleport to="body">
    <div class="component--access-warning">
      <div class="access-warning__overlay"></div>
      <div class="access-warning__content">
        <div class="access-warning__icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 class="access-warning__title">{{ title }}</h2>
        <p class="access-warning__message">{{ message }}</p>
        <p class="access-warning__instruction">{{ instruction }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.component--access-warning {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.access-warning__overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.9);
}

.access-warning__content {
  position: relative;
  max-width: 480px;
  padding: 2rem;
  text-align: center;
  color: #fff;
}

.access-warning__icon {
  color: #f59e0b;
  margin-bottom: 1.5rem;
}

.access-warning__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.access-warning__message {
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 1rem;
  opacity: 0.9;
}

.access-warning__instruction {
  font-size: 1rem;
  line-height: 1.6;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}
</style>
