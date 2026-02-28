import { ESLintUtils, AST_NODE_TYPES } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/docs/rules/${name}.md`,
);

export default createRule({
  name: "require-structured-error",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require throwing Error objects instead of bare strings for structured error context",
    },
    hasSuggestions: true,
    messages: {
      noStringThrow:
        "Throw an Error object instead of a string literal. Bare strings lose stack traces and cannot carry structured context.",
      wrapInError: "Wrap in `new Error(...)`",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
        const arg = node.argument;
        if (!arg) return;

        if (arg.type === AST_NODE_TYPES.Literal && typeof arg.value === "string") {
          context.report({
            node: arg,
            messageId: "noStringThrow",
            suggest: [
              {
                messageId: "wrapInError",
                fix(fixer) {
                  const sourceCode = context.sourceCode;
                  const text = sourceCode.getText(arg);
                  return fixer.replaceText(arg, `new Error(${text})`);
                },
              },
            ],
          });
        }

        if (arg.type === AST_NODE_TYPES.TemplateLiteral) {
          context.report({
            node: arg,
            messageId: "noStringThrow",
            suggest: [
              {
                messageId: "wrapInError",
                fix(fixer) {
                  const sourceCode = context.sourceCode;
                  const text = sourceCode.getText(arg);
                  return fixer.replaceText(arg, `new Error(${text})`);
                },
              },
            ],
          });
        }
      },
    };
  },
});
