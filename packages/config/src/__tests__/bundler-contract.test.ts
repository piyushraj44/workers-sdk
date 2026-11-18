import {
	DEFAULT_MODULE_RULES,
	getNodeCompat,
	NODEJS_COMPAT_DEFAULT_ON_DATE,
} from "@cloudflare/workers-utils";
import { describe, it } from "vitest";
import { getBundlerContract } from "../bundler-contract";

describe("getBundlerContract()", () => {
	it("returns Wrangler's resolve conditions", ({ expect }) => {
		const { conditions } = getBundlerContract({
			compatibilityDate: "2026-09-17",
		});

		expect(conditions).toEqual(["workerd", "worker", "browser"]);
	});

	it("returns the `cloudflare:` modules the Vite plugin treats as built-ins", ({
		expect,
	}) => {
		const { builtinModules } = getBundlerContract({
			compatibilityDate: "2026-09-17",
		});

		expect(builtinModules).toEqual([
			"cloudflare:durable-objects",
			"cloudflare:email",
			"cloudflare:node",
			"cloudflare:sockets",
			"cloudflare:workers",
			"cloudflare:workflows",
		]);
		for (const specifier of builtinModules) {
			expect(specifier.startsWith("cloudflare:")).toBe(true);
		}
	});

	it("returns the default module rules in order", ({ expect }) => {
		const { moduleRules } = getBundlerContract({
			compatibilityDate: "2026-09-17",
		});

		expect(moduleRules).toEqual(DEFAULT_MODULE_RULES);
		expect(moduleRules).toEqual([
			{ type: "Text", globs: ["**/*.txt", "**/*.html", "**/*.sql"] },
			{ type: "Data", globs: ["**/*.bin"] },
			{ type: "CompiledWasm", globs: ["**/*.wasm", "**/*.wasm?module"] },
		]);
	});

	it("returns new objects and arrays on every call", ({ expect }) => {
		const options = { compatibilityDate: "2026-09-17" };
		const defaultModuleRules = structuredClone(DEFAULT_MODULE_RULES);
		const first = getBundlerContract(options);
		const second = getBundlerContract(options);

		expect(first.conditions).not.toBe(second.conditions);
		expect(first.builtinModules).not.toBe(second.builtinModules);
		expect(first.nodejsCompat).not.toBe(second.nodejsCompat);
		expect(first.define).not.toBe(second.define);
		expect(first.moduleRules).not.toBe(second.moduleRules);

		first.conditions.push("node");
		first.builtinModules.pop();
		first.moduleRules[0]?.globs.push("**/*.md");
		first.moduleRules.reverse();
		first.moduleRules.push({ type: "ESModule", globs: ["**/*.js"] });

		const third = getBundlerContract(options);
		expect(third).toEqual(second);
		expect(DEFAULT_MODULE_RULES).toEqual(defaultModuleRules);
		for (const [index, rule] of third.moduleRules.entries()) {
			expect(rule).not.toBe(DEFAULT_MODULE_RULES[index]);
			expect(rule.globs).not.toBe(DEFAULT_MODULE_RULES[index]?.globs);
		}
	});

	describe("nodejsCompat.mode", () => {
		it.for([
			{ compatibilityDate: "2024-01-01", compatibilityFlags: [], mode: null },
			{
				compatibilityDate: "2024-01-01",
				compatibilityFlags: ["nodejs_compat"],
				mode: "v1",
			},
			{
				compatibilityDate: "2024-09-22",
				compatibilityFlags: ["nodejs_compat"],
				mode: "v1",
			},
			{
				compatibilityDate: "2024-09-23",
				compatibilityFlags: ["nodejs_compat"],
				mode: "v2",
			},
			{
				compatibilityDate: "2024-01-01",
				compatibilityFlags: ["nodejs_compat", "nodejs_compat_v2"],
				mode: "v2",
			},
			{
				compatibilityDate: "2025-01-01",
				compatibilityFlags: ["nodejs_compat", "no_nodejs_compat_v2"],
				mode: "v1",
			},
			{
				compatibilityDate: "2024-01-01",
				compatibilityFlags: ["nodejs_als"],
				mode: "als",
			},
			{
				compatibilityDate: NODEJS_COMPAT_DEFAULT_ON_DATE,
				compatibilityFlags: [],
				mode: "v2",
			},
			{ compatibilityDate: "2026-08-03", compatibilityFlags: [], mode: null },
			// From the default-on date, `nodejs_compat_v2` has to be turned off
			// separately, with `no_nodejs_compat_v2`.
			{
				compatibilityDate: NODEJS_COMPAT_DEFAULT_ON_DATE,
				compatibilityFlags: ["no_nodejs_compat"],
				mode: "v2",
			},
		])(
			"is $mode for $compatibilityDate with $compatibilityFlags",
			({ compatibilityDate, compatibilityFlags, mode }, { expect }) => {
				const { nodejsCompat } = getBundlerContract({
					compatibilityDate,
					compatibilityFlags,
				});

				expect(nodejsCompat.mode).toBe(mode);
				expect(nodejsCompat.mode).toBe(
					getNodeCompat(compatibilityDate, compatibilityFlags).mode
				);
			}
		);
	});

	describe("define", () => {
		const navigatorUserAgent = {
			"navigator.userAgent": '"Cloudflare-Workers"',
		};

		it.for([
			{
				compatibilityDate: "2022-03-21",
				compatibilityFlags: [],
				define: navigatorUserAgent,
			},
			{ compatibilityDate: "2022-03-20", compatibilityFlags: [], define: {} },
			{
				compatibilityDate: "2022-03-20",
				compatibilityFlags: ["global_navigator"],
				define: navigatorUserAgent,
			},
			{
				compatibilityDate: "2022-03-21",
				compatibilityFlags: ["no_global_navigator"],
				define: {},
			},
		])(
			"is $define for $compatibilityDate with $compatibilityFlags",
			({ compatibilityDate, compatibilityFlags, define }, { expect }) => {
				expect(
					getBundlerContract({ compatibilityDate, compatibilityFlags }).define
				).toEqual(define);
			}
		);

		it("throws when `global_navigator` and `no_global_navigator` are both set", ({
			expect,
		}) => {
			expect(() =>
				getBundlerContract({
					compatibilityDate: "2022-03-21",
					compatibilityFlags: ["global_navigator", "no_global_navigator"],
				})
			).toThrow(
				'Conflicting compatibility flags: "global_navigator" and "no_global_navigator" cannot both be set. Remove one of these flags from your configuration.'
			);
		});
	});

	it.for([
		"2022-03-20",
		"2022-03-21",
		"2024-09-23",
		NODEJS_COMPAT_DEFAULT_ON_DATE,
	])(
		"treats omitted compatibility flags as none for %s",
		(compatibilityDate, { expect }) => {
			expect(getBundlerContract({ compatibilityDate })).toEqual(
				getBundlerContract({ compatibilityDate, compatibilityFlags: [] })
			);
		}
	);
});
