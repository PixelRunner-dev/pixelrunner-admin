// ESM shim for the 'debug' package (CJS-only).
// micromark's dev build does `import createDebug from 'debug'` which fails
// when Vite serves the raw CJS file as ESM in the browser.
// This provides a no-op replacement for client-side use.
function debug() {
  return function noop() {}
}
debug.enable = function () {}
debug.disable = function () {}
debug.enabled = function () { return false }
debug.log = function () {}
debug.formatArgs = function () {}
debug.save = function () {}
debug.load = function () { return undefined }
debug.useColors = function () { return false }
debug.destroy = function () {}
debug.colors = []
debug.names = []
debug.skips = []
debug.formatters = {}

export default debug
export { debug }
