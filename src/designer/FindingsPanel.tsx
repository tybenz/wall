import type { Assembly } from "../geometry/AssemblyTypes";
export function FindingsPanel({ assembly }: { assembly: Assembly }) {
  const warnings = assembly.findings.filter(
    (item) => item.severity === "warning",
  );
  return (
    <details className="findings">
      <summary>
        <span
          className={warnings.length ? "status-dot warning" : "status-dot"}
        />
        {warnings.length
          ? `${warnings.length} layout ${warnings.length === 1 ? "conflict" : "conflicts"}`
          : "No envelope conflicts detected"}
        <span className="muted"> · provisional design</span>
        <span className="summary-arrow">⌄</span>
      </summary>
      <ul>
        {assembly.findings.map((item) => (
          <li
            key={item.code}
            className={item.severity === "warning" ? "warning-text" : ""}
          >
            {item.message}
          </li>
        ))}
      </ul>
      <p>
        Checks cover envelopes, panel stock and box/framing intersections. Mount
        articulation, fastener sizing, cable bend radius and code compliance
        require verification.
      </p>
    </details>
  );
}
