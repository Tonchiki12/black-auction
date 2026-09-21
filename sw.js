// Black Auction: one coherent runtime per worker. No forced takeover or reload.
// Inventory is checked in. Refresh after runtime changes: npm run pwa:refresh.
// BEGIN RUNTIME INVENTORY
const REVISION = 'm5c-bf83a120f81e16123595';
const RESOURCES = [
  [
    "./assets/audio/advance.wav",
    "5c6b1a913c0339f8b7a69fd485b470ea7fda2c1746c74ab25a7120e67c78ae47"
  ],
  [
    "./assets/audio/confirm.wav",
    "1fc7c23ebdfdd1d7f930fcddebdd69c49eb5676d558d7c481367606f8c698c5d"
  ],
  [
    "./assets/audio/final.wav",
    "7549466604a60dc5534da4961950bb808fac9b64bb4f4e3a052fc4d65f9d7990"
  ],
  [
    "./assets/audio/page.wav",
    "5cd462503ee2af53f15393ccf453f3be214d58b38e1af28b3e15d8c441f0ed54"
  ],
  [
    "./assets/audio/settle.wav",
    "df0278ac4a3dd263ae13076a33a288d9c7ecf23fefb89659f66dd5829b13a620"
  ],
  [
    "./assets/audio/tap.wav",
    "fae9649c02f9ed148466ac24df4b3de12778453a1b9229f17c61442eb82c9699"
  ],
  [
    "./assets/branding/black-auction-logo.svg",
    "e7501c52d32c1babd9eca4334ebe8ca2dd2855154214023eb02b9698509b6946"
  ],
  [
    "./assets/icons/apple-touch-icon.png",
    "6fe33da4ce3454639f06dd1dfef581cb900691bdeec80299e38cbb74b521c802"
  ],
  [
    "./assets/icons/icon-192.png",
    "6471179c468bb96094a479c0387852a9cba0227b94af8e78600f0aab7b922012"
  ],
  [
    "./assets/icons/icon-512.png",
    "bee689ce7bdbf5591df1242228b211548bdc17f9e733f164f5db38e182ebcb73"
  ],
  [
    "./assets/invitation/invitation-art.png",
    "9b3399070d4d88c1eb416b905cd3cc4a7fa907f0ec9e4c11800cfb86ed9ab2fb"
  ],
  [
    "./assets/lots/alchemy-watch.png",
    "8b7c659a2e67747ab60df7388692671700bea8585417b3b9df4b2b1606898c48"
  ],
  [
    "./assets/lots/ancient-coins.png",
    "a4a0f205ad610bb1e537464a82b4fe69dd85ad6fad5646c0395eb6e64f0666d2"
  ],
  [
    "./assets/lots/appraisal.png",
    "8b34de30c524dd88882142acda42b8c7a8f50dc9c72ed582a3c7e6186bc3f832"
  ],
  [
    "./assets/lots/black-crown.png",
    "a57cb0ef865f1ae1d0fb71536f855353320e84d8824de7f6619d5dcf5d247668"
  ],
  [
    "./assets/lots/forbidden-index.png",
    "47e35d03740cbe33f920880d62ae6953951f8e7b4adc89d7651e5f1ba5fa5c00"
  ],
  [
    "./assets/lots/forged-painting.png",
    "7d9543e344d6c32b3f882ec1890f53f5dcfd5d2b5defdd164dd060d3057b0c0a"
  ],
  [
    "./assets/lots/informer.png",
    "8d2ff35170558be0dac9d15c059d966309a191211c48945a337019f8c318da81"
  ],
  [
    "./assets/lots/noble-ring.png",
    "fd66408a08fa2cf314f963819c7d6ff8a3e6d73779cf1dd1d830b0ae24656169"
  ],
  [
    "./assets/lots/patron-letter.png",
    "8f03d106cc01c3291bb28c961a0763a8f95c80bcf37809505a604a0066e43caa"
  ],
  [
    "./assets/lots/raid.png",
    "2a3be75a278f5f87f6fb8385864c08eb116c5ed1494aea5f8ac515312e351514"
  ],
  [
    "./assets/lots/royal-jewel.png",
    "be4bd42da7cf8d3176c5e3409c763b7623c7c156a17be3a3797e9b5fb53836ce"
  ],
  [
    "./assets/lots/sealed-jar.png",
    "5909eee2654d18474a8337be11b2673fec72774cc035a7c375e18c863410852d"
  ],
  [
    "./assets/lots/tax-audit.png",
    "e8411f8cf8d4fa2cd5acee146e9550aa63deae845760e54d5bdfdb79c3fc4aa0"
  ],
  [
    "./assets/portraits/collector.png",
    "27bca961f3de3c2aec49bd65b33006375b9c677607256c4945cc3d485426a215"
  ],
  [
    "./assets/portraits/count.png",
    "5f6da65a0e18d12e32cd2d2b57719d62d039362da8e47320d3ec5257641b4cf6"
  ],
  [
    "./assets/portraits/human.png",
    "8cb734e621fbbada17e659c00a604d99e4e76e8ab5a872d89490c980a5473476"
  ],
  [
    "./assets/portraits/smuggler.png",
    "0d1378dba0f2ea0323cd9d0f096f7d0fa142c61f94e0b44ae2aa216796ff9020"
  ],
  [
    "./assets/rules/auction-avoidance.png",
    "34551c6a3bc320a820c08398bceb3f3ab7ed32fc65028a132e1bad2cdb3a3527"
  ],
  [
    "./assets/rules/auction-normal.png",
    "38f169bce43a0fcff22adc4d444462bfee6848c2af8a734f58e6f57301e5795f"
  ],
  [
    "./assets/rules/bid-controls.png",
    "2c963b647883b604f261c0aa07548a438149c386e6743c6bdc058f80118b8393"
  ],
  [
    "./assets/rules/final.png",
    "bd652a9960b67c08f29fc3ba70220265bd70f1e191901d1a1b154e63f70fc334"
  ],
  [
    "./assets/rules/participants.png",
    "2b7493ebe0b56cbc2f46d5ca5b5aac53cdab7919238e0b22b9c089ec29436dfb"
  ],
  [
    "./assets/rules/player-values.png",
    "42e7a24b32ae449e0efdce61534a5925f581ea70df5806c28467d269cdf2e11b"
  ],
  [
    "./assets/rules/priority-order.png",
    "23e644477ef9bcf28b43e43b50b80f3165ab149aa0d8eed4db5ca52f63ac39dd"
  ],
  [
    "./assets/rules/result.png",
    "a7d6e05cebec2566bb8d2587d12c1804deaa8622533a7f31cef3a663a9fb8b27"
  ],
  [
    "./index.html",
    "ac989131927db254a1abdc14c7fb2576979e99faf1827c8482ea02aa342adaa3"
  ],
  [
    "./manifest.webmanifest",
    "f54bb833077c78d61866eb21c02ce501bee9428d668cc860dc7209924243792d"
  ],
  [
    "./src/application.js",
    "61f3c6fc533b94901254ab1381d4cac3cdef29c7cf07d165a467793e7abfb093"
  ],
  [
    "./src/config.js",
    "8347b8e9ece91999c9ba0db57ae19849639f3c27c7a17f52a2912d8f8f692446"
  ],
  [
    "./src/game/ai.js",
    "ce87b9a0b249f7e13e5fb7ca94aebc62c13c6f400cb27fd527e643ffff35ad3d"
  ],
  [
    "./src/game/data.js",
    "426250b5f9d082c3b6c8a50ff2a153188115c6070f8412c966afd840962dd2d3"
  ],
  [
    "./src/game/engine.js",
    "dbc589445b314dfa5932938a782037f9eb30a0c8a972681a212970cc82092ca5"
  ],
  [
    "./src/game/rng.js",
    "5125a0a1ddb2723bf9b8e586dbc5b1dce1592df88ff404d8031bd3d1ab6c4c30"
  ],
  [
    "./src/game/rules.js",
    "4caf705168808a7fe5cb7d9b1eb8eef2e391badb5c8bfeaab6033b209821032b"
  ],
  [
    "./src/game/state.js",
    "23ea03410413166106b1466ff5d9423c7bf718d661359d7098e472d6a947de09"
  ],
  [
    "./src/game/validation.js",
    "c6bfbb22ac7ce07db475915ad2226450711f48b0d067dfe3c3709601fa12a02b"
  ],
  [
    "./src/main.js",
    "6205da4c1087a377f430ab530a437885980a4e9fc3b3f16a6283ddd290def2e3"
  ],
  [
    "./src/pwa/display-mode.js",
    "029461a26b40bba2906f41fea17a2f3352afee9421ce11ec45392013ba3c8170"
  ],
  [
    "./src/pwa/install-guidance.js",
    "c554643400b366cdda034f10d08e4806ddc742a4b23a85ef432e3e347438c6cf"
  ],
  [
    "./src/pwa/install-view.js",
    "bc8e5bef0ea474c6bbdfe11111f160debd4d23575411705690570ffe8f2f98c2"
  ],
  [
    "./src/pwa/offline.js",
    "02e52a0051445da606676dbb72ca71f7f2f15d9f1bfc9370c6368c82d033a4bd"
  ],
  [
    "./src/pwa/shell.js",
    "bc0ba57bdff4d7d6cb98a6ddfac1a46edfc2f9d28febbe71c90575512ee930b7"
  ],
  [
    "./src/storage/game-storage.js",
    "605e54060951e350287cba2b9e6fc7804afe6bfe87a35a77ab6e79b6ed633954"
  ],
  [
    "./src/storage/validate-save.js",
    "31ce14450039177d245cf66118def25b58a3cf106e156b1e00c55ca298a6d738"
  ],
  [
    "./src/ui/app.js",
    "0a2199891e89c4941d65f630d07af3f2cc8f7f05a92ef8610edbe71f87004c90"
  ],
  [
    "./src/ui/audio.js",
    "ef4f961bb93536aedc2bc4c96e838bc0624f20bb95b700a62489ad2ab9c09267"
  ],
  [
    "./src/ui/branding.js",
    "5bb89ef203f43364c51fcb23d7720582e3fbbcee94550d34edb4ba76b5eb0093"
  ],
  [
    "./src/ui/motion.js",
    "cfdebd03eaedf362f0c118dde750c6ad9624e7be43030d69282939b9b80c834e"
  ],
  [
    "./src/ui/presenter.js",
    "6c1c6007ec63574be14026eb8d6903b3c8cd27d0faa42c2c7870fe992c5154d0"
  ],
  [
    "./src/ui/render.js",
    "62ae7c4d3b336cb78ca1c905be19ea4fce48e02c711c0a1a244a021c974b94cb"
  ],
  [
    "./src/ui/rules-view.js",
    "87441261cb74e54d80ccfa37a48bb3c024866059b9ad5aa3b71d6b789977cdf0"
  ],
  [
    "./styles/game.css",
    "b76d363d5a40be266af2a9dd3f900c0e1c944507ce70de543ba09f207cf9a7a6"
  ],
  [
    "./styles/install.css",
    "4a8f20a3b489b20835fd2dd0ed0f882f76f818d1f755f7e0994ce0cb4aa5fb21"
  ]
];
// END RUNTIME INVENTORY

