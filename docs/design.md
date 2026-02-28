# Design Document: eslint-plugin-agentic-safety

---

| Field | Value |
|-------|-------|
| **Status** | Draft |
| **Package** | `eslint-plugin-agentic-safety` |

---

## 1. Problem Statement

The agentic AI ecosystem is growing rapidly. Engineers are building multi-agent systems, LLM-powered tool chains, and autonomous coding assistants. But there is no standard static analysis tooling that enforces reliability patterns specific to agentic code.

Generic ESLint security plugins catch SQL injection and unsafe regex. They know nothing about the failure modes unique to agentic systems: silent LLM call failures propagating bad data downstream, unbounded retry loops burning tokens and compute, fire-and-forget agent invocations that lose errors, and missing observability in autonomous execution paths.

These are not hypothetical risks. They are the exact bugs that surface in production multi-agent systems. This plugin encodes hard-won patterns from building production agentic infrastructure into reusable, enforceable lint rules.

---

## 2. Solution Overview

`eslint-plugin-agentic-safety` is a type-aware ESLint plugin that provides a curated set of rules targeting the reliability and safety patterns specific to agentic TypeScript/JavaScript codebases. It uses `@typescript-eslint/utils` for access to the TypeScript type checker, enabling cross-node analysis that goes beyond basic syntax checking.

### Design Principles

**Production-first:** Every rule addresses a real failure mode observed in production agentic systems, not theoretical concerns.

**Low false-positive rate:** Rules use configurable pattern matching (function name patterns, decorator detection) to target agent-specific code paths, not all async code.

**Actionable messages:** Every lint error includes a concrete fix suggestion, not just a description of what is wrong.

**Incremental adoption:** Rules can be enabled individually. A recommended config provides sensible defaults, but teams can override per-rule.

---

## 3. Rule Specifications

The plugin ships with six rules across two severity tiers. Error-level rules catch patterns that reliably cause production incidents. Warning-level rules enforce best practices that improve debuggability.

| Rule | What It Catches | Severity |
|------|----------------|----------|
| `require-agent-timeout` | Async agent/LLM calls without AbortController or timeout configuration | error |
| `no-swallowed-agent-error` | Catch blocks that silently swallow errors from agent tool executions without logging, re-throwing, or structured error propagation | error |
| `require-structured-error` | Bare string throws (`throw "failed"`) instead of typed Error subclasses with context fields | warning |
| `no-unbounded-agent-loop` | While/for loops containing LLM calls without a max iteration guard or circuit breaker | error |
| `require-agent-tracing` | Agent execution functions that lack tracing/observability hooks (span creation, correlation IDs) | warning |
| `no-fire-and-forget-agent` | Agent tool invocations using promise chains without await, missing error propagation | error |

---

## 4. Technical Architecture

### 4.1 AST Detection Strategy

Each rule operates on specific AST node types from the `@typescript-eslint` AST. The plugin registers visitor functions for these nodes and applies detection logic that considers the surrounding scope and control flow.

| Rule | AST Node(s) | Detection Logic |
|------|-------------|----------------|
| `require-agent-timeout` | `CallExpression`, `AwaitExpression` | Check if async calls matching agent/LLM patterns have an AbortSignal argument or are wrapped in a timeout utility |
| `no-swallowed-agent-error` | `CatchClause` | Verify catch block body contains at least one: throw statement, console.error/warn call, logger call, or return of error type |
| `require-structured-error` | `ThrowStatement` | Check if argument is a StringLiteral or template literal instead of a NewExpression extending Error |
| `no-unbounded-agent-loop` | `WhileStatement`, `ForStatement` | Detect LLM/agent calls inside loop body without a counter check, max_iterations parameter, or break condition referencing iteration count |
| `require-agent-tracing` | `FunctionDeclaration`, `ArrowFunctionExpression` | For functions matching agent naming patterns, verify presence of span/trace creation within the first N statements |
| `no-fire-and-forget-agent` | `CallExpression` | Detect `.then()` chains or bare promise calls to agent functions without await keyword or error handler |

### 4.2 Configuration Schema

