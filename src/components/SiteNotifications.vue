<script setup lang="ts">
import { Alert as DAlert, Button as DButton, Text as DText } from '(vendor)/daisy-ui-kit/index.ts';

import type { Notification } from '@/utils/notifications.ts';

defineProps<{
  notifications: Notification[];
}>();
</script>

<template>
  <div v-if="notifications.length" class="site-wrapper my-8">
    <div v-for="notification in notifications" :key="notification.message" class="my-4">
      <DAlert :type="notification.type" role="alert" horizontal>
        <DText>
          {{ notification.message }}
        </DText>
        <DButton
          v-if="notification.actionLabel && notification.onAction"
          type="button"
          sm
          @click="notification.onAction"
        >
          {{ notification.actionLabel }}
        </DButton>
      </DAlert>
    </div>
  </div>
</template>
