import { ESLintUtils, AST_NODE_TYPES } from "@typescript-eslint/utils";
import {
  DEFAULT_AGENT_PATTERNS,
  isAgentCall,
} from "../utils/agent-patterns.js";
import {
  bodyContainsCallMatching,
  hasErrorHandling,
} from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

type Options = [{ agentPatterns?: string[] }];

export default createRule<Options, "swallowedError">({
  name: "no-swallowed-agent-error",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow catch blocks that silently swallow errors from agent/LLM calls",
    },
    messages: {
      swallowedError:
        "This catch block swallows an error from an agent/LLM call. Re-throw, log, or return the error to avoid silent failures.",
    },
    schema: [
      {
        type: "object",
        properties: {
          agentPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const patterns = options.agentPatterns ?? DEFAULT_AGENT_PATTERNS;

    return {
      CatchClause(node) {
        const tryStatement = node.parent;
        if (tryStatement?.type !== AST_NODE_TYPES.TryStatement) return;

        const tryBody = tryStatement.block.body;
        const hasAgentCall = bodyContainsCallMatching(tryBody, (call) =>
          isAgentCall(call, patterns),
        );

        if (!hasAgentCall) return;

        const catchBody = node.body.body;
        if (catchBody.length === 0 || !hasErrorHandling(catchBody)) {
          context.report({
            node,
            messageId: "swallowedError",
          });
        }
      },
    };
  },
});
