import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-swallowed-agent-error.js";

const ruleTester = new RuleTester();

ruleTester.run("no-swallowed-agent-error", rule, {
  valid: [
    {
      code: `
        try {
          await agent.invoke(prompt);
        } catch (e) {
          throw e;
        }
      `,
    },
    {
      code: `
        try {
          await agent.invoke(prompt);
        } catch (e) {
          console.error("Agent failed", e);
        }
      `,
    },
    {
      code: `
        try {
          await agent.invoke(prompt);
        } catch (e) {
          logger.error("fail", e);
        }
      `,
    },
    {
      code: `
        try {
          await agent.invoke(prompt);
        } catch (e) {
          return { error: e };
        }
      `,
    },
    {
      // Non-agent call: empty catch is fine
      code: `
        try {
          await fetch(url);
        } catch (e) {
        }
      `,
    },
    {
      code: `
        try {
          const result = await llmClient.generate(prompt);
        } catch (e) {
          console.warn("LLM failed", e);
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        try {
          await agent.invoke(prompt);
        } catch (e) {
        }
      `,
      errors: [{ messageId: "swallowedError" }],
    },
    {
      code: `
        try {
          await chatBot.generate(prompt);
        } catch (e) {
          const x = 1;
        }
      `,
      errors: [{ messageId: "swallowedError" }],
    },
    {
      code: `
        try {
          await llmClient.invoke(prompt);
        } catch (e) {
          // just a comment, no handling
          const x = 1;
        }
      `,
      errors: [{ messageId: "swallowedError" }],
    },
  ],
});
