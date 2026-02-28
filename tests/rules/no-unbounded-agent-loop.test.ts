import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/no-unbounded-agent-loop.js";

const ruleTester = new RuleTester();

ruleTester.run("no-unbounded-agent-loop", rule, {
  valid: [
    {
      code: `
        for (let i = 0; i < 10; i++) {
          await agent.invoke(prompt);
        }
      `,
    },
    {
      code: `
        let iterations = 0;
        while (!task.isComplete() && iterations++ < MAX_STEPS) {
          await agent.step(task);
        }
      `,
    },
    {
      code: `
        while (true) {
          await agent.step(task);
          if (count > MAX) break;
        }
      `,
    },
    {
      // Non-agent call in loop: no issue
      code: `
        while (true) {
          await fetch(url);
        }
      `,
    },
    {
      code: `
        for (let i = 0; i < maxRetries; i++) {
          await llmClient.generate(prompt);
        }
      `,
    },
    {
      code: `
        while (true) {
          await agent.step(task);
          if (iterations > limit) throw new Error("too many iterations");
        }
      `,
    },
  ],
  invalid: [
    {
      code: `
        while (true) {
          await agent.step(task);
        }
      `,
      errors: [{ messageId: "unboundedLoop" }],
    },
    {
      code: `
        while (!done) {
          await agent.invoke(prompt);
          done = checkDone();
        }
      `,
      errors: [{ messageId: "unboundedLoop" }],
    },
    {
      code: `
        do {
          await chatBot.generate(prompt);
        } while (needsMore);
      `,
      errors: [{ messageId: "unboundedLoop" }],
    },
  ],
});
