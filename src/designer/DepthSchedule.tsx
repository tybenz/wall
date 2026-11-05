import type { Assembly } from "../geometry/AssemblyTypes";
import { formatInches } from "../shared/Units";

export function DepthSchedule({ assembly }: { assembly: Assembly }) {
  return (
    <section className="card">
      <h2>Assembly depth schedule</h2>
      <p>
        Z = 0 at the existing drywall face. Positive values extend into the
        room.
      </p>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Rear Z</th>
            <th>Front Z</th>
            <th>Depth</th>
          </tr>
        </thead>
        <tbody>
          {assembly.parts.map((part) => (
            <tr key={part.id}>
              <th scope="row">{part.label}</th>
              <td>{formatInches(part.bounds.z)}</td>
              <td>{formatInches(part.bounds.z + part.bounds.depth)}</td>
              <td>{formatInches(part.bounds.depth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
