<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

import {
  Button as DButton,
  Flex as DFlex,
  Text as DText
} from '(vendor)/daisy-ui-kit/index.ts';

interface Props {
  id: string;
  name: string;
  client_id: string;
  authorization_endpoint: `https://${string}`;
  scopes: string[];
  handler: string;
}

const props = defineProps<Props>();

const modelValue = defineModel<string>();

// Reactive state
const isConnected = ref(false);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

// Store popup reference and check interval
let oauthPopup: Window | null = null;
let popupCheckInterval: ReturnType<typeof setInterval> | null = null;
let messageHandler: ((event: MessageEvent) => void) | null = null;

// Watch for external changes to modelValue (e.g., when form is pre-filled)
watch(
  () => modelValue.value,
  (newValue: string | undefined) => {
    isConnected.value = !!newValue && newValue.length > 0;
  },
  { immediate: true }
);

/**
 * Detect if the user is on a mobile device
 */
function isMobileDevice(): boolean {
  const ua = navigator.userAgent || navigator.vendor;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|WPDesktop/i.test(ua);
}

/**
 * Detect if popup was likely blocked by the browser
 */
function wasPopupBlocked(popup: Window | null): boolean {
  return !popup || popup.closed || typeof popup.closed === 'undefined';
}

/**
 * Generate a cryptographically secure random state string for CSRF protection
 */
function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Try to open OAuth popup window
 */
function tryOpenPopup(): Window | null {
  // Generate state for CSRF protection
  const state = generateState();

  // Build the OAuth authorization URL using implicit flow
  const authUrl = new URL(props.authorization_endpoint);
  authUrl.searchParams.set('client_id', props.client_id);
  authUrl.searchParams.set('scope', props.scopes.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');
  // authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('redirect_uri', 'about:blank');
  // authUrl.searchParams.set('redirect_uri', 'https://appauth.tidbyt.com:/spotify');

  // Store state in sessionStorage for validation when callback comes
  sessionStorage.setItem(`oauth_state_${props.id}`, state);

  // Calculate centered popup position
  const popupWidth = 600;
  const popupHeight = 700;
  const left = Math.round((window.innerWidth - popupWidth) / 2) + window.screenX;
  const top = Math.round((window.innerHeight - popupHeight) / 2) + window.screenY;

  return window.open(
    authUrl.toString(),
    `oauth2-popup-${props.id}`,
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
  );
}

/**
 * Start OAuth flow - tries popup first, falls back to Trystero on mobile/blocked
 */
function startOAuthFlow(): void {
  errorMessage.value = null;

  // On mobile, skip popup and use Trystero fallback directly
  if (isMobileDevice()) {
    startTrysteroOAuthFlow();
    return;
  }

  // Try popup flow first (works on desktop)
  const popup = tryOpenPopup();

  if (wasPopupBlocked(popup)) {
    // Popup was blocked, fall back to Trystero flow
    console.warn('Popup blocked, falling back to Trystero-based OAuth');
    startTrysteroOAuthFlow();
    return;
  }

  oauthPopup = popup;
  isLoading.value = true;

  // Set up message handler
  messageHandler = handleOAuthMessage;
  window.addEventListener('message', messageHandler);

  // Poll to check if popup was closed by user
  popupCheckInterval = setInterval(() => {
    if (oauthPopup?.closed) {
      cleanup();
      isLoading.value = false;
    }
  }, 500);
}

/**
 * Start Trystero-based OAuth flow (fallback for mobile/popup blocked)
 *
 * This sends an OAuth request to the device via Trystero, which:
 * 1. Opens the OAuth flow locally on the device
 * 2. Returns the token via Trystero back to this component
 */
async function startTrysteroOAuthFlow(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    // TODO: Implement Trystero-based OAuth request
    // This would use the existing Trystero connection to send a request
    // to the device to start the OAuth flow, then receive the token back

    // Placeholder for Trystero implementation
    console.log('Using Trystero-based OAuth flow');

    // For now, show an error that this feature is not yet implemented
    errorMessage.value = 'OAuth via Trystero is not yet implemented. Please allow popups for this site.';
    isLoading.value = false;
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to start OAuth flow';
    isLoading.value = false;
  }
}

/**
 * Handle OAuth response messages from the popup or Trystero
 */
function handleOAuthMessage(event: MessageEvent): void {
  // Accept messages from any origin since popup is about:blank
  const data = event.data;

  if (data && typeof data === 'object') {
    if (data.type === 'oauth_token') {
      const token = data.token as string;

      // Validate state if provided
      const storedState = sessionStorage.getItem(`oauth_state_${props.id}`);
      if (data.state && data.state !== storedState) {
        errorMessage.value = 'OAuth state mismatch - possible CSRF attack';
        cleanup();
        return;
      }

      if (token && token.length > 0) {
        modelValue.value = token;
        isConnected.value = true;
        isLoading.value = false;
      }
    } else if (data.type === 'oauth_error') {
      errorMessage.value = (data.error as string) || 'OAuth authentication failed';
      isLoading.value = false;
    }
  }

  cleanup();
}

/**
 * Disconnect and clear the token
 */
function disconnect(): void {
  isConnected.value = false;
  modelValue.value = '';
  sessionStorage.removeItem(`oauth_state_${props.id}`);
}

/**
 * Clean up listeners and intervals
 */
function cleanup(): void {
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval);
    popupCheckInterval = null;
  }

  if (oauthPopup && !oauthPopup.closed) {
    oauthPopup.close();
    oauthPopup = null;
  }

  if (messageHandler) {
    window.removeEventListener('message', messageHandler);
    messageHandler = null;
  }

  isLoading.value = false;
}

// Cleanup on component unmount
onUnmounted(() => {
  cleanup();
});
</script>

<template>
<div class="component--field-oauth2">
  <DFlex class="gap-2">
    <DButton
      :dash="isConnected"
      :outline="!isConnected"
      :loading="isLoading"
      @click="isConnected ? disconnect() : startOAuthFlow()"
    >
      {{ isConnected ? 'Disconnect' : 'Connect' }}
    </DButton>
    <DText v-if="errorMessage" class="has-text-danger" size="sm">
      {{ errorMessage }}
    </DText>
  </DFlex>
</div>
</template>
