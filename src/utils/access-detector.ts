/**
 * Access mode detection utilities
 * Used to determine if the app is accessed via local IP proxy or direct URL
 */

import { CookieStore } from './CookieStore';

/**
 * Known local IP patterns to detect direct access
 */
const LOCAL_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^::ffff:127\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /\.local$/i,
  /^0\.0\.0\.0$/
];

/**
 * GitHub Pages default domain
 */
const GITHUB_PAGES_DOMAINS = ['github.io', 'github.com', 'gitlab.io', 'vercel.app', 'netlify.app'];

/**
 * Check if hostname matches any local IP pattern
 */
function isLocalHostname(hostname: string): boolean {
  return LOCAL_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Check if hostname is a known static hosting domain
 */
function isStaticHostingDomain(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return GITHUB_PAGES_DOMAINS.some((domain) => lower.includes(domain));
}

/**
 * Access mode enumeration
 */
export type AccessMode = 'local' | 'direct' | 'unknown';

/**
 * Detect how the user is accessing the application
 */
export function detectAccessMode(): AccessMode {
  const hostname = window.location.hostname;

  // Check stored preference first
  const storedMode = CookieStore.get('accessMode');
  if (storedMode === 'local' || storedMode === 'direct') {
    return storedMode;
  }

  // Check if accessed via local IP/proxy
  if (isLocalHostname(hostname)) {
    CookieStore.set('accessMode', 'local');
    return 'local';
  }

  // Check if accessed via static hosting domain
  if (isStaticHostingDomain(hostname)) {
    // Verify if it's actually being proxied (check for proxy headers or session)
    const viaProxy = sessionStorage.getItem('viaProxy');
    if (viaProxy === 'true') {
      CookieStore.set('accessMode', 'local');
      return 'local';
    }
    CookieStore.set('accessMode', 'direct');
    return 'direct';
  }

  // Unknown - could be local network or custom domain
  return 'unknown';
}

/**
 * Check if the current access mode requires a proxy connection
 */
export function requiresProxyConnection(): boolean {
  const mode = detectAccessMode();
  return mode === 'local' || mode === 'unknown';
}

/**
 * Get the appropriate WebSocket URL based on access mode
 */
export function getWebSocketUrl(): string {
  if (requiresProxyConnection()) {
    // When accessed via proxy, connect to the proxy server
    return `ws://${window.location.hostname}:8765`;
  }

  // For direct access, could be local dev server
  return `ws://localhost:8765`;
}

/**
 * Mark that the user is accessing via proxy
 * Called by the proxy server when serving the app
 */
export function markAsViaProxy(): void {
  sessionStorage.setItem('viaProxy', 'true');
  CookieStore.set('accessMode', 'local');
}
