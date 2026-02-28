import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { RuleScene } from "./scenes/RuleScene";
import { InstallScene } from "./scenes/InstallScene";
import { OutroScene } from "./scenes/OutroScene";

const rules = [
  {
    ruleName: "require-agent-timeout",
    severity: "error" as const,
    badCode: "await agent.invoke(prompt);",
    goodCode: "await agent.invoke(prompt, { timeout: 30000 });",
  },
  {
    ruleName: "no-swallowed-agent-error",
    severity: "error" as const,
    badCode: "try { await agent.invoke(prompt); } catch (e) {}",
    goodCode: "try { await agent.invoke(prompt); } catch (e) {\n  console.error(e);\n}",
  },
  {
    ruleName: "no-fire-and-forget-agent",
    severity: "error" as const,
    badCode: "agent.invoke(prompt);",
    goodCode: "await agent.invoke(prompt);",
  },
  {
    ruleName: "no-unbounded-agent-loop",
    severity: "error" as const,
    badCode: "while (true) {\n  await agent.step();\n}",
    goodCode: "for (let i = 0; i < MAX; i++) {\n  await agent.step();\n}",
  },
  {
    ruleName: "require-structured-error",
    severity: "warn" as const,
    badCode: 'throw "something failed";',
    goodCode: 'throw new Error("something failed");',
  },
  {
    ruleName: "require-agent-tracing",
    severity: "warn" as const,
    badCode: "function runAgent() {\n  return agent.invoke(prompt);\n}",
    goodCode: 'function runAgent() {\n  const span = tracer.startSpan("run");\n  return agent.invoke(prompt);\n}',
  },
];

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1117" }}>
      {/* Scene 1: Title — 0-5s (frames 0-149) */}
      <Sequence from={0} durationInFrames={150}>
        <TitleScene />
      </Sequence>

      {/* Scene 2: Problem Statement — 5-12s (frames 150-359) */}
      <Sequence from={150} durationInFrames={210}>
        <ProblemScene />
      </Sequence>

      {/* Scenes 3-8: Rules — each 6s (180 frames) */}
      {rules.map((rule, i) => (
        <Sequence key={rule.ruleName} from={360 + i * 180} durationInFrames={180}>
          <RuleScene
            ruleName={rule.ruleName}
            severity={rule.severity}
            badCode={rule.badCode}
            goodCode={rule.goodCode}
          />
        </Sequence>
      ))}

      {/* Scene 9: Installation — 48-55s (frames 1440-1649) */}
      <Sequence from={1440} durationInFrames={210}>
        <InstallScene />
      </Sequence>

      {/* Scene 10: Outro — 55-60s (frames 1650-1799) */}
      <Sequence from={1650} durationInFrames={150}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
