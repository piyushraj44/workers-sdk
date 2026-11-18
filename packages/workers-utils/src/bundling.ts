import { UserError } from "./errors";

// Also exported here so the `/bundling` entry point carries every bundler
// default. Consumers that bundle that entry, such as `@cloudflare/config`, then
// don't pull in the package barrel and its dependencies.
export { DEFAULT_MODULE_RULES } from "./config/environment";

/**
 * The `package.json` export conditions Wrangler resolves Worker code with by
 * default.
 *
 * Bundlers use these in addition to their own `import`, `require` and
 * `default` conditions, so packages can publish builds for the Workers runtime.
 * Wrangler replaces them with `WRANGLER_BUILD_CONDITIONS` when that is set.
 */
export const WORKERD_RESOLVE_CONDITIONS: readonly string[] = [
	"workerd",
	"worker",
	"browser",
];

/**
 * The `cloudflare:` modules that workerd provides at runtime.
 *
 * They don't exist on disk, so bundlers must leave these imports in place
 * instead of trying to resolve and bundle them.
 */
export const CLOUDFLARE_BUILTIN_MODULES: readonly string[] = [
	"cloudflare:durable-objects",
	"cloudflare:email",
	"cloudflare:node",
	"cloudflare:sockets",
	"cloudflare:workers",
	"cloudflare:workflows",
];

/**
 * Whether workerd defines the global `navigator` for a Worker.
 *
 * When it does, bundlers can replace `navigator.userAgent` with
 * `"Cloudflare-Workers"` at compile time, so code that checks the user agent
 * to detect the Workers runtime keeps only the Workers branch.
 *
 * `navigator` is defined from the `2022-03-21` compatibility date onwards.
 * The `global_navigator` and `no_global_navigator` compatibility flags take
 * precedence over the date.
 *
 * @param compatibilityDate The Worker's compatibility date
 * @param compatibilityFlags The Worker's compatibility flags
 * @returns Whether `navigator` is defined at runtime
 * @throws {UserError} If both `global_navigator` and `no_global_navigator` are set
 */
export function isNavigatorDefined(
	compatibilityDate: string | undefined,
	compatibilityFlags: string[] = []
): boolean {
	if (
		compatibilityFlags.includes("global_navigator") &&
		compatibilityFlags.includes("no_global_navigator")
	) {
		throw new UserError(
			'Conflicting compatibility flags: "global_navigator" and "no_global_navigator" cannot both be set. Remove one of these flags from your configuration.',
			{
				telemetryMessage: "navigator user agent compatibility flags conflict",
			}
		);
	}

	if (compatibilityFlags.includes("global_navigator")) {
		return true;
	}
	if (compatibilityFlags.includes("no_global_navigator")) {
		return false;
	}
	return !!compatibilityDate && compatibilityDate >= "2022-03-21";
}
