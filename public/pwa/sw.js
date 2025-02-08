self.addEventListener("fetch", (event) => {
  console.log("Fetching SW:", event.request.url);
  event.respondWith(fetch(event.request));
});

self.addEventListener("activate", (event) => {
  console.log("Activating SW");
});

self.addEventListener("install", (event) => {
  console.log("Installing SW");
});