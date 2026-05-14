import spheraLogo from "../assets/sphera.png";

export function Logo({ size = 40, showName = false, className = "" }) {
  // PNG is 680×580. Sphere occupies full width and top ~67% of height.
  // Scale image so sphere height = size, then center it.
  const imgW = size * (680 / 390);
  const imgOffsetX = -(imgW - size) / 2;
  const imgOffsetY = -(size * 0.07);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }} className={className}>
      <div className="orb-anim" style={{
        width: size, height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}>
        <img
          src={spheraLogo}
          alt="Sphēra"
          style={{
            width: imgW,
            height: "auto",
            display: "block",
            marginLeft: imgOffsetX,
            marginTop: imgOffsetY,
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
