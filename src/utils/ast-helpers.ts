import { TSESTree, AST_NODE_TYPES } from "@typescript-eslint/utils";

export function findAncestor(
  node: TSESTree.Node,
  predicate: (n: TSESTree.Node) => boolean,
): TSESTree.Node | null {
  let current = node.parent;
  while (current) {
    if (predicate(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

export function isAwaited(node: TSESTree.Node): boolean {
  return node.parent?.type === AST_NODE_TYPES.AwaitExpression;
}

export function isReturnValueIgnored(node: TSESTree.Node): boolean {
  return node.parent?.type === AST_NODE_TYPES.ExpressionStatement;
}

export function bodyContainsCallMatching(
  body: TSESTree.Statement[],
  predicate: (node: TSESTree.CallExpression) => boolean,
): boolean {
  for (const stmt of body) {
    if (walkStatementForCall(stmt, predicate)) {
      return true;
    }
  }
  return false;
}

function walkStatementForCall(
  node: TSESTree.Node,
  predicate: (node: TSESTree.CallExpression) => boolean,
): boolean {
  if (
    node.type === AST_NODE_TYPES.ExpressionStatement &&
    walkExpressionForCall(node.expression, predicate)
  ) {
    return true;
  }

  if (node.type === AST_NODE_TYPES.VariableDeclaration) {
    for (const decl of node.declarations) {
      if (decl.init && walkExpressionForCall(decl.init, predicate)) {
        return true;
      }
    }
  }

  if (node.type === AST_NODE_TYPES.ReturnStatement && node.argument) {
    if (walkExpressionForCall(node.argument, predicate)) {
      return true;
    }
  }

  if (node.type === AST_NODE_TYPES.IfStatement) {
    if (
      node.consequent.type === AST_NODE_TYPES.BlockStatement &&
      bodyContainsCallMatching(node.consequent.body, predicate)
    ) {
      return true;
    }
    if (
      node.alternate?.type === AST_NODE_TYPES.BlockStatement &&
      bodyContainsCallMatching(node.alternate.body, predicate)
    ) {
      return true;
    }
  }

  if (
    node.type === AST_NODE_TYPES.TryStatement &&
    bodyContainsCallMatching(node.block.body, predicate)
  ) {
    return true;
  }

  return false;
}

function walkExpressionForCall(
  node: TSESTree.Expression,
  predicate: (node: TSESTree.CallExpression) => boolean,
): boolean {
  if (node.type === AST_NODE_TYPES.CallExpression) {
    if (predicate(node)) return true;
    // Check nested calls like agent.run().then(...)
    if (
      node.callee.type === AST_NODE_TYPES.MemberExpression &&
      walkExpressionForCall(node.callee.object, predicate)
    ) {
      return true;
    }
  }
  if (node.type === AST_NODE_TYPES.AwaitExpression) {
    return walkExpressionForCall(node.argument, predicate);
  }
  return false;
}

export function getFunctionName(
  node:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
): string | null {
  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
    return node.id.name;
  }
  if (
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression
  ) {
    if (node.parent?.type === AST_NODE_TYPES.VariableDeclarator) {
      const declarator = node.parent as TSESTree.VariableDeclarator;
      if (declarator.id.type === AST_NODE_TYPES.Identifier) {
        return declarator.id.name;
      }
    }
    if (node.parent?.type === AST_NODE_TYPES.Property) {
      const prop = node.parent as TSESTree.Property;
      if (prop.key.type === AST_NODE_TYPES.Identifier) {
        return prop.key.name;
      }
    }
    if (node.parent?.type === AST_NODE_TYPES.MethodDefinition) {
      const method = node.parent as TSESTree.MethodDefinition;
      if (method.key.type === AST_NODE_TYPES.Identifier) {
        return method.key.name;
      }
    }
  }
  return null;
}

const LOGGING_PATTERNS = [
  "console.error",
  "console.warn",
  "console.log",
  "logger.error",
  "logger.warn",
  "logger.info",
  "log.error",
  "log.warn",
  "log.info",
];

export function hasErrorHandling(body: TSESTree.Statement[]): boolean {
  for (const stmt of body) {
    if (stmt.type === AST_NODE_TYPES.ThrowStatement) {
      return true;
    }
    if (stmt.type === AST_NODE_TYPES.ReturnStatement) {
      return true;
    }
    if (stmt.type === AST_NODE_TYPES.ExpressionStatement) {
      if (isLoggingCall(stmt.expression)) {
        return true;
      }
    }
  }
  return false;
}

function isLoggingCall(node: TSESTree.Expression): boolean {
  if (node.type !== AST_NODE_TYPES.CallExpression) return false;
  const callee = node.callee;
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
      return LOGGING_PATTERNS.includes(`${obj}.${prop}`);
    }
  }
  return false;
}
