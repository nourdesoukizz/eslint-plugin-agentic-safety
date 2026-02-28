import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
  });
  const badgeScale = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: { damping: 10 },
  });

  const fadeOut = interpolate(frame, [120, 149], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0D1117",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          fontFamily:
            "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: 64,
          fontWeight: 700,
          color: "#58A6FF",
          textAlign: "center",
        }}
      >
        eslint-plugin-agentic-safety
      </div>

      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 36,
          color: "#E6EDF3",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Safety guardrails for agentic AI code
      </div>

      <div
        style={{
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          marginTop: 40,
          display: "flex",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            borderRadius: 6,
            overflow: "hidden",
            fontSize: 20,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <span
            style={{
              backgroundColor: "#555",
              color: "#fff",
              padding: "6px 12px",
            }}
          >
            npm
          </span>
          <span
            style={{
              backgroundColor: "#3FB950",
              color: "#fff",
              padding: "6px 12px",
              fontWeight: 600,
            }}
          >
            v1.0.0
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
