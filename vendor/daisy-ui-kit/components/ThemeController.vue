<script setup lang="ts">
import type { DaisyThemeInput } from '../composables/use-daisy-theme'
import { computed } from 'vue'
import { useDaisyTheme } from '../composables/use-daisy-theme'

const props = defineProps<{
  /**
   * Optional: List of themes to provide (string or DaisyThemeMeta)
   */
  themes?: DaisyThemeInput[]
  /**
   * Optional: Default theme name (string or 'default')
   */
  defaultTheme?: string
  /**
   * Optional: Storage function for persistence (e.g., useCookie, useLocalStorage, or ref)
   */
  storage?: <T>(key: string, initial: T) => import('vue').Ref<T>
}>()

const themeOptions =
  props.themes || props.defaultTheme ? { themes: props.themes || [], defaultTheme: props.defaultTheme } : undefined

const { theme, effectiveTheme, themes, setTheme, cycleTheme, registerTheme, removeTheme } = useDaisyTheme(
  props.storage,
  themeOptions,
)

const availableThemes = computed(() => themes.value.map(t => (typeof t === 'string' ? t : t.theme)))
</script>

<template>
  <div class="theme-controller">
    <slot
      :theme="theme"
      :effective-theme="effectiveTheme"
      :themes="themes"
      :available-themes="availableThemes"
      :set-theme="setTheme"
      :cycle-theme="cycleTheme"
      :register-theme="registerTheme"
      :remove-theme="removeTheme"
    />
  </div>
</template>