The plugin accepts a shared configuration object that allows teams to customize agent detection patterns to match their codebase conventions:

```js
// .eslintrc.js
"agentic-safety/require-agent-timeout": ["error", {
  "agentPatterns": ["*Agent*", "*LLM*", "*chat*", "*invoke*"],
  "timeoutMs": 30000,
}]
```

### 4.3 Type-Aware Analysis

The plugin leverages `@typescript-eslint`'s type information to resolve function return types and determine whether a call expression returns a Promise, enabling accurate detection of unhandled async agent operations. This is what elevates the plugin beyond basic pattern matching: it can distinguish between a regular async function and one that returns an agent execution result type.

---

## 5. Example: What Gets Caught

### `require-agent-timeout`

```ts
// BAD: No timeout on LLM call
const result = await llmClient.invoke(prompt);
```

```ts
// GOOD: Timeout with AbortController
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);
const result = await llmClient.invoke(prompt, { signal: controller.signal });
```

### `no-unbounded-agent-loop`

```ts
// BAD: Agent loop with no iteration limit
while (!task.isComplete()) {
  await agent.step(task);
}
```

```ts
// GOOD: Bounded with max iterations
let iterations = 0;
while (!task.isComplete() && iterations++ < MAX_AGENT_STEPS) {
  await agent.step(task);
}
```

### `no-swallowed-agent-error`

```ts
// BAD: Error silently swallowed
try {
  await agent.executeTool(toolName, params);
} catch (e) {
  // nothing here
}
```

```ts
// GOOD: Error propagated with context
try {
  await agent.executeTool(toolName, params);
} catch (e) {
  throw new AgentToolError(`Tool ${toolName} failed`, { cause: e, toolName, params });
}
```

### `no-fire-and-forget-agent`

```ts
// BAD: Promise floated without await
agent.runWorkflow(task).then(r => saveResult(r));
```

```ts
// GOOD: Awaited with error handling
try {
  const r = await agent.runWorkflow(task);
  await saveResult(r);
} catch (e) {
  logger.error("Workflow failed", { task, error: e });
  throw e;
}
```

---

## 6. Project Structure

```
eslint-plugin-agentic-safety/
  src/
    rules/
      require-agent-timeout.ts
      no-swallowed-agent-error.ts
      require-structured-error.ts
      no-unbounded-agent-loop.ts
      require-agent-tracing.ts
      no-fire-and-forget-agent.ts
    configs/
      recommended.ts
    utils/
      agent-patterns.ts        // shared pattern matching
      ast-helpers.ts           // common AST traversal utilities
    index.ts                   // plugin entry point
  tests/
    rules/                     // one test file per rule
  package.json
  tsconfig.json
  README.md
```

---

## 7. Implementation Timeline

Timeboxed to 2 days. Working and published beats polished and unreleased.

| Phase | Deliverable | Duration |
|-------|------------|----------|
| **Day # AM** | Project scaffold, ESLint plugin boilerplate, test harness | 
| **Day # PM** | Implement `require-agent-timeout` and `no-swallowed-agent-error` with tests | 
| **Day # AM** | Implement `require-structured-error` and `no-unbounded-agent-loop` | 
| **Day # PM** | README with design rationale, npm publish, GitHub repo polish | 
| **Day #** | Add remaining rules, type-aware linting integration | 

---

## 8. Success Criteria

**Minimum viable:** 4 rules implemented with tests, published to npm, README with design rationale explaining the AST traversal logic for each rule.

**Strong signal:** All 6 rules, type-aware detection, configurable agent patterns, and at least one real-world codebase using the plugin.

**Comprehensive:** All 6 rules, type-aware detection, configurable agent patterns, thorough documentation explaining AST traversal logic, and demonstrated usage on a real codebase.

---

## 9. Why This Matters

No ESLint plugin targets agentic code reliability patterns. Every rule in this plugin maps to a failure mode encountered in production multi-agent systems. The agentic ecosystem needs the same static analysis rigor that web security got years ago with `eslint-plugin-security`. This is that, but for the agent reliability problem space.