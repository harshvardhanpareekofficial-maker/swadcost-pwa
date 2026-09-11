import { registerSW } from 'virtual:pwa-register'

/** Check for a new service worker on load and activate it (skipWaiting + clientsClaim). One reload per deploy is expected; clearing site data is not. */
registerSW({ immediate: true })
