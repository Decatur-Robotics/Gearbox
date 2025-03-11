import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[];
	}
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	skipWaiting: true,
	clientsClaim: true,
	navigationPreload: true,
	runtimeCaching: defaultCache,
	fallbacks: {
		entries: [
			{
				url: "/offline",
				matcher: ({ request }) => request.mode === "navigate",
			},
		],
	},
});

// self.addEventListener("fetch", async (event) => {
// 	console.log(event.request);
// 	event.respondWith(
// 		await serwist.handleRequest({ request: event.request, event: event })!,
// 	);
// });

serwist.addEventListeners();
