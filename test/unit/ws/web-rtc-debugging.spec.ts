import { afterEach, describe, expect, it, vi } from 'vitest';

const originalPeerConnection = window.RTCPeerConnection;

afterEach(() => {
  vi.resetModules();
  Object.defineProperty(window, 'RTCPeerConnection', {
    configurable: true,
    value: originalPeerConnection,
    writable: true
  });
});

describe('installWebRtcDebugging', () => {
  it('does nothing when RTCPeerConnection is unavailable', async () => {
    Object.defineProperty(window, 'RTCPeerConnection', {
      configurable: true,
      value: undefined,
      writable: true
    });
    const { installWebRtcDebugging } = await import('@/ws/web-rtc-debugging');

    expect(installWebRtcDebugging()).toBe(false);
  });

  it('wraps RTCPeerConnection and redacts ICE credentials', async () => {
    class NativePeerConnection extends EventTarget {
      readonly connectionState = 'new';
      readonly iceConnectionState = 'new';
      readonly iceGatheringState = 'new';
      readonly signalingState = 'stable';
      readonly localDescription = null;
      readonly remoteDescription = null;

      constructor(readonly configuration?: RTCConfiguration) {
        super();
      }

      createDataChannel(): RTCDataChannel {
        return new EventTarget() as RTCDataChannel;
      }

      async createOffer(): Promise<RTCSessionDescriptionInit> {
        return { type: 'offer', sdp: 'sdp' };
      }

      async createAnswer(): Promise<RTCSessionDescriptionInit> {
        return { type: 'answer', sdp: 'sdp' };
      }

      async setLocalDescription(): Promise<void> {}

      async setRemoteDescription(): Promise<void> {}

      async addIceCandidate(): Promise<void> {}
    }

    Object.defineProperty(window, 'RTCPeerConnection', {
      configurable: true,
      value: NativePeerConnection,
      writable: true
    });

    const logDebug = vi.fn();
    const { installWebRtcDebugging } = await import('@/ws/web-rtc-debugging');

    expect(installWebRtcDebugging({ logDebug })).toBe(true);
    expect(installWebRtcDebugging({ logDebug })).toBe(false);

    new window.RTCPeerConnection({
      iceServers: [{ urls: 'stun:example.test', username: 'user', credential: 'secret' }]
    });

    expect(logDebug).toHaveBeenCalledWith(
      '[trystero-client] RTCPeerConnection created:',
      expect.objectContaining({
        iceServers: [
          {
            urls: 'stun:example.test',
            username: '[set]',
            credential: '[set]'
          }
        ]
      })
    );
  });
});
