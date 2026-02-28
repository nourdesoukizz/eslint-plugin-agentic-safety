import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "../../src/rules/require-agent-tracing.js";

const ruleTester = new RuleTester();

ruleTester.run("require-agent-tracing", rule, {
  valid: [
    {
      code: `
        function runAgent(prompt) {
          const span = tracer.startSpan("runAgent");
          return agent.invoke(prompt);
        }
      `,
    },
    {
      code: `
        const invokeAgent = (prompt) => {
          const span = tracer.startSpan("invoke");
          return agent.run(prompt);
        };
      `,
    },
    {
      // Non-agent function: no tracing required
      code: `
        function processData(data) {
          return data.map(transform);
        }
      `,
    },
    {
      code: `
        async function chatHandler(msg) {
          const trace = startTrace("chat");
          return await llm.chat(msg);
        }
      `,
    },
    {
      code: `
        function agentExecutor(task) {
          instrument("agentExecutor");
          return task.run();
        }
      `,
    },
    {
      code: `
        const generateCompletion = async (prompt) => {
          const span = telemetry.createSpan("completion");
          return await llm.generate(prompt);
        };
      `,
    },
  ],
  invalid: [
    {
      code: `
        function runAgent(prompt) {
          return agent.invoke(prompt);
        }
      `,
      errors: [
        {
          messageId: "missingTracing",
          data: { name: "runAgent" },
        },
      ],
    },
    {
      code: `
        const invokeAgent = (prompt) => {
          return agent.run(prompt);
        };
      `,
      errors: [
        {
          messageId: "missingTracing",
          data: { name: "invokeAgent" },
        },
      ],
    },
    {
      code: `
        async function chatHandler(msg) {
          const result = await llm.chat(msg);
          return result;
        }
      `,
      errors: [
        {
          messageId: "missingTracing",
          data: { name: "chatHandler" },
        },
      ],
    },
  ],
});
