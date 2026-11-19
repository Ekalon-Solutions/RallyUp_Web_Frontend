export default function SvgIcon({ src, className = "" }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block", // <-- Crucial: Allows width and height to take effect
        verticalAlign: "middle",
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}