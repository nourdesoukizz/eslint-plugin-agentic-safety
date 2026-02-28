import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
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

// Scene transition frames where whoosh plays
const sceneTransitions = [0, 150, 360, 540, 720, 900, 1080, 1260, 1440, 1650];

// Frames where good code is revealed (bad→good transition in each RuleScene)
const chimeFrames = [
  360 + 115, 540 + 115, 720 + 115, 900 + 115, 1080 + 115, 1260 + 115,
];

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0D1117" }}>
      {/* Background music — full duration, lower volume */}
      <Audio src={staticFile("audio/bg-music.mp3")} volume={0.4} />

      {/* Whoosh on each scene transition */}
      {sceneTransitions.map((frame) => (
        <Sequence key={`whoosh-${frame}`} from={frame} durationInFrames={15}>
          <Audio src={staticFile("audio/whoosh.mp3")} volume={0.6} />
        </Sequence>
      ))}

      {/* Chime when good code is revealed */}
      {chimeFrames.map((frame) => (
        <Sequence key={`chime-${frame}`} from={frame} durationInFrames={20}>
          <Audio src={staticFile("audio/chime.mp3")} volume={0.5} />
        </Sequence>
      ))}

      {/* Click sounds during typing scenes (ProblemScene + InstallScene) */}
      {Array.from({ length: 12 }, (_, i) => 150 + 3 + i * 3).map((frame) => (
        <Sequence key={`click-problem-${frame}`} from={frame} durationInFrames={3}>
          <Audio src={staticFile("audio/click.mp3")} volume={0.25} />
        </Sequence>
      ))}
      {Array.from({ length: 18 }, (_, i) => 1440 + 20 + i * 3).map((frame) => (
        <Sequence key={`click-install-${frame}`} from={frame} durationInFrames={3}>
          <Audio src={staticFile("audio/click.mp3")} volume={0.25} />
        </Sequence>
      ))}

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
