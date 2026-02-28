import { ESLintUtils, AST_NODE_TYPES } from "@typescript-eslint/utils";
import {
  DEFAULT_AGENT_PATTERNS,
  isAgentCall,
} from "../utils/agent-patterns.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

type Options = [{ agentPatterns?: string[] }];

export default createRule<Options, "fireAndForget" | "missingCatch">({
  name: "no-fire-and-forget-agent",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow fire-and-forget calls to agent/LLM functions without await or error handling",
    },
    messages: {
      fireAndForget:
        "Agent/LLM call is fire-and-forget. Use `await`, assign to a variable, or return the result to ensure errors are handled.",
      missingCatch:
        "Agent/LLM `.then()` chain is missing a `.catch()` handler. Add `.catch()` or use `await` with try/catch.",
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
      CallExpression(node) {
        // Check for .then() without .catch() pattern
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "then"
        ) {
          // Check if the object being .then'd is an agent call
          const thenObject = node.callee.object;
          if (
            thenObject.type === AST_NODE_TYPES.CallExpression &&
            isAgentCall(thenObject, patterns)
          ) {
            // Check if this .then() is followed by .catch()
            if (!hasCatchChain(node)) {
              context.report({ node, messageId: "missingCatch" });
            }
            return;
          }
        }

        if (!isAgentCall(node, patterns)) return;

        const parent = node.parent;
        if (!parent) return;

        // Valid: await agent.run()
        if (parent.type === AST_NODE_TYPES.AwaitExpression) return;

        // Valid: const result = agent.run()
        if (parent.type === AST_NODE_TYPES.VariableDeclarator) return;

        // Valid: return agent.run()
        if (parent.type === AST_NODE_TYPES.ReturnStatement) return;

        // Valid: arr.push(agent.run()) or similar argument usage
        if (parent.type === AST_NODE_TYPES.CallExpression) return;

        // Valid: yield agent.run()
        if (parent.type === AST_NODE_TYPES.YieldExpression) return;

        // Valid: being .then()'d - handled above
        if (
          parent.type === AST_NODE_TYPES.MemberExpression &&
          parent.parent?.type === AST_NODE_TYPES.CallExpression
        ) {
          return;
        }

        // Invalid: bare statement - agent.run();
        if (parent.type === AST_NODE_TYPES.ExpressionStatement) {
          context.report({ node, messageId: "fireAndForget" });
        }
      },
    };
  },
});

function hasCatchChain(thenCall: import("@typescript-eslint/utils").TSESTree.CallExpression): boolean {
  const parent = thenCall.parent;
  // Check if .then() result is .catch()'d: agent.run().then(...).catch(...)
  if (
    parent?.type === AST_NODE_TYPES.MemberExpression &&
    parent.property.type === AST_NODE_TYPES.Identifier &&
    parent.property.name === "catch"
  ) {
    return true;
  }
  return false;
}
