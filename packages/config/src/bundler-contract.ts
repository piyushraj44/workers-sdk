// Import the focused entry points rather than the package barrel, which would
// bundle most of `@cloudflare/workers-utils` and its dependencies into this
// package.
import {
	CLOUDFLARE_BUILTIN_MODULES,
	DEFAULT_MODULE_RULES,
	isNavigatorDefined,
	WORKERD_RESOLVE_CONDITIONS,
} from "@cloudflare/workers-utils/bundling";
import { getNodeCompat } from "@cloudflare/workers-utils/node-compat";

/** The Worker settings that {@link getBundlerContract} depends on. */
export interface BundlerContractOptions {
	/** The compatibility date the Worker runs with, after applying any tool default. */
	compatibilityDate: string;
	/** The Worker's compatibility flags. */
	compatibilityFlags?: string[];
}

/**
 * A module rule, in the same shape as the rules in a Worker's `rules` config.
 * Imports whose paths match one of `globs` are loaded as `type` instead of
 * being bundled as JavaScript.
 */
export interface BundlerModuleRule {
	/** The module type for imports that match the rule. */
	type:
		| "ESModule"
		| "CommonJS"
		| "CompiledWasm"
		| "Text"
		| "Data"
		| "PythonModule"
		| "PythonRequirement";
	/** Globs matched against the import paths. */
	globs: string[];
	/**
	 * Whether later rules of the same `type` still apply. Without it, they are
	 * ignored.
	 */
	fallthrough?: boolean;
}

/** The Workers runtime facts a bundler needs to build a Worker. */
export interface BundlerContract {
	/**
	 * The `package.json` export conditions to resolve with, in addition to the
	 * bundler's own `import`, `require` and `default` conditions. These match
	 * Wrangler. The Vite plugin also adds `module` and a `development` or
	 * `production` condition.
	 */
	conditions: string[];
	/**
	 * The `cloudflare:` modules that workerd provides at runtime. Keep imports
	 * of these external. Wrangler externalises every `cloudflare:` specifier.
	 */
	builtinModules: string[];
	/** The Node.js compatibility that workerd provides. */
	nodejsCompat: {
		/**
		 * - `"v2"`: apply `getCloudflarePreset({ compatibilityDate, compatibilityFlags })`
		 *   from `@cloudflare/unenv-preset` through unenv's `defineEnv()` for
		 *   the aliases, injects, polyfills and externals. This is when Wrangler
		 *   and the Vite plugin apply it.
		 * - `"v1"`: workerd provides the `node:`-prefixed modules only, with no
		 *   polyfills.
		 * - `"als"`: workerd provides only `node:async_hooks`.
		 * - `null`: no Node.js compatibility.
		 */
		mode: "als" | "v1" | "v2" | null;
	};
	/**
	 * Compile-time replacements, in the form esbuild's `define` takes: each
	 * value is a JavaScript expression. The `process.env.NODE_ENV` replacement
	 * depends on each tool's build mode, so it is left to the tool.
	 */
	define: Record<string, string>;
	/**
	 * The default module rules. Apply them after the Worker's own `rules`. The
	 * first rule that matches an import wins.
	 */
	moduleRules: BundlerModuleRule[];
}

/**
 * Get the Workers runtime facts a bundler needs to build a Worker: the
 * resolve conditions, workerd's `cloudflare:` built-in modules, the Node.js
 * compatibility mode, compile-time defines and the default module rules.
 *
 * Wrangler and the Vite plugin share these values, so a bundler integration
 * that uses them builds Workers the same way.
 *
 * @param options The Worker's compatibility date and flags
 * @returns The contract for the Worker. Every call returns new objects and
 * arrays, so callers can change them.
 * @throws {Error} A `UserError`, as reported by Wrangler, if both the
 * `global_navigator` and `no_global_navigator` compatibility flags are set.
 *
 * @example
 * ```typescript
 * import { getBundlerContract } from "@cloudflare/config";
 *
 * const contract = getBundlerContract({
 *   compatibilityDate: "2025-09-17",
 *   compatibilityFlags: ["nodejs_compat"],
 * });
 * // contract.conditions: ["workerd", "worker", "browser"]
 * // contract.nodejsCompat.mode: "v2"
 * ```
 */
export function getBundlerContract(
	options: BundlerContractOptions
): BundlerContract {
	const { compatibilityDate, compatibilityFlags = [] } = options;

	return {
		conditions: [...WORKERD_RESOLVE_CONDITIONS],
		builtinModules: [...CLOUDFLARE_BUILTIN_MODULES],
		nodejsCompat: {
			mode: getNodeCompat(compatibilityDate, compatibilityFlags).mode,
		},
		define: isNavigatorDefined(compatibilityDate, compatibilityFlags)
			? { "navigator.userAgent": JSON.stringify("Cloudflare-Workers") }
			: {},
		moduleRules: DEFAULT_MODULE_RULES.map((rule) => ({
			...rule,
			globs: [...rule.globs],
		})),
	};
}
