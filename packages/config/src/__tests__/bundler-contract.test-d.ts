// A parsed Worker config names its compatibility settings the way the bundler
// contract does, so tools can pass it to `getBundlerContract()` as it is.
import { getBundlerContract } from "../index";
import type { BundlerModuleRule, ParsedWorkerConfig } from "../index";
import type { ConfigModuleRuleType, Rule } from "@cloudflare/workers-utils";

declare const workerConfig: ParsedWorkerConfig;
const contract = getBundlerContract(workerConfig);
void contract;

// The module rules must accept exactly the rule types Wrangler's `rules`
// config does. This package declares `BundlerModuleRule` itself, instead of
// reusing `Rule`, so its published types don't depend on
// `@cloudflare/workers-utils`.
type _AssertModuleRulesMatchWrangler = [
	BundlerModuleRule["type"] extends ConfigModuleRuleType ? true : false,
	ConfigModuleRuleType extends BundlerModuleRule["type"] ? true : false,
	BundlerModuleRule extends Rule ? true : false,
	Rule extends BundlerModuleRule ? true : false,
];
const _assertModuleRulesMatchWrangler: _AssertModuleRulesMatchWrangler = [
	true,
	true,
	true,
	true,
];
void _assertModuleRulesMatchWrangler;
