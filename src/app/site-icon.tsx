import { ImageResponse } from "next/og";

export function createSiteIcon(width: number, height: number) {
  const scale = Math.min(width, height) / 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3a00ff",
          borderRadius: `${14 * scale}px`,
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${37 * scale}px`,
            height: `${25 * scale}px`,
            borderRadius: `${8 * scale}px`,
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: `${7 * scale}px solid #ffffff`,
              borderRight: `${7 * scale}px solid transparent`,
              position: "absolute",
              left: `${7 * scale}px`,
              bottom: `${-5 * scale}px`,
            }}
          />
          <div style={{ display: "flex", gap: `${4 * scale}px` }}>
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                style={{
                  width: `${5 * scale}px`,
                  height: `${5 * scale}px`,
                  borderRadius: "50%",
                  background: "#3a00ff",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: `${10 * scale}px`,
            width: 0,
            height: 0,
            borderLeft: `${22 * scale}px solid transparent`,
            borderRight: `${22 * scale}px solid transparent`,
            borderBottom: `${18 * scale}px solid #b8d8e7`,
            opacity: 0.95,
          }}
        />
      </div>
    ),
    { width, height }
  );
}
