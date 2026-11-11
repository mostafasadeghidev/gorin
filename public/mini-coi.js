/*! coi-serviceworker v0.1.7 - Guido Zuidhof and contributors, licensed under MIT */
/*! mini-coi - Andrea Giammarchi and contributors, licensed under MIT */
/* with changes for Gorin: also caches the app so it works offline */
// Adds the headers that make the page cross-origin isolated (needed for SharedArrayBuffer)
const isolate = (res) => {
  const { body, status, statusText } = res;
  if (!status || status > 399) return res;
  const h = new Headers(res.headers);
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Embedder-Policy", "require-corp");
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  return new Response(status == 204 ? null : body, { status, statusText, headers: h });
};

(({ document: d, navigator: { serviceWorker: s } }) => {
  if (d) {
    if (!s) return;
    // Servers that already send the isolation headers still get the worker, for offline use
    const isolated = crossOriginIsolated;
    const { currentScript: c } = d;
    s.register(c.src, { scope: c.getAttribute("scope") || "." }).then(
      (r) => {
        if (isolated) return;
        s.addEventListener("controllerchange", () => location.reload());
        if (r.active && !s.controller) location.reload();
      },
      () => {},
    );
  } else {
    // Bump to drop everything cached by older versions
    const CACHE = "gorin-v1";
    const scope = new URL(registration.scope);
    const appShell = new URL("./", scope).href;

    addEventListener("install", (e) => {
      skipWaiting();
      e.waitUntil(
        caches
          .open(CACHE)
          .then((cache) => cache.add(appShell))
          .catch(() => {}),
      );
    });

    addEventListener("activate", (e) =>
      e.waitUntil(
        (async () => {
          for (const key of await caches.keys()) {
            if (key.startsWith("gorin-") && key !== CACHE) await caches.delete(key);
          }
          await clients.claim();
        })(),
      ),
    );

    const store = (e, key, res) => {
      if (res.status !== 200 || res.type !== "basic") return;
      const copy = res.clone();
      e.waitUntil(
        caches
          .open(CACHE)
          .then((cache) => cache.put(key, copy))
          .catch(() => {}),
      );
    };

    addEventListener("fetch", (e) => {
      const { request: r } = e;
      if (r.cache === "only-if-cached" && r.mode !== "same-origin") return;

      const url = new URL(r.url);
      const needsIsolation = r.mode === "navigate" || r.destination.endsWith("worker");
      const cacheable =
        r.method === "GET" &&
        url.origin === scope.origin &&
        url.pathname.startsWith(scope.pathname) &&
        !r.headers.has("range");
      if (!cacheable && !needsIsolation) return;

      const wrap = (res) => (needsIsolation ? isolate(res) : res);

      // Hashed build output never changes under the same name: serve it from the cache
      if (cacheable && url.pathname.startsWith(scope.pathname + "assets/")) {
        e.respondWith(
          caches
            .match(r)
            .then(
              (hit) =>
                hit ??
                fetch(r).then((res) => {
                  store(e, r, res);
                  return res;
                }),
            )
            .then(wrap),
        );
        return;
      }

      // Everything else: fresh from the network, the cached copy when offline
      const key = r.mode === "navigate" ? appShell : r;
      e.respondWith(
        fetch(r)
          .then((res) => {
            if (cacheable && (r.mode !== "navigate" || url.href.split(/[?#]/)[0] === appShell)) {
              store(e, key, res);
            }
            return res;
          })
          .catch(async (error) => {
            const hit = cacheable && (await caches.match(key, { ignoreSearch: true }));
            if (hit) return hit;
            throw error;
          })
          .then(wrap),
      );
    });
  }
})(self);
