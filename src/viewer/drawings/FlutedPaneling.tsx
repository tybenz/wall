import type { AssemblyPart } from "../../geometry/AssemblyTypes";
import { PanelSlab } from "./PanelSlab";
import { RepeatedRibs } from "./RepeatedRibs";
export function FlutedPaneling({
  part,
  color,
  pitch,
}: {
  part: AssemblyPart;
  color: string;
  pitch: number;
}) {
  const b = part.bounds;
  const backing = Math.min(3, b.depth * 0.25);
  return (
    <group>
      <PanelSlab
        bounds={{ ...b, depth: backing }}
        openings={part.openings}
        topProfile={part.topProfile}
        color="#654c3a"
      />
      <RepeatedRibs
        bounds={{ ...b, z: b.z + backing, depth: b.depth - backing }}
        openings={part.openings}
        topProfile={part.topProfile}
        pitch={pitch}
        rounded
        color={color}
      />
    </group>
  );
}
