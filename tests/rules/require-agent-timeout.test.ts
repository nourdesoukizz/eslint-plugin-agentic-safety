import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/require-agent-timeout.js";

const ruleTester = new RuleTester();

ruleTester.run("require-agent-timeout", rule, {
  valid: [
    {
      code: `
        async function run() {
          await agent.invoke(prompt, { signal: controller.signal });
        }
      `,
    },
    {
      code: `
        async function run() {
          await agent.invoke(prompt, { timeout: 30000 });
        }
      `,
    },
    {
      code: `
        async function run() {
          const controller = new AbortController();
          await agent.invoke(prompt);
        }
      `,
    },
    {
      // Non-agent call: no timeout needed
      code: `
        async function run() {
          await fetch(url);
        }
      `,
    },
    {
      code: `
        async function run() {
          await llmClient.generate(prompt, { signal: abortSignal });
        }
      `,
    },
    {
      // Wrapped in timeout utility
      code: `
        async function run() {
          await Promise.race([agent.invoke(prompt), timeout(30000)]);
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        async function run() {
          await agent.invoke(prompt);
        }
      `,
      errors: [{ messageId: "missingTimeout" }],
    },
    {
      code: `
        async function run() {
          await llmClient.generate(prompt);
        }
      `,
      errors: [{ messageId: "missingTimeout" }],
    },
    {
      code: `
        async function run() {
          await chatBot.complete(prompt, { model: "gpt-4" });
        }
      `,
      errors: [{ messageId: "missingTimeout" }],
    },
  ],
});
