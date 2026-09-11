import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BRICKS = [
  { x: 2, y: 3, fill: "#ff4fa3" },
  { x: 8.3, y: 3, fill: "#8b5cf6" },
  { x: 14.6, y: 3, fill: "#4f7cff" },
  { x: 5.15, y: 7.4, fill: "#22d3ee" },
  { x: 11.45, y: 7.4, fill: "#a3e635" },
];

/** Night icon: the board's dark plate, neon bricks with a soft bloom, white glass ball and paddle. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(85% 85% at 50% 18%, #1b1f33 0%, #07080e 100%)",
        }}
      >
        <svg width="124" height="124" viewBox="0 0 22 22">
          {BRICKS.map((brick) => (
            <rect
              key={`glow-${brick.x}-${brick.y}`}
              x={brick.x - 0.6}
              y={brick.y - 0.6}
              width={6.6}
              height={4.4}
              rx={1.6}
              fill={brick.fill}
              opacity={0.28}
            />
          ))}
          {BRICKS.map((brick) => (
            <rect key={`${brick.x}-${brick.y}`} x={brick.x} y={brick.y} width={5.4} height={3.2} rx={1} fill={brick.fill} />
          ))}
          <circle cx="11" cy="14.6" r="2.4" fill="#ffffff" opacity="0.25" />
          <circle cx="11" cy="14.6" r="1.7" fill="#ffffff" />
          <rect x="7" y="18" width="8" height="2" rx="1" fill="#ffffff" opacity="0.92" />
        </svg>
      </div>
    ),
    size,
  );
}
