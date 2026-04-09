#!/usr/bin/env node
/**
 * Device-side HTTP Proxy with Trystero WebRTC Bridge
 *
 * This script runs on the Pixelrunner device and:
 * 1. Serves as an HTTP proxy to GitHub Pages (or cached static files)
 * 2. Acts as a Trystero peer for P2P WebRTC connection
 * 3. Bridges WebRTC data to the Unix socket controller
 *
 * Usage:
 *   node scripts/device-proxy.mjs [--port PORT] [--gh-pages URL] [--socket PATH]
 *
 * Default port: 8080 (use --port 80 with sudo for production)
 * Default GitHub Pages URL: https://username.github.io/repo
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { Socket } from 'net';

import { NOSTR_RELAYS } from '../src/constants.ts';

// WebRTC polyfill for Node.js environment
// Trystero requires RTCPeerConnection, but Node.js doesn't have it.
// We provide a minimal shim that allows Trystero to initialize without errors.
// In Node.js, communication will work via Nostr relays only (WebRTC won't function).
if (typeof globalThis.RTCPeerConnection === 'undefined') {
  // Create a stub that satisfies the basic structure Trystero expects
  // It won't actually work for WebRTC connections, but allows Trystero to initialize
  globalThis.RTCPeerConnection = function RTCPeerConnectionStub(_config) {
    // Store config but don't use it - WebRTC isn't available in Node.js
    this._config = _config;
    this.iceGatheringState = 'complete';
    this.iceConnectionState = 'closed';
    this.signalingState = 'closed';
    this.localDescription = null;
    this.remoteDescription = null;
  };

  globalThis.RTCPeerConnection.prototype = {
    createDataChannel(label) {
      return {
        label,
        binaryType: 'arraybuffer',
        bufferedAmountLowThreshold: 0xffff,
        readyState: 'closed',
        close() {},
        send() { throw new Error('WebRTC not supported in Node.js'); },
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
      };
    },
    createOffer() {
      return Promise.reject(new Error('WebRTC not supported in Node.js'));
    },
    createAnswer() {
      return Promise.reject(new Error('WebRTC not supported in Node.js'));
    },
    setLocalDescription(desc) {
      this.localDescription = desc;
      return Promise.resolve();
    },
    setRemoteDescription(desc) {
      this.remoteDescription = desc;
      return Promise.resolve();
    },
    addIceCandidate() {
      return Promise.resolve();
    },
    close() {
      this.signalingState = 'closed';
      this.iceConnectionState = 'closed';
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; }
  };

  // Also polyfill RTCSessionDescription and RTCIceCandidate for completeness
  globalThis.RTCSessionDescription = function RTCSessionDescriptionStub(_init) {
    this.type = _init?.type || null;
    this.sdp = _init?.sdp || '';
  };

  globalThis.RTCIceCandidate = function RTCIceCandidateStub(_init) {
    this.candidate = _init?.candidate || '';
    this.sdpMid = _init?.sdpMid || null;
    this.sdpMLineIndex = _init?.sdpMLineIndex ?? null;
  };

  console.log('[device-proxy] WebRTC stub initialized - using Nostr relays only');
}

// Configuration
const DEFAULT_PORT = 8080;
const DEFAULT_SOCKET = '/tmp/controller.sock';
const DEFAULT_GHPAGES = 'https://pixelrunner-dev.github.io/admin';

const config = {
  appId: DEFAULT_GHPAGES,
  port: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
  socketPath: process.env.SOCKET_PATH || DEFAULT_SOCKET,
  githubPagesUrl: process.env.GHPAGES_URL || DEFAULT_GHPAGES,
  deviceId: process.env.DEVICE_ID || 'pxlr_f91a',
  nostrRelays: NOSTR_RELAYS
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    config.port = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--socket' && args[i + 1]) {
    config.socketPath = args[i + 1];
    i++;
  } else if (args[i] === '--gh-pages' && args[i + 1]) {
    config.githubPagesUrl = args[i + 1];
    i++;
  } else if (args[i] === '--help') {
    console.log(`
Device Proxy with Trystero Bridge

Usage: node device-proxy.mjs [options]

Options:
  --port PORT         HTTP proxy port (default: 80)
  --socket PATH       Unix socket path for controller (default: /tmp/controller.sock)
  --gh-pages URL      GitHub Pages URL (default: https://pixelrunner.github.io/admin)
  --help              Show this help message

Environment variables:
  PORT                HTTP proxy port
  SOCKET_PATH         Unix socket path
  GHPAGES_URL         GitHub Pages URL
  DEVICE_ID           Device identifier
`);
    process.exit(0);
  }
}

console.log('[device-proxy] Configuration:', config);

// Cache for static files
/** @type {Map<string, { content: Buffer; contentType: string; timestamp: number }>} */
const fileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch content from GitHub Pages
 * @param {string} urlPath - The URL path to fetch
 * @returns {Promise<{content: Buffer, contentType: string} | null>}
 */
