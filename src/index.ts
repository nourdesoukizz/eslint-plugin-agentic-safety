import type { TSESLint } from "@typescript-eslint/utils";
import requireStructuredError from "./rules/require-structured-error.js";
import noSwallowedAgentError from "./rules/no-swallowed-agent-error.js";
import requireAgentTimeout from "./rules/require-agent-timeout.js";
import noFireAndForgetAgent from "./rules/no-fire-and-forget-agent.js";
import noUnboundedAgentLoop from "./rules/no-unbounded-agent-loop.js";
import requireAgentTracing from "./rules/require-agent-tracing.js";
import { createRecommendedConfig } from "./configs/recommended.js";

const rules = {
  "require-structured-error": requireStructuredError,
  "no-swallowed-agent-error": noSwallowedAgentError,
  "require-agent-timeout": requireAgentTimeout,
  "no-fire-and-forget-agent": noFireAndForgetAgent,
  "no-unbounded-agent-loop": noUnboundedAgentLoop,
  "require-agent-tracing": requireAgentTracing,
} as unknown as Record<string, TSESLint.RuleModule<string, unknown[]>>;

const plugin: TSESLint.FlatConfig.Plugin = {
  meta: {
    name: "eslint-plugin-agentic-safety",
    version: "0.1.0",
  },
  rules,
};

const configs = {
  recommended: createRecommendedConfig(plugin),
};

export default { ...plugin, configs };
export { rules, configs };