const BASE = self.registration.scope;
const PREFIX = `black-auction-runtime:${encodeURIComponent(BASE)}:`;
const CACHE = PREFIX + REVISION;
const entries = new Map(RESOURCES.map(([path, hash]) => [new URL(path, BASE).href, hash]));
const entryUrl = new URL('index.html', BASE).href;
const isText = url => /\.(?:html|js|css|svg|webmanifest)$/.test(new URL(url).pathname);

async function verifiedResponse(url, expectedHash) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 15000);
  try {
    const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin',
      headers: { 'X-Black-Auction-Precache': '1' }, signal: abort.signal });
    if (!response.ok || response.redirected || response.url !== url) throw new Error('Runtime response unavailable');
    const bytes = await response.clone().arrayBuffer();
    // Git checkout CRLF and static-host LF encode the same accepted text.
    const canonical = isText(url) ? new TextEncoder().encode(new TextDecoder().decode(bytes).replace(/\r\n/g, '\n')) : bytes;
    const digest = await crypto.subtle.digest('SHA-256', canonical);
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (hash !== expectedHash) throw new Error('Runtime revision mismatch');
    const headers = new Headers(response.headers);
    headers.set('X-Black-Auction-Revision', REVISION);
    return new Response(bytes, { status: 200, headers });
  } finally { clearTimeout(timeout); }
}

