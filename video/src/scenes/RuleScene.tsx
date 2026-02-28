import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

interface RuleSceneProps {
  ruleName: string;
  severity: "error" | "warn";
  badCode: string;
  goodCode: string;
}

export const RuleScene: React.FC<RuleSceneProps> = ({
  ruleName,
  severity,
  badCode,
  goodCode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header animates in
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headerY = interpolate(frame, [0, 15], [-30, 0], {
    extrapolateRight: "clamp",
  });

  // Bad code appears
  const badOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const badScale = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14 },
  });

  // Transition: bad slides left, good slides in from right
  const transitionProgress = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badX = interpolate(transitionProgress, [0, 1], [0, -1920]);
  const goodX = interpolate(transitionProgress, [0, 1], [1920, 0]);

  // Good code checkmark
  const checkScale = spring({
    frame: Math.max(0, frame - 115),
    fps,
    config: { damping: 10, stiffness: 150 },
  });

  // Fade out
  const fadeOut = interpolate(frame, [155, 179], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const severityColor = severity === "error" ? "#F85149" : "#D29922";

  const codeBlockStyle: React.CSSProperties = {
    backgroundColor: "#161B22",
    borderRadius: 16,
    padding: "40px 48px",
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: 28,
    lineHeight: 1.6,
    whiteSpace: "pre",
    width: 1400,
    minHeight: 160,
    display: "flex",
    alignItems: "center",
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0D1117",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        opacity: fadeOut,
      }}
    >
      {/* Rule header */}
      <div
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 60,
          position: "absolute",
          top: 100,
        }}
      >
        <span
          style={{
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 40,
            fontWeight: 700,
            color: "#E6EDF3",
          }}
        >
          {ruleName}
        </span>
        <span
          style={{
            backgroundColor: severityColor,
            color: "#fff",
            padding: "6px 18px",
            borderRadius: 8,
            fontSize: 22,
            fontWeight: 600,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            textTransform: "uppercase",
          }}
        >
          {severity}
        </span>
      </div>

      {/* Code blocks container */}
      <div
        style={{
          position: "relative",
          width: 1400,
          overflow: "hidden",
          marginTop: 40,
        }}
      >
        {/* Bad code */}
        <div
          style={{
            opacity: badOpacity,
            transform: `scale(${badScale}) translateX(${badX}px)`,
            position: transitionProgress > 0 ? "absolute" : "relative",
            top: 0,
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "-apple-system, sans-serif",
              fontSize: 22,
              color: "#F85149",
              marginBottom: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 24 }}>✕</span> Bad
          </div>
          <div
            style={{
              ...codeBlockStyle,
              border: "2px solid #F8514933",
            }}
          >
            <span style={{ color: "#F85149" }}>{badCode}</span>
          </div>
        </div>

        {/* Good code */}
        {transitionProgress > 0 && (
          <div
            style={{
              transform: `translateX(${goodX}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "-apple-system, sans-serif",
                fontSize: 22,
                color: "#3FB950",
                marginBottom: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  transform: `scale(${checkScale})`,
                  display: "inline-block",
                }}
              >
                ✓
              </span>{" "}
              Good
            </div>
            <div
              style={{
                ...codeBlockStyle,
                border: "2px solid #3FB95033",
              }}
            >
              <span style={{ color: "#3FB950" }}>{goodCode}</span>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
