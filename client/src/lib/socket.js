import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const PROBE_INTERVAL_MS = 10000;
const PROBE_TIMEOUT_MS = 3000;

let statusMessageLogged = false;

/** Dev uses Vite proxy (/api/health). Remote API uses root (always on deployed builds). */
function getProbeUrl() {
  return API_BASE ? `${API_BASE}/` : '/api/health';
}

async function isServerReachable() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(getProbeUrl(), { signal: controller.signal });
    if (API_BASE) return res.ok;
    return res.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

function logStatus(message) {
  if (statusMessageLogged) return;
  statusMessageLogged = true;
  console.debug(message);
}

function resetStatusLog() {
  statusMessageLogged = false;
}

/**
 * Subscribe to realtime telemetry when the API server is available.
 * Avoids connecting (and console network errors) while the server is down.
 */
export function subscribeTelemetry(onTelemetryUpdate) {
  let cancelled = false;
  let socket = null;
  let probeTimer = null;

  const cleanupSocket = () => {
    if (!socket) return;
    socket.off('telemetryUpdate', onTelemetryUpdate);
    socket.removeAllListeners();
    socket.close();
    socket = null;
  };

  const scheduleProbe = () => {
    if (cancelled || probeTimer) return;
    probeTimer = setTimeout(() => {
      probeTimer = null;
      connect();
    }, PROBE_INTERVAL_MS);
  };

  const connect = async () => {
    if (cancelled || socket) return;

    const reachable = await isServerReachable();
    if (cancelled) return;

    if (!reachable) {
      logStatus('[realtime] Server unavailable; live updates paused. Retrying…');
      scheduleProbe();
      return;
    }

    resetStatusLog();

    const socketOptions = {
      reconnection: false,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    };
    socket = API_BASE ? io(API_BASE, socketOptions) : io(socketOptions);

    socket.on('telemetryUpdate', onTelemetryUpdate);

    socket.on('connect', () => {
      resetStatusLog();
      console.debug('[realtime] Connected');
    });

    socket.on('connect_error', () => {
      logStatus('[realtime] Connection failed; will retry when the server is available.');
      cleanupSocket();
      scheduleProbe();
    });

    socket.on('disconnect', () => {
      if (cancelled) return;
      cleanupSocket();
      scheduleProbe();
    });
  };

  connect();

  return () => {
    cancelled = true;
    if (probeTimer) {
      clearTimeout(probeTimer);
      probeTimer = null;
    }
    cleanupSocket();
  };
}
