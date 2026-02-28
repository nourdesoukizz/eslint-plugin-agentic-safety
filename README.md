# eslint-plugin-agentic-safety

[![npm version](https://img.shields.io/npm/v/eslint-plugin-agentic-safety.svg)](https://www.npmjs.com/package/eslint-plugin-agentic-safety)
[![license](https://img.shields.io/npm/l/eslint-plugin-agentic-safety.svg)](https://github.com/nourdesouki/eslint-plugin-agentic-safety/blob/main/LICENSE)

ESLint plugin enforcing reliability and safety patterns for agentic AI codebases. Catches silent LLM failures, unbounded loops, fire-and-forget calls, and missing observability in autonomous execution paths.

## Installation

```bash
npm install eslint-plugin-agentic-safety --save-dev
```

**Peer dependency:** ESLint >= 9.0.0 (flat config)

**Requirements:** Node.js >= 18.18.0

## Quick Start

```js
// eslint.config.js
import agenticSafety from "eslint-plugin-agentic-safety";

export default [
  agenticSafety.configs.recommended,
  // ... your other configs
];
```

This enables all 6 rules with their recommended severities.

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [require-agent-timeout](#require-agent-timeout) | Require timeout or AbortSignal on agent/LLM calls | error |
| [no-swallowed-agent-error](#no-swallowed-agent-error) | Disallow catch blocks that silently swallow agent errors | error |
| [no-fire-and-forget-agent](#no-fire-and-forget-agent) | Disallow fire-and-forget agent calls without await or error handling | error |
| [no-unbounded-agent-loop](#no-unbounded-agent-loop) | Disallow unbounded loops containing agent/LLM calls | error |
| [require-structured-error](#require-structured-error) | Require throwing Error objects instead of bare strings | warn |
| [require-agent-tracing](#require-agent-tracing) | Require tracing/observability hooks in agent functions | warn |

---

### require-agent-timeout

Prevents agent/LLM calls from hanging indefinitely by requiring a `timeout` or `signal` option.

**Invalid:**

```js
async function run() {
  await agent.invoke(prompt);
}
```

**Valid:**

```js
async function run() {
  await agent.invoke(prompt, { timeout: 30000 });
}

async function run() {
  await agent.invoke(prompt, { signal: controller.signal });
}

async function run() {
  const controller = new AbortController();
  await agent.invoke(prompt);
}

async function run() {
  await Promise.race([agent.invoke(prompt), timeout(30000)]);
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `agentPatterns` | `string[]` | Glob patterns to identify agent/LLM calls |
| `timeoutWrapperPatterns` | `string[]` | Timeout utility function names (default: `Promise.race`, `pTimeout`, `withTimeout`, `asyncTimeout`) |

---

### no-swallowed-agent-error

Disallows catch blocks that silently swallow errors from agent/LLM calls. Errors must be re-thrown, logged, or returned.

**Invalid:**

```js
try {
  await agent.invoke(prompt);
} catch (e) {}

try {
  await agent.invoke(prompt);
} catch (e) {
  const x = 1;
}
```

**Valid:**

```js
try {
  await agent.invoke(prompt);
} catch (e) {
  throw e;
}

try {
  await agent.invoke(prompt);
} catch (e) {
  console.error("Agent failed", e);
}

try {
  await agent.invoke(prompt);
} catch (e) {
  return { error: e };
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `agentPatterns` | `string[]` | Glob patterns to identify agent/LLM calls |

---

### no-fire-and-forget-agent

Ensures agent/LLM calls are awaited, assigned, or returned — never silently dropped.

**Invalid:**

```js
agent.invoke(prompt);

agent.invoke(prompt).then(r => handle(r));
```

**Valid:**

```js
await agent.invoke(prompt);

const result = agent.invoke(prompt);

return agent.invoke(prompt);

agent.invoke(prompt).then(r => handle(r)).catch(e => log(e));
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `agentPatterns` | `string[]` | Glob patterns to identify agent/LLM calls |

---

### no-unbounded-agent-loop

Prevents runaway loops by requiring a max-iteration guard (counter check, break condition, or bounded for-loop) when agent/LLM calls are inside a loop.

**Invalid:**

```js
while (true) {
  await agent.step(task);
}

while (!done) {
  await agent.invoke(prompt);
  done = checkDone();
}
```

**Valid:**

```js
for (let i = 0; i < 10; i++) {
  await agent.invoke(prompt);
}

while (iterations < MAX_STEPS) {
  await agent.step(task);
}

while (true) {
  await agent.step(task);
  if (count > MAX) break;
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `agentPatterns` | `string[]` | Glob patterns to identify agent/LLM calls |

---

### require-structured-error

Requires throwing `Error` objects instead of bare strings, so that stack traces and structured context are preserved.

**Invalid:**

```js
throw "something failed";

throw `template error ${msg}`;
```

**Valid:**

```js
throw new Error("something failed");

throw new TypeError("bad type");

throw err;
```

**Options:** None.

---

### require-agent-tracing

Requires tracing/observability instrumentation (e.g. `tracer.startSpan(...)`) within the first statements of agent-related functions.

**Invalid:**

```js
function runAgent(prompt) {
  return agent.invoke(prompt);
}
```

**Valid:**

```js
function runAgent(prompt) {
  const span = tracer.startSpan("runAgent");
  return agent.invoke(prompt);
}

async function chatHandler(msg) {
  const trace = startTrace("chat");
  return await llm.chat(msg);
}
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `agentPatterns` | `string[]` | Glob patterns to identify agent functions |
| `tracingPatterns` | `string[]` | Glob patterns to identify tracing calls (default includes `*trace*`, `*span*`, `*instrument*`, `*telemetry*`, etc.) |
| `checkDepth` | `number` | Number of statements from function start to scan (default: `5`) |

---

## Customizing Agent Patterns

Each rule that detects agent/LLM calls uses glob patterns matched against function and method names. The defaults cover common naming conventions:

```
*Agent*  *agent*  *LLM*  *llm*  *Chat*  *chat*
*invoke*  *completion*  *generate*  *predict*  *embed*
```

Override per-rule when you have custom naming:

```js
// eslint.config.js
import agenticSafety from "eslint-plugin-agentic-safety";

export default [
  {
    plugins: { "agentic-safety": agenticSafety },
    rules: {
      "agentic-safety/require-agent-timeout": ["error", {
        agentPatterns: ["*Agent*", "*LLM*", "myCustomRunner"]
      }],
    },
  },
];
```

## License

MIT
