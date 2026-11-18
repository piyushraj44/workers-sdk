# `@cloudflare/config`

Definitions and utilities for configuring Cloudflare Workers and related products.

This is not yet stable enough for external use — APIs may change without notice.

## Bundler contract

`getBundlerContract()` returns the Workers runtime facts that a bundler needs to build a Worker. Wrangler and the Vite plugin use the same values, apart from the differences listed at the end of this section.

- `conditions`: the `package.json` export conditions to resolve with, in addition to the bundler's own `import`, `require` and `default` conditions.
- `builtinModules`: the `cloudflare:` modules that workerd provides. Keep imports of these external.
- `nodejsCompat.mode`: the Node.js compatibility mode for the compatibility date and flags: `"v2"`, `"v1"`, `"als"` or `null`.
- `define`: compile-time replacements in the form esbuild's `define` takes, such as `navigator.userAgent` when workerd defines `navigator`. `process.env.NODE_ENV` isn't included, because its value depends on each tool's build mode.
- `moduleRules`: the default module rules. Apply them after the Worker's own `rules`. The first rule that matches an import wins.

Pass the Worker's compatibility date and flags. A parsed Worker config can be passed as it is. Every call returns new objects and arrays.

When `nodejsCompat.mode` is `"v2"`, apply the Cloudflare preset from `@cloudflare/unenv-preset` through unenv's `defineEnv()`, and pass the resulting aliases, injects, polyfills and externals to the bundler. Your integration needs its own `unenv` and `@cloudflare/unenv-preset` dependencies for this.

```ts
import { getBundlerContract } from "@cloudflare/config";
import { getCloudflarePreset } from "@cloudflare/unenv-preset";
import { defineEnv } from "unenv";

const compatibilityDate = "2025-09-17";
const compatibilityFlags = ["nodejs_compat"];

const contract = getBundlerContract({ compatibilityDate, compatibilityFlags });

if (contract.nodejsCompat.mode === "v2") {
	const { alias, inject, polyfill, external } = defineEnv({
		presets: [getCloudflarePreset({ compatibilityDate, compatibilityFlags })],
	}).env;
}
```

With `"v1"`, workerd provides only the `node:`-prefixed modules and there is nothing to polyfill. With `"als"`, it provides only `node:async_hooks`. With `null`, there is no Node.js compatibility.

Known differences between the tools, which the contract doesn't cover:

- The Vite plugin also resolves with the `module` condition and a `development` or `production` condition. It replaces `process.env` with `{}` when Node.js compatibility is off, doesn't define `navigator.userAgent`, and rejects the `"v1"` mode.
- Wrangler applies the unenv preset with npm shims enabled, keeping the real `debug` package.
