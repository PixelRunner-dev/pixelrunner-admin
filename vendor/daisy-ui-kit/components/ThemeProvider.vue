<script setup lang="ts">
import type { ComputedThemeVarsSlot } from './ThemeProvider.inject.js'
import { computed, nextTick, onUnmounted, provide, ref, watch } from 'vue'
import { daisyUiThemeKey } from './ThemeProvider.inject.js'

const props = defineProps<{
  /**
   * DaisyUI theme string (recommended prop name)
   */
  dataTheme?: string

  cssVars?: string
  snoop?: boolean
}>()

function cssVarToCamel(str: string): string {
  return str.replace(/^--/, '').replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}
function dataAttrToCamel(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}
function parseThemeString(themeString?: string): {
  style: Record<string, string>
  dataAttrs: Record<string, string>
  dataTheme: string | undefined
  allAttrs: Record<string, string>
} {
  if (!themeString) {
    return { style: {}, dataAttrs: {}, dataTheme: undefined, allAttrs: {} }
  }
  const varNamePattern = /^--[\w-]+$/
  const attrNamePattern = /^[a-z_][\w-]*$/i
  const forbiddenChars = /[<>{};]/g

  const style: Record<string, string> = {}
  const dataAttrs: Record<string, string> = {}
  let dataTheme: string | undefined
  const allAttrs: Record<string, string> = {}

  // Remove @plugin ... { and closing } if present
  const str = themeString
    .trim()
    .replace(/^@plugin[^{}]*\{/, '')
    .replace(/\}$/, '')
    .trim()

  // works with or without newline characters
  str.split(/[\n;]/).forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) {
      return
    }
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) {
      return
    }
    const key = trimmed.slice(0, colonIdx).trim()
    let value = trimmed.slice(colonIdx + 1).trim()
    if (value.endsWith(';')) {
      value = value.slice(0, -1).trim()
    }
    value = value.replace(forbiddenChars, '')
    if (!value) {
      return
    }
    if (varNamePattern.test(key)) {
      style[key] = value
      allAttrs[cssVarToCamel(key)] = value
    } else if (key === 'name') {
      dataTheme = value.replace(/"/g, '')
      allAttrs.dataTheme = dataTheme
    } else if (attrNamePattern.test(key)) {
      const attrKey = `data-${key.replace(/[^\w-]/g, '')}`
      const attrVal = value.replace(/"/g, '')
      dataAttrs[attrKey] = attrVal
      if (attrKey.startsWith('data-')) {
        allAttrs[dataAttrToCamel(attrKey)] = attrVal
      }
    }
  })
  return { style, dataAttrs, dataTheme, allAttrs }
}

const parsed = computed(() => parseThemeString(props.dataTheme ?? props.cssVars))

const themeVars = ref<Record<string, string>>({})
let observers: MutationObserver[] = []
let themeControllerInputs: Array<{ el: HTMLInputElement; listener: () => void }> = []
let themeControllerDomObserver: MutationObserver | null = null

// Converts a themeAttrs object to a DaisyUI theme string
function toThemeString(attrs: Record<string, string>, opts?: { asPlugin?: boolean }) {
  const lines: string[] = []
  // Map camelCase back to DaisyUI keys
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'dataTheme') {
      lines.push(`name: "${value}";`)
    } else if (key.startsWith('data')) {
      // Convert dataFooBar -> foo-bar
      const attr = key
        .slice(4)
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
      if (attr !== 'theme') {
        lines.push(`${attr}: ${value};`)
      }
    } else {
      // Convert camelCase to --kebab-case
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      lines.push(`${cssVar}: ${value};`)
    }
  }
  const inner = lines.join('\n')
  if (opts?.asPlugin) {
    return `@plugin \"daisyui/theme\" {\n${inner}\n}`
  }
  return inner
}

// Returns the slot data object depending on snoop mode
const slotData: ComputedThemeVarsSlot = computed(() => {
  // Access both dependencies so Vue always tracks them for reactivity
  void themeVars.value
  void parsed.value.allAttrs
  if (props.snoop) {
    return {
      vars: themeVars.value,
      toThemeString: (attrs = themeVars.value, opts) => toThemeString(attrs, opts),
    }
  }
  return {
    vars: parsed.value.allAttrs,
    toThemeString: (attrs = parsed.value.allAttrs, opts) => toThemeString(attrs, opts),
  }
})

// Provide the slotData as 'daisyUiTheme' for child consumers
provide(daisyUiThemeKey, slotData)

