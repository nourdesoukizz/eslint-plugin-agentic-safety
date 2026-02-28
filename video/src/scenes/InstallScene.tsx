import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

export const InstallScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Terminal typing animation
  const command = "npm install eslint-plugin-agentic-safety --save-dev";
  const charsVisible = Math.min(
    command.length,
    Math.floor(
      interpolate(frame, [20, 80], [0, command.length], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      })
    )
  );

  // Config snippet fade in
  const configOpacity = interpolate(frame, [100, 120], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const configY = interpolate(frame, [100, 120], [20, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const fadeOut = interpolate(frame, [180, 209], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const configText = `// eslint.config.js
import agenticSafety from "eslint-plugin-agentic-safety";

export default [
  agenticSafety.configs.recommended,
];`;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0D1117",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          opacity: headerOpacity,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: "#E6EDF3",
          marginBottom: 50,
          textAlign: "center",
        }}
      >
        Get Started in Seconds
      </div>

      {/* Terminal */}
      <div
        style={{
          backgroundColor: "#161B22",
          borderRadius: 16,
          width: 1400,
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        {/* Terminal title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 20px",
            backgroundColor: "#1C2128",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#F85149",
            }}
          />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#D29922",
            }}
          />
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#3FB950",
            }}
          />
          <span
            style={{
              color: "#8B949E",
              fontSize: 16,
              fontFamily: "-apple-system, sans-serif",
              marginLeft: 12,
            }}
          >
            Terminal
          </span>
        </div>
        {/* Terminal content */}
        <div
          style={{
            padding: "30px 36px",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 26,
            color: "#E6EDF3",
          }}
        >
          <span style={{ color: "#3FB950" }}>$</span>{" "}
          {command.slice(0, charsVisible)}
          {charsVisible < command.length && (
            <span
              style={{
                opacity: frame % 16 < 8 ? 1 : 0,
                color: "#58A6FF",
              }}
            >
              █
            </span>
          )}
        </div>
      </div>

      {/* Config snippet */}
      <div
        style={{
          opacity: configOpacity,
          transform: `translateY(${configY}px)`,
          backgroundColor: "#161B22",
          borderRadius: 16,
          padding: "32px 40px",
          width: 1400,
          border: "2px solid #3FB95033",
        }}
      >
        <pre
          style={{
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 24,
            lineHeight: 1.6,
            color: "#E6EDF3",
            margin: 0,
            whiteSpace: "pre",
          }}
        >
          <span style={{ color: "#8B949E" }}>{"// eslint.config.js"}</span>
          {"\n"}
          <span style={{ color: "#FF7B72" }}>import</span>{" "}
          <span style={{ color: "#E6EDF3" }}>agenticSafety</span>{" "}
          <span style={{ color: "#FF7B72" }}>from</span>{" "}
          <span style={{ color: "#A5D6FF" }}>
            "eslint-plugin-agentic-safety"
          </span>
          ;{"\n\n"}
          <span style={{ color: "#FF7B72" }}>export default</span> [{"\n"}
          {"  "}
          <span style={{ color: "#E6EDF3" }}>agenticSafety</span>.
          <span style={{ color: "#E6EDF3" }}>configs</span>.
          <span style={{ color: "#E6EDF3" }}>recommended</span>,{"\n"}];
        </pre>
      </div>
    </AbsoluteFill>
  );
};
