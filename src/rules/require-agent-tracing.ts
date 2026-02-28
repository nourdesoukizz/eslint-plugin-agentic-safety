import { ESLintUtils, AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
  DEFAULT_AGENT_PATTERNS,
  matchesAgentPattern,
} from "../utils/agent-patterns.js";
import { getFunctionName } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

type Options = [
  {
    agentPatterns?: string[];
    tracingPatterns?: string[];
    checkDepth?: number;
  },
];

const DEFAULT_TRACING_PATTERNS = [
  "*trace*",
  "*Trace*",
  "*span*",
  "*Span*",
  "*startSpan*",
  "*startTrace*",
  "*withTracing*",
  "*instrument*",
  "*Instrument*",
  "*telemetry*",
  "*Telemetry*",
  "*correlationId*",
  "*traceId*",
  "*spanId*",
];

function statementContainsTracingCall(
  stmt: TSESTree.Statement,
  tracingPatterns: string[],
): boolean {
  if (stmt.type === AST_NODE_TYPES.ExpressionStatement) {
    return expressionMatchesTracing(stmt.expression, tracingPatterns);
  }
  if (stmt.type === AST_NODE_TYPES.VariableDeclaration) {
    return stmt.declarations.some(
      (decl) =>
        decl.init != null &&
        expressionMatchesTracing(decl.init, tracingPatterns),
    );
  }
  if (stmt.type === AST_NODE_TYPES.ReturnStatement && stmt.argument) {
    return expressionMatchesTracing(stmt.argument, tracingPatterns);
  }
  return false;
}

function expressionMatchesTracing(
  node: TSESTree.Expression,
  tracingPatterns: string[],
): boolean {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    const name = getExprName(node.callee);
    if (name && tracingPatterns.some((p) => matchesAgentPattern(name, [p]))) {
      return true;
    }
  }
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return expressionMatchesTracing(node.argument, tracingPatterns);
  }
  return false;
}

function getExprName(node: TSESTree.Expression): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) return node.name;
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    const objName = getExprName(node.object);
    if (objName) return `${objName}.${node.property.name}`;
    return node.property.name;
  }
  return null;
}

export default createRule<Options, "missingTracing">({
  name: "require-agent-tracing",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require tracing/observability hooks in agent execution functions",
    },
    messages: {
      missingTracing:
        "Agent function '{{name}}' lacks tracing instrumentation. Add a span/trace creation call (e.g., `tracer.startSpan(...)`) in the first statements.",
    },
    schema: [
      {
        type: "object",
        properties: {
          agentPatterns: {
            type: "array",
            items: { type: "string" },
          },
          tracingPatterns: {
            type: "array",
            items: { type: "string" },
          },
          checkDepth: { type: "number" },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const agentPatterns = options.agentPatterns ?? DEFAULT_AGENT_PATTERNS;
    const tracingPatterns = options.tracingPatterns ?? DEFAULT_TRACING_PATTERNS;
    const checkDepth = options.checkDepth ?? 5;

    function checkFunction(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ) {
      const name = getFunctionName(node);
      if (!name) return;
      if (!matchesAgentPattern(name, agentPatterns)) return;

      let body: TSESTree.Statement[];
      if (node.body.type === AST_NODE_TYPES.BlockStatement) {
        body = node.body.body;
      } else {
        // Arrow function with expression body — skip
        return;
      }

      const stmtsToCheck = body.slice(0, checkDepth);
      const hasTracing = stmtsToCheck.some((stmt) =>
        statementContainsTracingCall(stmt, tracingPatterns),
      );

      if (!hasTracing) {
        context.report({
          node,
          messageId: "missingTracing",
          data: { name },
        });
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