async function installRuntime() {
  try {
    // No cache writes until every response is complete and matches this worker.
    const fetched = await Promise.allSettled([...entries].map(async ([url, hash]) => [url, await verifiedResponse(url, hash)]));
    if (fetched.some(result => result.status === 'rejected')) throw new Error('Runtime preparation failed');
    const cache = await caches.open(CACHE);
    const writes = await Promise.allSettled(fetched.map(({ value: [url, response] }) => cache.put(url, response)));
    if (writes.some(result => result.status === 'rejected')) throw new Error('Runtime cache write failed');
  } catch (error) {
    await caches.delete(CACHE); // Only this failed candidate; never the previous revision.
    throw error;
  }
}

async function cacheStatus() {
  let complete = false;
  if (await caches.has(CACHE)) {
    const keys = await (await caches.open(CACHE)).keys();
    const urls = new Set(keys.map(request => request.url));
    complete = urls.size === entries.size && [...entries.keys()].every(url => urls.has(url));
  }
  return { revision: REVISION, cacheName: CACHE, resourceCount: entries.size, complete };
}

self.addEventListener('install', event => event.waitUntil(installRuntime()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  if (!(await cacheStatus()).complete) throw new Error('Incomplete runtime cannot activate');
  // Default lifecycle guarantees previous controlled clients have gone away.
  // A newer installation can overlap activation. Never delete its candidate.
  // Defer old-cache cleanup to its next successful activation in that case.
  if (self.registration.installing || self.registration.waiting) return;
  // Match our exact scope and revision format; keep all unrelated caches.
  await Promise.all((await caches.keys()).filter(name => name !== CACHE && name.startsWith(PREFIX)
    && /^m5c-[a-f0-9]{20}$/.test(name.slice(PREFIX.length))).map(name => caches.delete(name)));
  // Intentionally no clients.claim(): first online document keeps its own session.
})()));

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(BASE);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const appNavigation = request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === new URL(entryUrl).pathname);
  const key = appNavigation ? entryUrl : url.href;
  if (!entries.has(key)) return; // No catch-all SPA fallback, docs, workbench, SW or foreign resource cache.
  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(CACHE);
      const cached = await cache.match(key);
      if (cached) return cached;
    } catch { /* Cache unavailable: still allow verified online resources. */ }
    // Eviction recovery may only restore exact bytes of this revision, never latest mixed content.
    try {
      const response = await verifiedResponse(key, entries.get(key));
      try { await cache?.put(key, response.clone()); } catch { /* Keep readiness degraded, not the online game. */ }
      return response;
    } catch {
      return new Response('Black Auction runtime unavailable. Reconnect and reopen the application.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'BLACK_AUCTION_RUNTIME_STATUS' || !event.ports[0]
    || !event.source?.url?.startsWith(BASE)) return;
  event.waitUntil(cacheStatus().then(status => event.ports[0].postMessage(status))
    .catch(() => event.ports[0].postMessage({ revision: REVISION, cacheName: CACHE, complete: false })));
});
