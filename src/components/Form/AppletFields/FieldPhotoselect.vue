<script setup lang="ts">
import { ref, watch } from 'vue';

import AppletImage from '@/components/Applet/AppletImage.vue';

import {
  FileInput as DFileInput,
  Flex as DFlex,
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
}

const { id }: Props = defineProps<Props>();

const file = ref();

function onChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const chosenFile = target.files?.[0] || null;
  if (chosenFile) {
    const reader = new FileReader();

    // Convert the file to Base64
    reader.onload = function(e) {
      const originalBase64 = e.target?.result as string;

      // Create an image to get natural dimensions
      const img = new Image();
      img.onload = function() {
        // Create off-screen canvas at target size
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image resized to 64x32
          ctx.drawImage(img, 0, 0, 64, 32);

          // Export as Base64 (using PNG for lossless, or quality-adjusted JPEG)
          const resizedBase64 = canvas.toDataURL('image/png');
          const sizeInKb = ((Math.ceil((resizedBase64.length - 22) * 3 / 4)) / 1024).toFixed(2);
          console.log('File size:', sizeInKb, 'KB');
          file.value = resizedBase64;
        }
      };
      img.src = originalBase64;
    };

    // Read the file as a data URL
    reader.readAsDataURL(chosenFile);
  }
}

const emit = defineEmits<{
  'update:modelValue': [value: File | null];
}>();

watch(file, (newFile) => {
  emit('update:modelValue', newFile);
});
</script>

<template>
<div class="component--field-photo-select">
  <DFlex col class="gap-2">
    <DFileInput v-model="file" :id accept="image/*" max-size="2097152" @change="onChange" />
    <figure class="w-80">
      <AppletImage v-if="file" :src="file" alt="Example image" :dateCreated="new Date()" />
    </figure>
  </DFlex>
</div>
</template>
