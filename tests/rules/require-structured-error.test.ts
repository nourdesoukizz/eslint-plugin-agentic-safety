import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/require-structured-error.js";

const ruleTester = new RuleTester();

ruleTester.run("require-structured-error", rule, {
  valid: [
    { code: `throw new Error("something failed");` },
    { code: `throw new TypeError("bad type");` },
    { code: `throw err;` },
    { code: `throw new CustomError("msg", { cause: err });` },
    { code: `const e = new Error("x"); throw e;` },
    { code: `throw createError("msg");` },
  ],
  invalid: [
    {
      code: `throw "something failed";`,
      errors: [
        {
          messageId: "noStringThrow" as const,
          suggestions: [
            {
              messageId: "wrapInError" as const,
              output: `throw new Error("something failed");`,
            },
          ],
        },
      ],
    },
    {
      code: "throw `template error ${msg}`;",
      errors: [
        {
          messageId: "noStringThrow" as const,
          suggestions: [
            {
              messageId: "wrapInError" as const,
              output: "throw new Error(`template error ${msg}`);",
            },
          ],
        },
      ],
    },
    {
      code: `throw 'single quotes';`,
      errors: [
        {
          messageId: "noStringThrow" as const,
          suggestions: [
            {
              messageId: "wrapInError" as const,
              output: `throw new Error('single quotes');`,
            },
          ],
        },
      ],
    },
  ],
});
