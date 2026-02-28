import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  // "Building with AI agents?" types in character by character
  const questionText = "Building with AI agents?";
  const charsVisible = Math.min(
    questionText.length,
    Math.floor(interpolate(frame, [0, 40], [0, questionText.length], {
      extrapolateRight: "clamp",
    }))
  );

  const boldOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateRight: "clamp",
  });
  const boldY = interpolate(frame, [50, 70], [30, 0], {
    extrapolateRight: "clamp",
  });

  const risks = [
    "Silent failures in agent pipelines",
    "Infinite loops burning tokens & cost",
    "Dropped errors hiding critical bugs",
  ];

  const fadeOut = interpolate(frame, [180, 209], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 56,
          color: "#E6EDF3",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {questionText.slice(0, charsVisible)}
        {charsVisible < questionText.length && (
          <span
            style={{
              opacity: frame % 16 < 8 ? 1 : 0,
              color: "#58A6FF",
            }}
          >
            |
          </span>
        )}
      </div>

      <div
        style={{
          opacity: boldOpacity,
          transform: `translateY(${boldY}px)`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: "#F85149",
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        Your code needs guardrails.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {risks.map((risk, i) => {
          const riskOpacity = interpolate(
            frame,
            [80 + i * 25, 100 + i * 25],
            [0, 1],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );
          const riskX = interpolate(
            frame,
            [80 + i * 25, 100 + i * 25],
            [-40, 0],
            { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
          );
          return (
            <div
              key={risk}
              style={{
                opacity: riskOpacity,
                transform: `translateX(${riskX}px)`,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontSize: 32,
                color: "#D29922",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ color: "#F85149", fontSize: 28 }}>⚠</span>
              {risk}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
