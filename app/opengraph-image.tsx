import { ImageResponse } from "next/og";

// Branded social card (Open Graph + Twitter). Rendered at the edge from the Eidentic palette.
export const runtime = "edge";
export const alt =
  "Eidentic Playground — a memory-backed AI agent you can try live";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The eidentic mark, inlined as a data URI so resvg can rasterize it (no file read at the edge).
const MARK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 115.5 85.5">' +
    '<path d="M 67.8 26 A 34 34 0 1 0 67.8 65" fill="none" stroke="#e8e8ea" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 8 45.5 H 106" fill="none" stroke="#e8e8ea" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M 106 45.5 V 79.5" fill="none" stroke="#e8e8ea" stroke-width="8" stroke-linecap="round"/>' +
    '<circle cx="106" cy="9.5" r="7.5" fill="#f5a524"/>' +
    "</svg>",
)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#0f1117",
          backgroundImage:
            "radial-gradient(900px 480px at 88% -12%, rgba(245,165,36,0.16), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={72} height={53} alt="" />
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
            <span style={{ fontSize: 44, fontWeight: 700, color: "#e8e8ea", letterSpacing: "-0.02em" }}>
              eidentic
            </span>
            <span style={{ fontSize: 26, color: "#6b6b73" }}>Playground</span>
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              color: "#e8e8ea",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 940,
            }}
          >
            An AI agent that remembers you.
          </div>
          <div style={{ fontSize: 32, color: "#9a9aa4", lineHeight: 1.35, maxWidth: 900 }}>
            Watch its knowledge graph fill in live, then erase it in one call. Bring your own key.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: 28,
              fontFamily: "monospace",
              color: "#f5a524",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 12, backgroundColor: "#f5a524" }} />
            try.eidentic.dev
          </div>
          <div style={{ fontSize: 24, color: "#6b6b73" }}>Open source · Apache-2.0</div>
        </div>
      </div>
    ),
    size,
  );
}
