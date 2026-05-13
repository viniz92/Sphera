import spheraLogo from "../assets/sphera.jpeg";

export function Logo({ size = 40, showName = false, className = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }} className={className}>
      <div style={{
        width: size, height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <img
          src={spheraLogo}
          alt="Sphēra"
          style={{
            width: size * 2.6,
            height: "auto",
            marginLeft: -(size * 0.8),
            marginTop: -(size * 0.05),
          }}
        />
      </div>

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
