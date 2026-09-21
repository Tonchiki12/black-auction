// Non-critical presentation only: no Engine, State, Game storage or Game RNG.
export const AUDIO_KEY = 'black-market-auction.audio-enabled';
export const AUDIO_SOURCES = {
  tap: new URL('../../assets/audio/tap.wav', import.meta.url).href,
  confirm: new URL('../../assets/audio/confirm.wav', import.meta.url).href,
  page: new URL('../../assets/audio/page.wav', import.meta.url).href,
  settle: new URL('../../assets/audio/settle.wav', import.meta.url).href,
  final: new URL('../../assets/audio/final.wav', import.meta.url).href,
  advance: new URL('../../assets/audio/advance.wav', import.meta.url).href,
};

export function createAudio({ getStorage = () => globalThis.localStorage,
  createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  fetchFile = (...args) => globalThis.fetch(...args),
  visibility = globalThis.document, lifecycle = globalThis.window } = {}) {
  let enabled = true, context, attempted = false, disposed = false, unlocked = false;
  try { enabled = getStorage()?.getItem(AUDIO_KEY) !== 'false'; } catch { /* session preference */ }
  const encoded = new Map(), buffers = new Map(), decoding = new Set(), voices = new Set();
  const requests = new AbortController();
  const silent = operation => { try { Promise.resolve(operation()).catch(() => {}); } catch { /* best effort */ } };
  const hidden = () => visibility?.hidden === true;

  function release(voice) {
    voices.delete(voice);
    silent(() => voice.source.disconnect()); silent(() => voice.gain.disconnect());
  }
  function stop() {
    for (const voice of [...voices]) { silent(() => voice.source.stop()); release(voice); }
  }
  function pause() {
    unlocked = false; stop();
    if (context) silent(() => context.suspend());
  }
  function visibilityChange() { if (hidden()) pause(); }
  visibility?.addEventListener('visibilitychange', visibilityChange);
  lifecycle?.addEventListener('pagehide', pause);

  function decode(name) {
    if (!context || disposed || buffers.has(name) || decoding.has(name) || !encoded.has(name)) return;
    decoding.add(name);
    silent(async () => {
      const buffer = await context.decodeAudioData(encoded.get(name).slice(0));
      if (!disposed) buffers.set(name, buffer);
      // Never play here. A missing/locked cue is discarded, not queued.
    });
  }
  // Fetch opportunistically. Menu/input never awaits IO or a decoder.
  for (const [name, url] of Object.entries(AUDIO_SOURCES)) silent(async () => {
    const response = await fetchFile(url, { signal: requests.signal });
    if (!response.ok) return;
    const bytes = await response.arrayBuffer();
    if (!disposed) { encoded.set(name, bytes); decode(name); }
  });

  function unlock() {
    if (disposed || !enabled || hidden()) return;
    if (!attempted) {
      attempted = true;
      try {
        context = createContext();
        context.onstatechange = () => { if (context.state !== 'running') stop(); };
      } catch { return; }
    }
    if (!context) return;
    unlocked = true;
    // Called in the explicit gesture, never in a promise continuation/timer.
    if (context.state !== 'running') silent(() => context.resume());
    for (const name of encoded.keys()) decode(name);
  }

  function playCue(name, level = 1) {
    if (disposed || !enabled || !unlocked || hidden() || context?.state !== 'running' || !buffers.has(name)) return false;
    let voice;
    try {
      const source = context.createBufferSource(), gain = context.createGain();
      voice = { source, gain };
      source.buffer = buffers.get(name);
      // Fixed conservative master level, not a user/device volume override.
      gain.gain.value = .45 * Math.max(0, Math.min(1, level));
      source.connect(gain); gain.connect(context.destination);
      source.onended = () => release(voice);
      // Bound overlap from rapid bid selection; only the newest tap is useful.
      if (name === 'tap') for (const old of [...voices]) if (old.name === 'tap') { silent(() => old.source.stop()); release(old); }
      voice.name = name; voices.add(voice); source.start();
      return true;
    } catch { if (voice) release(voice); return false; }
  }

  return { unlock, playCue, getEnabled: () => enabled,
    setEnabled(value) {
      if (disposed) return;
      enabled = value === true;
      try { getStorage()?.setItem(AUDIO_KEY, String(enabled)); } catch { /* in-memory remains valid */ }
      if (!enabled) pause();
    },
    dispose() {
      disposed = true; unlocked = false; stop(); requests.abort(); buffers.clear(); encoded.clear();
      visibility?.removeEventListener('visibilitychange', visibilityChange);
      lifecycle?.removeEventListener('pagehide', pause);
      if (context) { context.onstatechange = null; silent(() => context.close()); }
    },
  };
}
