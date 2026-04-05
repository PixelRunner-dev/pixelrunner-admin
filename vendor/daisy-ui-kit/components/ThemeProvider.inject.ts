import type { ComputedRef, InjectionKey } from 'vue'

export interface ThemeVarsSlot {
  vars: Record<string, string>
  toThemeString: (attrs?: Record<string, string>, opts?: { asPlugin?: boolean }) => string
}

export type ComputedThemeVarsSlot = ComputedRef<ThemeVarsSlot>

export const daisyUiThemeKey: InjectionKey<ComputedThemeVarsSlot> = Symbol('daisyUiTheme')
