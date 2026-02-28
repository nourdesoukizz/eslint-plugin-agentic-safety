import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({ frame, fps, config: { damping: 12 } });

  const linksOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });
  const linksY = interpolate(frame, [30, 50], [20, 0], {
    extrapolateRight: "clamp",
  });

  const logoOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
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
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 52,
          fontWeight: 700,
          color: "#E6EDF3",
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        Start building safer agents today
      </div>

      <div
        style={{
          opacity: linksOpacity,
          transform: `translateY(${linksY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          marginBottom: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 28,
            color: "#58A6FF",
          }}
        >
          <span style={{ fontSize: 24 }}>📦</span>
          npm i eslint-plugin-agentic-safety
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 24,
            color: "#8B949E",
          }}
        >
          <span style={{ fontSize: 24 }}>⭐</span>
          github.com/nourdesouki/eslint-plugin-agentic-safety
        </div>
      </div>

      <div
        style={{
          opacity: logoOpacity,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 36,
          fontWeight: 700,
          color: "#58A6FF",
        }}
      >
        eslint-plugin-agentic-safety
      </div>
    </AbsoluteFill>
  );
};
