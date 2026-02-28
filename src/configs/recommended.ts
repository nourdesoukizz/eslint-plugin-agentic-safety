import type { TSESLint } from "@typescript-eslint/utils";

export function createRecommendedConfig(
  plugin: TSESLint.FlatConfig.Plugin,
): TSESLint.FlatConfig.Config {
  return {
    plugins: {
      "agentic-safety": plugin,
    },
    rules: {
      "agentic-safety/require-agent-timeout": "error",
      "agentic-safety/no-swallowed-agent-error": "error",
      "agentic-safety/require-structured-error": "warn",
      "agentic-safety/no-unbounded-agent-loop": "error",
      "agentic-safety/require-agent-tracing": "warn",
      "agentic-safety/no-fire-and-forget-agent": "error",
    },
  };
}
