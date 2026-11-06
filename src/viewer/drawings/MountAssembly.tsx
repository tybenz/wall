import type { Assembly } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
import { SolidPart } from "./SolidPart";
export function MountAssembly({ assembly }: { assembly: Assembly }) {
  const b = getPart(assembly, "mount").bounds;
  return (
    <group>
      <SolidPart bounds={{ ...b, depth: 6 }} color="#333b3b" radius={3} />
      <SolidPart
        bounds={{
          x: b.x + b.width * 0.15,
          y: b.y + b.height * 0.35,
          z: b.z + 6,
          width: b.width * 0.7,
          height: 22,
          depth: Math.max(2, b.depth - 9),
        }}
        color="#242b2d"
        radius={3}
      />
      {[0.25, 0.75].map((fraction) => (
        <SolidPart
          key={fraction}
          bounds={{
            x: b.x + b.width * fraction - 10,
            y: b.y - 55,
            z: b.z + b.depth - 5,
            width: 20,
            height: b.height + 110,
            depth: 5,
          }}
          color="#252d2e"
          radius={2}
        />
      ))}
    </group>
  );
}
