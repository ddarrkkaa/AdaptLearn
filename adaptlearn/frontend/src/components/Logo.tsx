export function Logo({
  size = 36,
  color = "#fff",
  background = "var(--primary)",
}: {
  size?: number;
  color?: string;
  background?: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        {}
        <path
          d="M8 12c0-1.1.9-2 2-2h7c1.7 0 3 1.3 3 3v18c0-1.7-1.3-3-3-3h-7c-1.1 0-2-.9-2-2V12z"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M32 12c0-1.1-.9-2-2-2h-7c-1.7 0-3 1.3-3 3v18c0-1.7 1.3-3 3-3h7c1.1 0 2-.9 2-2V12z"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {}
        <circle cx="20" cy="6" r="2.2" fill={color} />
        <path
          d="M20 8v3"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return <Logo size={size} />;
}
