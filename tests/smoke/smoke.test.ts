import { describe, it, expect } from "vitest";
import { Linter } from "eslint";
import plugin from "../../dist/index.js";

const linter = new Linter();
const config = plugin.configs.recommended;

const BAD_CODE = `
function bad() {
  agent.invoke(prompt);
  throw "something went wrong";
}

async function runAgent() {
  await agent.invoke(prompt);
  try {
    await agent.invoke(prompt);
  } catch (e) {}
  while (true) {
    await agent.step();
  }
}
`;

const GOOD_CODE = `
async function runAgent() {
  const span = tracer.startSpan("agent-run");
  const result = await agent.invoke(prompt, { timeout: 5000 });
  try {
    await agent.invoke(prompt, { signal: controller.signal });
  } catch (e) {
    console.error(e);
  }
  for (let i = 0; i < 10; i++) {
    await agent.step({ timeout: 1000 });
  }
}

function handleError() {
  throw new Error("something went wrong");
}
`;

function lint(code: string) {
  return linter.verify(code, [config], { filename: "test.js" });
}

describe("smoke test (built dist artifact)", () => {
  it("config shape: recommended config has plugins and all 6 rules", () => {
    expect(config).toHaveProperty("plugins");
    expect(config.plugins).toHaveProperty("agentic-safety");

    const ruleKeys = Object.keys(config.rules!);
    expect(ruleKeys).toHaveLength(6);
    expect(ruleKeys).toEqual(
      expect.arrayContaining([
        "agentic-safety/require-agent-timeout",
        "agentic-safety/no-swallowed-agent-error",
        "agentic-safety/require-structured-error",
        "agentic-safety/no-unbounded-agent-loop",
        "agentic-safety/require-agent-tracing",
        "agentic-safety/no-fire-and-forget-agent",
      ]),
    );
  });

  it("bad code triggers all 6 rules", () => {
    const messages = lint(BAD_CODE);
    const ruleIds = messages.map((m) => m.ruleId);

    expect(ruleIds).toContain("agentic-safety/no-fire-and-forget-agent");
    expect(ruleIds).toContain("agentic-safety/require-structured-error");
    expect(ruleIds).toContain("agentic-safety/require-agent-tracing");
    expect(ruleIds).toContain("agentic-safety/require-agent-timeout");
    expect(ruleIds).toContain("agentic-safety/no-swallowed-agent-error");
    expect(ruleIds).toContain("agentic-safety/no-unbounded-agent-loop");
  });

  it("error rules report severity 2, warn rules report severity 1", () => {
    const messages = lint(BAD_CODE);

    const errorRules = [
      "agentic-safety/require-agent-timeout",
      "agentic-safety/no-swallowed-agent-error",
      "agentic-safety/no-unbounded-agent-loop",
      "agentic-safety/no-fire-and-forget-agent",
    ];
    const warnRules = [
      "agentic-safety/require-structured-error",
      "agentic-safety/require-agent-tracing",
    ];

    for (const ruleId of errorRules) {
      const msg = messages.find((m) => m.ruleId === ruleId);
      expect(msg, `Expected error rule ${ruleId}`).toBeDefined();
      expect(msg!.severity, `${ruleId} should be severity 2`).toBe(2);
    }

    for (const ruleId of warnRules) {
      const msg = messages.find((m) => m.ruleId === ruleId);
      expect(msg, `Expected warn rule ${ruleId}`).toBeDefined();
      expect(msg!.severity, `${ruleId} should be severity 1`).toBe(1);
    }
  });

  it("good code passes clean", () => {
    const messages = lint(GOOD_CODE);
    expect(messages).toHaveLength(0);
  });
});
