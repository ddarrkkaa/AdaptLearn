import React from "react";

interface NeuroDepthProps {
  particles?: number;

  intensity?: "soft" | "normal" | "intense";
}

export default function NeuroDepth({ particles = 22, intensity = "normal" }: NeuroDepthProps) {
  const blobAlpha = intensity === "intense" ? 0.20 : intensity === "soft" ? 0.08 : 0.14;
  const lineAlpha = intensity === "intense" ? 0.22 : intensity === "soft" ? 0.10 : 0.16;

  return (
    <div
      className="tw-pointer-events-none tw-fixed tw-inset-0 tw-overflow-hidden"
      style={{ zIndex: 0, perspective: "1400px" }}
      aria-hidden
    >
      { }
      <div className="tw-absolute tw--top-[20vh] tw--right-[10vw] tw-w-[55vw] tw-h-[55vw] tw-rounded-full tw-animate-drift"
           style={{ background: `radial-gradient(circle, rgba(0,230,200,${blobAlpha}) 0%, transparent 60%)`, transform: "translateZ(-220px)" }} />
      <div className="tw-absolute tw--bottom-[20vh] tw--left-[10vw] tw-w-[45vw] tw-h-[45vw] tw-rounded-full tw-animate-drift"
           style={{ background: `radial-gradient(circle, rgba(232,185,35,${blobAlpha * 0.6}) 0%, transparent 60%)`, transform: "translateZ(-180px)", animationDelay: "5s" }} />
      <div className="tw-absolute tw-top-[40%] tw-left-[40%] tw-w-[35vw] tw-h-[35vw] tw-rounded-full tw-animate-pulse-soft"
           style={{ background: `radial-gradient(circle, rgba(255,94,122,${blobAlpha * 0.4}) 0%, transparent 60%)`, transform: "translateZ(-120px)" }} />

      {}
      <svg className="tw-absolute tw-inset-0 tw-w-full tw-h-full" style={{ opacity: lineAlpha }}>
        <defs>
          <linearGradient id={`neuro-depth-line`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#00E6C8" stopOpacity="0" />
            <stop offset="50%"  stopColor="#00E6C8" stopOpacity="1" />
            <stop offset="100%" stopColor="#E8B923" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[
          ["10%", "20%", "30%", "60%"], ["70%", "15%", "55%", "70%"],
          ["20%", "85%", "80%", "30%"], ["85%", "75%", "40%", "40%"],
          ["5%",  "50%", "45%", "10%"], ["60%", "90%", "90%", "20%"],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#neuro-depth-line)`} strokeWidth="0.6" />
        ))}
      </svg>

      {}
      {Array.from({ length: particles }).map((_, i) => {
        const depth = (i % 4) - 2;
        return (
          <span
            key={i}
            className="tw-absolute tw-rounded-full tw-animate-pulse-soft"
            style={{
              width:  `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              top:    `${(i * 53) % 100}%`,
              left:   `${(i * 37) % 100}%`,
              background: i % 3 === 0 ? "#00E6C8" : i % 3 === 1 ? "#E8B923" : "#FF5E7A",
              boxShadow: `0 0 ${5 + (i % 6)}px currentColor`,
              animationDelay: `${(i % 7) * 0.3}s`,
              opacity: 0.4 + (i % 3) * 0.2,
              transform: `translateZ(${depth * 90}px)`,
              filter: depth < 0 ? `blur(${Math.abs(depth) * 0.6}px)` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
