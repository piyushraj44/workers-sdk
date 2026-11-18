import { assert, describe, test } from "vitest";
import {
	CLOUDFLARE_BUILTIN_MODULES,
	isNavigatorDefined,
	WORKERD_RESOLVE_CONDITIONS,
} from "../src/bundling";
import { UserError } from "../src/errors";

describe("WORKERD_RESOLVE_CONDITIONS", () => {
	test("lists the conditions Wrangler resolves Worker code with", ({
		expect,
	}) => {
		expect(WORKERD_RESOLVE_CONDITIONS).toEqual([
			"workerd",
			"worker",
			"browser",
		]);
	});
});

describe("CLOUDFLARE_BUILTIN_MODULES", () => {
	test("lists the `cloudflare:` modules workerd provides", ({ expect }) => {
		expect(CLOUDFLARE_BUILTIN_MODULES).toEqual([
			"cloudflare:durable-objects",
			"cloudflare:email",
			"cloudflare:node",
			"cloudflare:sockets",
			"cloudflare:workers",
			"cloudflare:workflows",
		]);
	});
});

describe("isNavigatorDefined", () => {
	test("default", ({ expect }) => {
		expect(isNavigatorDefined(undefined)).toBe(false);
	});

	test("modern date", ({ expect }) => {
		expect(isNavigatorDefined("2024-01-01")).toBe(true);
	});

	test("old date", ({ expect }) => {
		expect(isNavigatorDefined("2000-01-01")).toBe(false);
	});

	test("switch date", ({ expect }) => {
		expect(isNavigatorDefined("2022-03-21")).toBe(true);
	});

	test("before date", ({ expect }) => {
		expect(isNavigatorDefined("2022-03-20")).toBe(false);
	});

	test("old date, but with flag", ({ expect }) => {
		expect(isNavigatorDefined("2000-01-01", ["global_navigator"])).toBe(true);
	});

	test("old date, with disable flag", ({ expect }) => {
		expect(isNavigatorDefined("2000-01-01", ["no_global_navigator"])).toBe(
			false
		);
	});

	test("new date, but with disable flag", ({ expect }) => {
		expect(isNavigatorDefined("2024-01-01", ["no_global_navigator"])).toBe(
			false
		);
	});

	test("new date, with enable flag", ({ expect }) => {
		expect(isNavigatorDefined("2024-01-01", ["global_navigator"])).toBe(true);
	});

	test("errors with disable and enable flags specified", ({ expect }) => {
		try {
			isNavigatorDefined("2024-01-01", [
				"no_global_navigator",
				"global_navigator",
			]);
			assert(false, "Unreachable");
		} catch (e) {
			expect(e).toMatchInlineSnapshot(
				`[Error: Conflicting compatibility flags: "global_navigator" and "no_global_navigator" cannot both be set. Remove one of these flags from your configuration.]`
			);
		}
	});

	test("reports conflicting flags as a user error with a static telemetry message", ({
		expect,
	}) => {
		let error: unknown;
		try {
			isNavigatorDefined("2024-01-01", [
				"global_navigator",
				"no_global_navigator",
			]);
		} catch (e) {
			error = e;
		}
		assert(error instanceof UserError, "Expected a UserError");
		expect(error.telemetryMessage).toBe(
			"navigator user agent compatibility flags conflict"
		);
	});
});
