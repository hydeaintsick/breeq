import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#f4f5fa",
        }}
      >
        <svg width="124" height="124" viewBox="0 0 22 22">
          <rect x="2" y="3" width="5.4" height="3.2" rx="1" fill="#ff4fa3" />
          <rect x="8.3" y="3" width="5.4" height="3.2" rx="1" fill="#8b5cf6" />
          <rect x="14.6" y="3" width="5.4" height="3.2" rx="1" fill="#4f7cff" />
          <rect x="5.15" y="7.4" width="5.4" height="3.2" rx="1" fill="#22d3ee" />
          <rect x="11.45" y="7.4" width="5.4" height="3.2" rx="1" fill="#a3e635" />
          <circle cx="11" cy="14.6" r="1.7" fill="#0f1117" />
          <rect x="7" y="18" width="8" height="2" rx="1" fill="#0f1117" />
        </svg>
      </div>
    ),
    size,
  );
}
