import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://erdogjeyqxufpsczriat.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_stz6G3e9pbCTRpRCq_miOA_lmIORu-m';

const resilientFetch = async (url, options) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new TypeError('Network offline');
  }

  // Sanitize any oversized Authorization header (> 4096 chars) that would otherwise
  // cause Cloudflare to terminate the connection with 400 Bad Request or ERR_CONNECTION_RESET
  let sanitizedOptions = options;
  if (options && options.headers) {
    let authVal = '';
    if (typeof Headers !== 'undefined' && options.headers instanceof Headers) {
      authVal = options.headers.get('Authorization') || options.headers.get('authorization') || '';
      if (authVal.length > 4096) {
        const newHeaders = new Headers(options.headers);
        newHeaders.set('Authorization', `Bearer ${supabaseAnonKey}`);
        sanitizedOptions = { ...options, headers: newHeaders };
      }
    } else if (typeof options.headers === 'object') {
      authVal = options.headers.Authorization || options.headers.authorization || '';
      if (authVal.length > 4096) {
        sanitizedOptions = {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${supabaseAnonKey}`,
            authorization: `Bearer ${supabaseAnonKey}`,
          }
        };
      }
    }
  }

  const maxRetries = 3;
  const retryDelays = [200, 400, 800];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, sanitizedOptions);
    } catch (err) {
      const errMsg = String(err?.message || err?.name || err || '').toLowerCase();
      const isTransient = 
        errMsg.includes('failed to fetch') ||
        errMsg.includes('err_http2_protocol_error') ||
        errMsg.includes('err_connection_reset') ||
        errMsg.includes('err_connection_closed') ||
        errMsg.includes('econnreset') ||
        errMsg.includes('closed') ||
        errMsg.includes('network') ||
        errMsg.includes('http2') ||
        err?.name === 'TypeError';

      if (attempt < maxRetries && isTransient) {
        const delay = retryDelays[attempt] || 800;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: typeof fetch !== 'undefined' ? resilientFetch : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 2000, 30000),
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Auto-manage realtime connection state on network status changes to avoid websocket error spam
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    try {
      supabase.realtime?.disconnect();
    } catch (_) {}
  });

  window.addEventListener('online', () => {
    try {
      supabase.realtime?.connect();
    } catch (_) {}
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      supabase.realtime?.disconnect();
    } catch (_) {}
  }
}

// Global table router proxy to map legacy collection names to Supabase tables
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  let mapped = table;
  if (table === 'users') mapped = 'profiles';
  if (table === 'submissions') mapped = 'submitted_assignments';
  if (table === 'exam_attempts') mapped = 'exam_results';
  return originalFrom(mapped);
};

