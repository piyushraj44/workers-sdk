---
"@cloudflare/workers-utils": minor
---

Export `WORKERD_RESOLVE_CONDITIONS`, `CLOUDFLARE_BUILTIN_MODULES` and `isNavigatorDefined()`

These are the default resolve conditions for Worker code, the `cloudflare:` modules that workerd provides, and whether workerd defines `navigator` for a compatibility date and flags. Wrangler, the Vite plugin and `@cloudflare/config` now read them from one place instead of keeping their own copies.
