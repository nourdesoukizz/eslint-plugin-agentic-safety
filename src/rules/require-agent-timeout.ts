import { ESLintUtils, AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import {
  DEFAULT_AGENT_PATTERNS,
  isAgentCall,
} from "../utils/agent-patterns.js";
import { findAncestor } from "../utils/ast-helpers.js";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

type Options = [
  {
    agentPatterns?: string[];
    timeoutMs?: number;
    timeoutWrapperPatterns?: string[];
  },
];

const DEFAULT_TIMEOUT_WRAPPERS = [
  "Promise.race",
  "pTimeout",
  "withTimeout",
  "asyncTimeout",
];

function hasTimeoutOrSignalArg(node: TSESTree.CallExpression): boolean {
  for (const arg of node.arguments) {
    if (arg.type === AST_NODE_TYPES.ObjectExpression) {
      for (const prop of arg.properties) {
        if (
          prop.type === AST_NODE_TYPES.Property &&
          prop.key.type === AST_NODE_TYPES.Identifier &&
          (prop.key.name === "signal" || prop.key.name === "timeout")
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function isWrappedInTimeoutUtility(
  node: TSESTree.Node,
  wrapperPatterns: string[],
): boolean {
  const callAncestor = findAncestor(
    node,
    (n) => n.type === AST_NODE_TYPES.CallExpression,
  );
  if (!callAncestor || callAncestor.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const callee = callAncestor.callee;

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return wrapperPatterns.includes(callee.name);
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    !callee.computed
  ) {
    const obj =
      callee.object.type === AST_NODE_TYPES.Identifier
        ? callee.object.name
        : null;
    const prop =
      callee.property.type === AST_NODE_TYPES.Identifier
        ? callee.property.name
        : null;
    if (obj && prop) {
      return wrapperPatterns.includes(`${obj}.${prop}`);
    }
  }
  return false;
}

function hasAbortControllerInScope(node: TSESTree.Node): boolean {
  // Walk up to the function body and check for AbortController declarations
  const funcAncestor = findAncestor(
    node,
    (n) =>
      n.type === AST_NODE_TYPES.FunctionDeclaration ||
      n.type === AST_NODE_TYPES.FunctionExpression ||
      n.type === AST_NODE_TYPES.ArrowFunctionExpression,
  );
  if (!funcAncestor) return false;

  let body: TSESTree.Statement[] | null = null;
  if (funcAncestor.type === AST_NODE_TYPES.FunctionDeclaration ||
      funcAncestor.type === AST_NODE_TYPES.FunctionExpression) {
    body = (funcAncestor as TSESTree.FunctionDeclaration).body?.body ?? null;
  } else if (funcAncestor.type === AST_NODE_TYPES.ArrowFunctionExpression) {
    const arrow = funcAncestor as TSESTree.ArrowFunctionExpression;
    if (arrow.body.type === AST_NODE_TYPES.BlockStatement) {
      body = arrow.body.body;
    }
  }

  if (!body) return false;

  return body.some(
    (stmt) =>
      stmt.type === AST_NODE_TYPES.VariableDeclaration &&
      stmt.declarations.some(
        (decl) =>
          decl.init?.type === AST_NODE_TYPES.NewExpression &&
          decl.init.callee.type === AST_NODE_TYPES.Identifier &&
          decl.init.callee.name === "AbortController",
      ),
  );
}

export default createRule<Options, "missingTimeout">({
  name: "require-agent-timeout",
  meta: {
    type: "problem",
    docs: {
      description:
        "Require timeout or AbortController signal on agent/LLM calls",
    },
    messages: {
      missingTimeout:
        "Agent/LLM call lacks a timeout or AbortSignal. Add a `{ signal }` or `{ timeout }` option to prevent indefinite hangs.",
    },
    schema: [
      {
        type: "object",
        properties: {
          agentPatterns: {
            type: "array",
            items: { type: "string" },
          },
          timeoutMs: { type: "number" },
          timeoutWrapperPatterns: {
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
    const wrapperPatterns =
      options.timeoutWrapperPatterns ?? DEFAULT_TIMEOUT_WRAPPERS;

    return {
      AwaitExpression(node) {
        const arg = node.argument;
        if (arg.type !== AST_NODE_TYPES.CallExpression) return;
        if (!isAgentCall(arg, patterns)) return;

        if (hasTimeoutOrSignalArg(arg)) return;
        if (isWrappedInTimeoutUtility(node, wrapperPatterns)) return;
        if (hasAbortControllerInScope(node)) return;

        context.report({
          node,
          messageId: "missingTimeout",
        });
      },
    };
  },
});
