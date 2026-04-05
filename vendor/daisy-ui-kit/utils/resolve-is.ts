import { resolveComponent } from 'vue'

/**
 * Resolves the `is` prop value for render functions.
 * Must be called inside a setup() or render function context.
 *
 * If `is` is already a component object, returns it directly.
 * If `is` is a PascalCase string, tries resolveComponent().
 * Otherwise returns the string as-is (treated as HTML tag).
 */
export function resolveIs(is: string | object): any {
  if (typeof is !== 'string') return is
  // PascalCase — try to resolve as a registered component
  if (/^[A-Z]/.test(is)) {
    const resolved = resolveComponent(is)
    if (typeof resolved !== 'string') return resolved
  }
  return is
}
