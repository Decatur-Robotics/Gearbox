const CACHE_VERSION = 13;
const CACHE_NAME = "gearbox/" + CACHE_VERSION;

const CHUNK_PREFIX = "/_next/static/chunks/";
const PAGE_PREFIX = CHUNK_PREFIX + "pages/";

const urlsToCache = [
	"/guide",
	// PAGE_PREFIX + "index.js",
	// PAGE_PREFIX + "guide.js",
	// PAGE_PREFIX + "_app.js",
	// CHUNK_PREFIX + "webpack.js",
	// CHUNK_PREFIX + "main.js",
	// "manifest.json",
	// "/",
];

self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				console.log(`Cache: ${event.request.url} ->`, response);
			} else console.log(`Network: ${event.request.url}`);
			return (
				response ||
				fetch(event.request).catch((e) => {
					console.log(`Fetch failed: ${event.request.url}`, e);
					return e;
				})
			);
		}),
	);
});

self.addEventListener("install", (event) => {
	console.log("Installing SW");

	// Cache resources
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Opened cache:", CACHE_NAME);
			return cache.addAll(urlsToCache);
		}),
	);
});

self.addEventListener("activate", (event) => {
	console.log("Activating SW");

	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log("Deleting cache:", cacheName);
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);

	clients.claim();
});
