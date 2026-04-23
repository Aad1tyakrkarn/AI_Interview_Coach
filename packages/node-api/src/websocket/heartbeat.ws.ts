import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../config/logger';

interface ClientState {
  lastPing: number;
  latencies: number[];
  disconnectTimer: NodeJS.Timeout | null;
  sessionId: string | null;
}

const DISCONNECT_TIMEOUT_MS = 30000; // 30s without ping = disconnected
const MAX_LATENCY_SAMPLES = 20;

function assessConnectionQuality(latencies: number[]): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  avgLatency: number;
  jitter: number;
} {
  if (latencies.length === 0) {
    return { quality: 'good', avgLatency: 0, jitter: 0 };
  }

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  // Calculate jitter (standard deviation of latency)
  const variance = latencies.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / latencies.length;
  const jitter = Math.sqrt(variance);

  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (avg < 100 && jitter < 30) {
    quality = 'excellent';
  } else if (avg < 300 && jitter < 80) {
    quality = 'good';
  } else if (avg < 600 && jitter < 150) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return { quality, avgLatency: Math.round(avg), jitter: Math.round(jitter) };
}

export function setupHeartbeatNamespace(io: SocketIOServer): void {
  const heartbeatNs = io.of('/heartbeat');
  const clients = new Map<string, ClientState>();

  heartbeatNs.on('connection', (socket: Socket) => {
    logger.debug(`Heartbeat WS client connected: ${socket.id}`);

    const state: ClientState = {
      lastPing: Date.now(),
      latencies: [],
      disconnectTimer: null,
      sessionId: null,
    };
    clients.set(socket.id, state);

    // Start disconnect detection timer
    function resetDisconnectTimer() {
      if (state.disconnectTimer) {
        clearTimeout(state.disconnectTimer);
      }
      state.disconnectTimer = setTimeout(() => {
        logger.warn(`No heartbeat from ${socket.id} for ${DISCONNECT_TIMEOUT_MS / 1000}s, emitting warning`);
        socket.emit('connection-warning', {
          type: 'timeout',
          message: 'No heartbeat detected. You may be disconnected.',
          lastPing: state.lastPing,
          serverTime: Date.now(),
        });
      }, DISCONNECT_TIMEOUT_MS);
    }

    resetDisconnectTimer();

    socket.on('ping', (data: { sessionId?: string; timestamp?: number; clientTime?: string }) => {
      const now = Date.now();
      state.lastPing = now;
      state.sessionId = data.sessionId || state.sessionId;

      // Calculate latency from client timestamp
      let latency: number | null = null;
      const clientTimestamp = data.timestamp || (data.clientTime ? new Date(data.clientTime).getTime() : null);
      if (clientTimestamp) {
        latency = now - clientTimestamp;
        state.latencies.push(latency);
        if (state.latencies.length > MAX_LATENCY_SAMPLES) {
          state.latencies.shift();
        }
      }

      // Reset disconnect timer on every ping
      resetDisconnectTimer();

      // Respond with pong
      socket.emit('pong', {
        sessionId: data.sessionId || null,
        serverTimestamp: now,
        latency,
        status: 'alive',
      });

      // Emit connection quality assessment periodically (every 5 pings)
      if (state.latencies.length > 0 && state.latencies.length % 5 === 0) {
        const quality = assessConnectionQuality(state.latencies);
        socket.emit('connection-quality', {
          ...quality,
          sampleCount: state.latencies.length,
          serverTime: now,
        });
      }
    });

    socket.on('connection-quality', (data: { latency?: number; bandwidth?: number }) => {
      // Client is reporting its own quality metrics
      if (data.latency !== undefined) {
        state.latencies.push(data.latency);
        if (state.latencies.length > MAX_LATENCY_SAMPLES) {
          state.latencies.shift();
        }
      }

      const quality = assessConnectionQuality(state.latencies);
      socket.emit('quality-ack', {
        ...quality,
        sampleCount: state.latencies.length,
        serverTime: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      logger.debug(`Heartbeat WS client disconnected: ${socket.id}`);
      if (state.disconnectTimer) {
        clearTimeout(state.disconnectTimer);
      }
      clients.delete(socket.id);
    });
  });
}