// DaisyUI variable names
const daisyVars = [
  '--color-primary',
  '--color-primary-content',
  '--color-secondary',
  '--color-secondary-content',
  '--color-accent',
  '--color-accent-content',
  '--color-neutral',
  '--color-neutral-content',
  '--color-base-100',
  '--color-base-200',
  '--color-base-300',
  '--color-base-content',
  '--color-info',
  '--color-info-content',
  '--color-success',
  '--color-success-content',
  '--color-warning',
  '--color-warning-content',
  '--color-error',
  '--color-error-content',
  '--radius-selector',
  '--radius-field',
  '--radius-box',
  '--size-selector',
  '--size-field',
  '--border',
  '--depth',
  '--noise',
]

function getDaisyVarsFromEl(el: HTMLElement): Record<string, string> {
  const vars: Record<string, string> = {}
  const style = getComputedStyle(el)
  for (const varName of daisyVars) {
    const val = style.getPropertyValue(varName)
    if (val) {
      vars[cssVarToCamel(varName)] = val.trim()
    }
  }
  return vars
}

let prefersColorSchemeMql: MediaQueryList | null = null
let prefersColorSchemeCleanup: (() => void) | null = null

function setupSnoop(rootEl: HTMLElement): void {
  function updateVars(): void {
    themeVars.value = getDaisyVarsFromEl(rootEl)
  }
  // Observe the current element for data-theme changes
  const obs = new MutationObserver(() => updateVars())
  obs.observe(rootEl, { attributes: true, attributeFilter: ['data-theme'] })

  // Also observe the <html> element for data-theme changes
  const htmlEl = document.documentElement
  const htmlObs = new MutationObserver(() => updateVars())
  htmlObs.observe(htmlEl, { attributes: true, attributeFilter: ['data-theme'] })

  observers = [obs, htmlObs]

  // Listen for prefers-color-scheme changes
  prefersColorSchemeMql = window.matchMedia('(prefers-color-scheme: dark)')
  const prefersColorSchemeListener = () => updateVars()
  prefersColorSchemeMql.addEventListener('change', prefersColorSchemeListener)
  prefersColorSchemeCleanup = () => {
    prefersColorSchemeMql?.removeEventListener('change', prefersColorSchemeListener)
  }

  // --- Observe theme-controller checkboxes/radios, including dynamic changes ---
  function bindThemeControllerInputs() {
    // Remove any previous listeners
    themeControllerInputs.forEach(({ el, listener }) => {
      el.removeEventListener('change', listener)
    })
    themeControllerInputs = []
    // Find all matching inputs in the document
    const inputs = Array.from(
      document.querySelectorAll('input[type="checkbox"].theme-controller, input[type="radio"].theme-controller'),
    ) as HTMLInputElement[]
    inputs.forEach(el => {
      const listener = () => updateVars()
      el.addEventListener('change', listener)
      themeControllerInputs.push({ el, listener })
    })
  }
  bindThemeControllerInputs()
  // Observe DOM for dynamic addition/removal of theme-controller inputs
  if (themeControllerDomObserver) {
    themeControllerDomObserver.disconnect()
    themeControllerDomObserver = null
  }
  themeControllerDomObserver = new MutationObserver(() => {
    bindThemeControllerInputs()
  })
  themeControllerDomObserver.observe(document.body, { childList: true, subtree: true })

  // Watch for applied style changes (parsed.style)
  watch(
    () => parsed.value.style,
    () => {
      nextTick(() => updateVars())
    },
    { immediate: false, deep: true },
  )
  updateVars()
}

const rootEl = ref<HTMLElement | null>(null)

const isClient = typeof window !== 'undefined' && typeof document !== 'undefined'

watch(
  [() => props.snoop, () => rootEl.value],
  ([snoop, el]) => {
    if (isClient) {
      // Clean up previous observers if any
      observers.forEach((o: MutationObserver) => o.disconnect())
      observers = []
      if (snoop && el) {
        nextTick(() => {
          setupSnoop(el)
        })
      }
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  observers.forEach((o: MutationObserver) => o.disconnect())
  observers = []
  // Remove prefers-color-scheme listener if present
  if (prefersColorSchemeCleanup) {
    prefersColorSchemeCleanup()
    prefersColorSchemeCleanup = null
    prefersColorSchemeMql = null
  }
  // Remove theme-controller listeners
  themeControllerInputs.forEach(({ el, listener }) => {
    el.removeEventListener('change', listener)
  })
  themeControllerInputs = []
  // Disconnect theme-controller DOM observer
  if (themeControllerDomObserver) {
    themeControllerDomObserver.disconnect()
    themeControllerDomObserver = null
  }
})
</script>

<template>
  <div
    ref="rootEl"
    v-bind="parsed.dataAttrs"
    :data-theme="dataTheme"
    :style="parsed.style"
    class="[background-color:unset] theme-provider"
  >
    <slot v-bind="slotData" />
  </div>
</template>
