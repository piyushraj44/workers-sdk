---
"@cloudflare/config": minor
---

Add `getBundlerContract()` for building Workers with other bundlers

`getBundlerContract({ compatibilityDate, compatibilityFlags })` returns the Workers runtime facts that a bundler needs: the resolve conditions, the `cloudflare:` modules to keep external, the Node.js compatibility mode, compile-time defines and the default module rules. The values come from the same helpers Wrangler and the Vite plugin use, so bundler integrations no longer need to copy them or import them from internal packages.
