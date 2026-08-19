let webRtcDebugInstalled = false;

type WebRtcDebugLogger = (...args: unknown[]) => void;

export interface WebRtcDebugOptions {
  logDebug?: WebRtcDebugLogger;
  logError?: WebRtcDebugLogger;
}

export function installWebRtcDebugging({
  logDebug = console.debug,
  logError = console.error
}: WebRtcDebugOptions = {}): boolean {
  if (
    webRtcDebugInstalled ||
    typeof window === 'undefined' ||
    typeof window.RTCPeerConnection === 'undefined'
  ) {
    return false;
  }

  const NativePeerConnection = window.RTCPeerConnection;

  class DebugPeerConnection extends NativePeerConnection {
    constructor(configuration?: RTCConfiguration) {
      logDebug('[trystero-client] RTCPeerConnection created:', {
        ...configuration,
        iceServers: configuration?.iceServers?.map((server) => ({
          urls: server.urls,
          username: server.username ? '[set]' : undefined,
          credential: server.credential ? '[set]' : undefined
        }))
      });
      super(configuration);

      this.addEventListener('connectionstatechange', () => {
        logDebug('[trystero-client] RTCPeerConnection connectionState:', this.connectionState);
      });

      this.addEventListener('iceconnectionstatechange', () => {
        logDebug(
          '[trystero-client] RTCPeerConnection iceConnectionState:',
          this.iceConnectionState
        );
      });

      this.addEventListener('icegatheringstatechange', () => {
        logDebug('[trystero-client] RTCPeerConnection iceGatheringState:', this.iceGatheringState);
      });

      this.addEventListener('signalingstatechange', () => {
        logDebug('[trystero-client] RTCPeerConnection signalingState:', this.signalingState);
      });

      this.addEventListener('icecandidateerror', (event) => {
        logError('[trystero-client] RTCPeerConnection icecandidateerror:', event);
      });

      this.addEventListener('icecandidate', (event) => {
        logDebug(
          '[trystero-client] RTCPeerConnection icecandidate:',
          event.candidate?.candidate ?? null
        );
      });
    }

    createDataChannel(label: string, dataChannelDict?: RTCDataChannelInit): RTCDataChannel {
      logDebug('[trystero-client] createDataChannel:', label, dataChannelDict);
      const channel = super.createDataChannel(label, dataChannelDict);
      channel.addEventListener('open', () => {
        logDebug('[trystero-client] datachannel open:', label);
      });
      channel.addEventListener('close', () => {
        logDebug('[trystero-client] datachannel close:', label);
      });
      channel.addEventListener('error', (event) => {
        logError('[trystero-client] datachannel error:', label, event);
      });
      return channel;
    }

    createOffer(options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    createOffer(
      successCallback: RTCSessionDescriptionCallback,
      failureCallback: RTCPeerConnectionErrorCallback,
      options?: RTCOfferOptions
    ): Promise<void>;
    async createOffer(
      optionsOrSuccessCallback?: RTCOfferOptions | RTCSessionDescriptionCallback,
      failureCallback?: RTCPeerConnectionErrorCallback,
      options?: RTCOfferOptions
    ): Promise<RTCSessionDescriptionInit | void> {
      if (typeof optionsOrSuccessCallback === 'function') {
        logDebug('[trystero-client] createOffer called with callbacks:', options);
        return super.createOffer(
          optionsOrSuccessCallback as RTCSessionDescriptionCallback,
          failureCallback!,
          options
        );
      }

      logDebug('[trystero-client] createOffer called:', optionsOrSuccessCallback);
      try {
        const offer = await super.createOffer(optionsOrSuccessCallback);
        logDebug('[trystero-client] createOffer resolved:', {
          type: offer.type,
          sdpLength: offer.sdp?.length ?? 0
        });
        return offer;
      } catch (error) {
        logError('[trystero-client] createOffer failed:', error);
        throw error;
      }
    }

    createAnswer(options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit>;
    createAnswer(
      successCallback: RTCSessionDescriptionCallback,
      failureCallback: RTCPeerConnectionErrorCallback
    ): Promise<void>;
    async createAnswer(
      optionsOrSuccessCallback?: RTCAnswerOptions | RTCSessionDescriptionCallback,
      failureCallback?: RTCPeerConnectionErrorCallback
    ): Promise<RTCSessionDescriptionInit | void> {
      if (typeof optionsOrSuccessCallback === 'function') {
        logDebug('[trystero-client] createAnswer called with callbacks');
        return super.createAnswer(
          optionsOrSuccessCallback as RTCSessionDescriptionCallback,
          failureCallback!
        );
      }

      logDebug('[trystero-client] createAnswer called:', optionsOrSuccessCallback);
      try {
        const answer = await super.createAnswer(optionsOrSuccessCallback);
        logDebug('[trystero-client] createAnswer resolved:', {
          type: answer.type,
          sdpLength: answer.sdp?.length ?? 0
        });
        return answer;
      } catch (error) {
        logError('[trystero-client] createAnswer failed:', error);
        throw error;
      }
    }

    async setLocalDescription(description?: RTCLocalSessionDescriptionInit): Promise<void> {
      logDebug('[trystero-client] setLocalDescription called:', {
        type: description?.type,
        sdpLength: description?.sdp?.length ?? 0
      });
      try {
        await super.setLocalDescription(description);
        logDebug('[trystero-client] setLocalDescription resolved:', {
          type: this.localDescription?.type,
          sdpLength: this.localDescription?.sdp?.length ?? 0
        });
      } catch (error) {
        logError('[trystero-client] setLocalDescription failed:', error);
        throw error;
      }
    }

    async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
      logDebug('[trystero-client] setRemoteDescription called:', {
        type: description.type,
        sdpLength: description.sdp?.length ?? 0
      });
      try {
        await super.setRemoteDescription(description);
        logDebug('[trystero-client] setRemoteDescription resolved:', {
          type: this.remoteDescription?.type,
          sdpLength: this.remoteDescription?.sdp?.length ?? 0
        });
      } catch (error) {
        logError('[trystero-client] setRemoteDescription failed:', error);
        throw error;
      }
    }

    addIceCandidate(candidate?: RTCIceCandidateInit | null): Promise<void>;
    addIceCandidate(
      candidate: RTCIceCandidateInit | null,
      successCallback: VoidFunction,
      failureCallback: RTCPeerConnectionErrorCallback
    ): Promise<void>;
    async addIceCandidate(
      candidate?: RTCIceCandidateInit | null,
      successCallback?: VoidFunction,
      failureCallback?: RTCPeerConnectionErrorCallback
    ): Promise<void> {
      logDebug('[trystero-client] addIceCandidate called:', candidate?.candidate ?? null);
      try {
        if (successCallback && failureCallback) {
          await super.addIceCandidate(candidate ?? null, successCallback, failureCallback);
        } else {
          await super.addIceCandidate(candidate);
        }
        logDebug('[trystero-client] addIceCandidate resolved');
      } catch (error) {
        logError('[trystero-client] addIceCandidate failed:', error);
        throw error;
      }
    }
  }

  window.RTCPeerConnection = DebugPeerConnection;
  webRtcDebugInstalled = true;
  logDebug('[trystero-client] WebRTC debugging installed');
  return true;
}
