import { LOGO_PATHS, LOGO_VIEWBOX } from "./logo-paths";

export function Logo({ height = 18, title = "Calma" }: { height?: number; title?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} height={height} style={{ width: "auto", aspectRatio: "1242 / 349", fill: "currentColor", display: "block" }} role="img" aria-label={title}>
      {LOGO_PATHS.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </svg>
  );
}