async function fetchFromGitHubPages(urlPath) {
  const url = new URL(urlPath, config.githubPagesUrl);

  return new Promise((resolve) => {
    const client = url.protocol === 'https:' ? https : http;

    const request = client.get(url, {
      headers: {
        'User-Agent': 'Pixelrunner-Device-Proxy/1.0'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          fetchFromGitHubPages(redirectUrl).then(resolve);
        } else {
          resolve(null);
        }
        return;
      }

      if (response.statusCode !== 200) {
        console.error(`[device-proxy] GitHub Pages error: ${response.statusCode}`);
        resolve(null);
        return;
      }

      /** @type {Buffer[]} */
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const content = Buffer.concat(chunks);
        const contentType = getContentType(urlPath);
        resolve({ content, contentType });
      });
    });

    request.on('error', (err) => {
      console.error('[device-proxy] GitHub Pages fetch error:', err.message);
      resolve(null);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Determine content type from file path
 * @param {string} filePath - The file path
 * @returns {string}
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * HTTP Request handler - proxies to GitHub Pages
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function handleHttpRequest(req, res) {
  const urlPath = req.url || '/';

  // Skip API requests and special paths
  if (urlPath.startsWith('/api/') || urlPath.startsWith('/ws')) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  // Add via proxy marker for the Vue app
  const proxyUrl = urlPath.includes('?')
    ? `${urlPath}&via=proxy`
    : `${urlPath}?via=proxy`;

  // Check cache
  const cached = fileCache.get(proxyUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[device-proxy] Cache hit: ${urlPath}`);
    res.writeHead(200, { 'Content-Type': cached.contentType });
    res.end(cached.content);
    return;
  }

  // Fetch from GitHub Pages
  console.log(`[device-proxy] Fetching: ${proxyUrl}`);
  const result = await fetchFromGitHubPages(proxyUrl);

  if (result) {
    // Cache the result
    fileCache.set(proxyUrl, {
      ...result,
      timestamp: Date.now()
    });

    res.writeHead(200, {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=300'
    });
    res.end(result.content);
  } else {
    // Try serving from cache even if expired
    if (cached) {
      console.log(`[device-proxy] Serving expired cache: ${urlPath}`);
      res.writeHead(200, { 'Content-Type': cached.contentType });
      res.end(cached.content);
    } else {
      res.writeHead(502);
      res.end('Failed to fetch from GitHub Pages');
    }
  }
}

// Trystero imports - will be loaded dynamically
/** @type {typeof import('trystero') | null} */
let trystero = null;
/** @type {ReturnType<typeof import('trystero')['joinRoom']> | null} */
let room = null;
/** @type {((data: unknown) => void) | null} */
let sendAction = null;

/**
 * Initialize Trystero for WebRTC connection
 */
async function initTrystero() {
  try {
    trystero = await import('trystero');

    // Ensure roomId is always defined with a fallback
    const roomId = `pixelrunner-${config.deviceId || 'default'}`;

    // Validate required configuration
    if (!roomId || roomId === 'pixelrunner-') {
      throw new Error('Trystero: roomId argument required - deviceId is missing');
    }

    console.log(`[device-proxy] Joining Trystero room: ${roomId}`);
    console.log(`[device-proxy] Using Nostr relays: ${config.nostrRelays.join(', ')}`);

    // Trystero v0.22.x API: joinRoom(config, roomId)
    // Pass config options and roomId as separate arguments
    room = trystero.joinRoom(
      {
        appId: config.appId,
        nostrRelays: config.nostrRelays
      },
      roomId
    );

    // Create action for RPC
    const actionName = 'rpc';
    const [sendRpcAction, receiveRpcAction] = room.makeAction(actionName);
    sendAction = sendRpcAction;

    // Handle incoming messages from browser
    receiveRpcAction((data) => {
      handleRpcMessage(data);
    });

    room.onPeerJoin((peerId) => {
      console.log(`[device-proxy] Browser peer joined: ${peerId}`);
    });

    room.onPeerLeave((peerId) => {
      console.log(`[device-proxy] Browser peer left: ${peerId}`);
    });

    console.log('[device-proxy] Trystero initialized');
  } catch (error) {
    console.error('[device-proxy] Trystero initialization error:', error);
  }
}

/**
 * Handle incoming RPC message from browser
 * @param {string} data
 */
function handleRpcMessage(data) {
  try {
    const message = JSON.parse(data);

    // Check if it's a request (has id)
    if (message.id) {
      // Forward to controller via Unix socket
      forwardToController(message)
        .then((response) => {
          // Send response back via Trystero
          if (sendAction) {
            sendAction(JSON.stringify(response));
          }
        })
        .catch((error) => {
          // Send error response
          if (sendAction) {
            sendAction(JSON.stringify({
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32603,
                message: error.message || 'Internal error'
              }
            }));
          }
        });
    }
  } catch (error) {
    console.error('[device-proxy] RPC message parse error:', error);
  }
}

/**
 * Forward message to controller via Unix socket
 * @param {unknown} message
 * @returns {Promise<object>}
 */
async function forwardToController(message) {
  return new Promise((resolve, reject) => {
    // Check if socket exists
    if (!fs.existsSync(config.socketPath)) {
      reject(new Error('Controller socket not available'));
      return;
    }

    const socket = new Socket();
    let data = '';

    socket.connect(config.socketPath);

    socket.on('connect', () => {
      socket.write(JSON.stringify(message));
      socket.end();
    });

    socket.on('data', (chunk) => {
      data += chunk.toString();
    });

    socket.on('end', () => {
      try {
        const response = JSON.parse(data);
        resolve(response);
      } catch {
        reject(new Error('Invalid response from controller'));
      }
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.setTimeout(30000, () => {
      socket.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Create HTTP server
const server = http.createServer(handleHttpRequest);

server.listen(config.port, () => {
  console.log(`[device-proxy] HTTP proxy listening on port ${config.port}`);
  console.log(`[device-proxy] Proxying to: ${config.githubPagesUrl}`);
});

// Start Trystero
initTrystero().catch(console.error);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[device-proxy] Shutting down...');
  if (room) {
    room.leave();
  }
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[device-proxy] Shutting down...');
  if (room) {
    room.leave();
  }
  server.close();
  process.exit(0);
});
