import { ESLintUtils, AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
  DEFAULT_AGENT_PATTERNS,
  isAgentCall,
} from "../utils/agent-patterns.js";
import { bodyContainsCallMatching } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

type Options = [{ agentPatterns?: string[]; maxIterations?: number }];

function getLoopBody(
  node: TSESTree.WhileStatement | TSESTree.ForStatement | TSESTree.DoWhileStatement,
): TSESTree.Statement[] | null {
  if (node.body.type === AST_NODE_TYPES.BlockStatement) {
    return node.body.body;
  }
  return null;
}

function isStandardBoundedForLoop(node: TSESTree.ForStatement): boolean {
  // Check for standard for(let i = 0; i < N; i++) form
  if (!node.init || !node.test || !node.update) return false;

  // init must declare or assign a counter
  const hasInit =
    node.init.type === AST_NODE_TYPES.VariableDeclaration ||
    node.init.type === AST_NODE_TYPES.AssignmentExpression;

  // test must be a binary comparison
  const hasComparison =
    node.test.type === AST_NODE_TYPES.BinaryExpression &&
    ["<", "<=", ">", ">=", "!=", "!=="].includes(node.test.operator);

  // update must be an increment/decrement
  const hasUpdate =
    node.update.type === AST_NODE_TYPES.UpdateExpression ||
    node.update.type === AST_NODE_TYPES.AssignmentExpression;

  return hasInit && hasComparison && hasUpdate;
}

function testHasComparisonGuard(
  test: TSESTree.Expression | null,
): boolean {
  if (!test) return false;

  if (test.type === AST_NODE_TYPES.BinaryExpression) {
    if (["<", "<=", ">", ">=", "!=", "!=="].includes(test.operator)) {
      return true;
    }
  }

  // Check logical expressions: condition && counter < max
  if (test.type === AST_NODE_TYPES.LogicalExpression) {
    return (
      testHasComparisonGuard(test.left) ||
      testHasComparisonGuard(test.right)
    );
  }

  return false;
}

function bodyHasBreakGuard(body: TSESTree.Statement[]): boolean {
  for (const stmt of body) {
    if (
      stmt.type === AST_NODE_TYPES.IfStatement &&
      containsBreak(stmt.consequent)
    ) {
      return true;
    }
  }
  return false;
}

function containsBreak(node: TSESTree.Statement): boolean {
  if (node.type === AST_NODE_TYPES.BreakStatement) return true;
  if (node.type === AST_NODE_TYPES.BlockStatement) {
    return node.body.some(containsBreak);
  }
  if (node.type === AST_NODE_TYPES.ThrowStatement) return true;
  if (node.type === AST_NODE_TYPES.ReturnStatement) return true;
  return false;
}

export default createRule<Options, "unboundedLoop">({
  name: "no-unbounded-agent-loop",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow unbounded loops containing agent/LLM calls without iteration guards",
    },
    messages: {
      unboundedLoop:
        "Loop contains an agent/LLM call without a max iteration guard. Add a counter check, break condition, or use a bounded for-loop to prevent runaway loops.",
    },
    schema: [
      {
        type: "object",
        properties: {
          agentPatterns: {
            type: "array",
            items: { type: "string" },
          },
          maxIterations: { type: "number" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const patterns = options.agentPatterns ?? DEFAULT_AGENT_PATTERNS;

    function checkLoop(
      node: TSESTree.WhileStatement | TSESTree.ForStatement | TSESTree.DoWhileStatement,
    ) {
      const body = getLoopBody(node);
      if (!body) return;

      const hasAgentCall = bodyContainsCallMatching(body, (call) =>
        isAgentCall(call, patterns),
      );
      if (!hasAgentCall) return;

      // Standard bounded for-loop: for(let i=0; i<10; i++)
      if (
        node.type === AST_NODE_TYPES.ForStatement &&
        isStandardBoundedForLoop(node)
      ) {
        return;
      }

      // While/do-while with comparison guard in test
      if (
        (node.type === AST_NODE_TYPES.WhileStatement ||
          node.type === AST_NODE_TYPES.DoWhileStatement) &&
        testHasComparisonGuard(node.test)
      ) {
        return;
      }

      // ForStatement with comparison in test
      if (
        node.type === AST_NODE_TYPES.ForStatement &&
        testHasComparisonGuard(node.test)
      ) {
        return;
      }

      // Body has if-break/throw/return guard
      if (bodyHasBreakGuard(body)) {
        return;
      }

      context.report({ node, messageId: "unboundedLoop" });
    }

    return {
      WhileStatement: checkLoop,
      ForStatement: checkLoop,
      DoWhileStatement: checkLoop,
    };
  },
});
