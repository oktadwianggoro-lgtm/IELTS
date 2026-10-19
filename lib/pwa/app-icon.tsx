import { ImageResponse } from "next/og";

/**
 * Real, rendered-at-request-time PNG icon (via Satori/`next/og`) — not a
 * placeholder asset. Navy background runs edge-to-edge and the monogram sits
 * within the inner ~80% safe zone, so the same image is valid for both
 * `purpose: "any"` and `purpose: "maskable"` in app/manifest.ts.
 */
export function createAppIcon(size: number) {
  const fontSize = Math.round(size * 0.42);
  const padding = Math.round(size * 0.1);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1e3a6b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: size - padding * 2,
            height: size - padding * 2,
            borderRadius: size * 0.18,
            background: "#14968c",
          }}
        >
          <span
            style={{
              fontSize,
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "sans-serif",
              letterSpacing: -2,
            }}
          >
            SI
          </span>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
