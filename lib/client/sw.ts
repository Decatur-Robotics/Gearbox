import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist } from "serwist";
import { request } from "@/lib/TheOrangeAlliance";

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
	runtimeCaching: [
		{
			matcher: ({ request }) => {
				console.log(request);
				return request.destination === "" && request.url.includes("api");
			},
			handler: new CacheFirst({
				cacheName: "api",
			}),
		},
		...defaultCache,
	],
	fallbacks: {
		entries: [
			{
				url: "/offline",
				matcher: ({ request }) => request.mode === "navigate",
			},
		],
	},
});

self.addEventListener("fetch", async (event) => {
	console.log(event.request);
	event.respondWith(
		await serwist.handleRequest({ request: event.request, event: event })!,
	);
});

serwist.addEventListeners();
