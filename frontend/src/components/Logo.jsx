import spheraLogo from "../assets/sphera.png";

export function Logo({ size = 40, showName = false, className = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }} className={className}>
      <div style={{
        width: size, height: size,
        backgroundImage: `url(${spheraLogo})`,
        backgroundSize: "200% auto",
        backgroundPosition: "50% 12%",
        borderRadius: "50%",
        flexShrink: 0,
      }} />

      {showName && (
        <span style={{
          fontSize: size * 0.38,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          letterSpacing: "0.08em",
          lineHeight: 1,
        }}>
          SPHĒRA
        </span>
      )}
    </div>
  );
}
