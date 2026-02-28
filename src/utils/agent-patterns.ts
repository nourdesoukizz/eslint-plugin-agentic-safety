import { TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";
import { minimatch } from "minimatch";

export const DEFAULT_AGENT_PATTERNS: string[] = [
  "*Agent*",
  "*agent*",
  "*LLM*",
  "*llm*",
  "*Chat*",
  "*chat*",
  "*invoke*",
  "*completion*",
  "*generate*",
  "*predict*",
  "*embed*",
];

export const agentPatternsSchema = {
  type: "object" as const,
  properties: {
    agentPatterns: {
      type: "array" as const,
      items: { type: "string" as const },
      description:
        "Glob patterns to identify agent/LLM-related function calls",
    },
  },
  additionalProperties: false,
} as const;

export function matchesAgentPattern(
  name: string,
  patterns: string[] = DEFAULT_AGENT_PATTERNS,
): boolean {
  return patterns.some((pattern) => minimatch(name, pattern));
}

export function getCalleeNameFromExpression(
  node: TSESTree.Expression,
): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed
  ) {
    if (node.property.type === AST_NODE_TYPES.Identifier) {
      return node.property.name;
    }
  }
  return null;
}

export function getFullCalleeName(
  node: TSESTree.Expression,
): string | null {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }
  if (node.type === AST_NODE_TYPES.MemberExpression && !node.computed) {
    const objectName = getFullCalleeName(
      node.object as TSESTree.Expression,
    );
    if (
      objectName &&
      node.property.type === AST_NODE_TYPES.Identifier
    ) {
      return `${objectName}.${node.property.name}`;
    }
  }
  return null;
}

export function isAgentCall(
  node: TSESTree.CallExpression,
  patterns: string[] = DEFAULT_AGENT_PATTERNS,
): boolean {
  const calleeName = getCalleeNameFromExpression(node.callee);
  if (calleeName && matchesAgentPattern(calleeName, patterns)) {
    return true;
  }
  const fullName = getFullCalleeName(node.callee);
  if (fullName && matchesAgentPattern(fullName, patterns)) {
    return true;
  }
  return false;
}
