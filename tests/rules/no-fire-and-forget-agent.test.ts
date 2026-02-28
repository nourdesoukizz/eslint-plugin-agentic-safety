import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-fire-and-forget-agent.js";

const ruleTester = new RuleTester();

ruleTester.run("no-fire-and-forget-agent", rule, {
  valid: [
    {
      code: `
        async function run() {
          await agent.invoke(prompt);
        }
      `,
    },
    {
      code: `
        async function run() {
          const result = agent.invoke(prompt);
        }
      `,
    },
    {
      code: `
        async function run() {
          return agent.invoke(prompt);
        }
      `,
    },
    {
      code: `
        agent.invoke(prompt).then(r => handle(r)).catch(e => log(e));
      `,
    },
    {
      // Non-agent call: fire-and-forget is fine
      code: `
        fetch(url);
      `,
    },
    {
      code: `
        async function run() {
          const result = await agent.generate(prompt);
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        agent.invoke(prompt);
      `,
      errors: [{ messageId: "fireAndForget" }],
    },
    {
      code: `
        llmClient.generate(prompt);
      `,
      errors: [{ messageId: "fireAndForget" }],
    },
    {
      code: `
        agent.invoke(prompt).then(r => handle(r));
      `,
      errors: [{ messageId: "missingCatch" }],
    },
  ],
});
