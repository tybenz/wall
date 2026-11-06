import type { MountPreview } from "../../geometry/MountMotion";
import { MotionGroup } from "./MotionGroup";
import { MountLink } from "./MountLink";
import type { Assembly } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
import { SolidPart } from "./SolidPart";
export function MountAssembly({
  assembly,
  preview,
}: {
  assembly: Assembly;
  preview: MountPreview;
}) {
  const b = getPart(assembly, "mount").bounds;
  return (
    <group>
      <SolidPart bounds={{ ...b, depth: 6 }} color="#333b3b" radius={3} />
      {preview.links.map(([start, end], index) => (
        <MountLink key={index} start={start} end={end} />
      ))}
      {preview.hinges.map((point, index) => (
        <mesh key={`hinge-${index}`} position={[...point]} castShadow>
          <cylinderGeometry args={[9, 9, 34, 16]} />
          <meshStandardMaterial
            color="#626a68"
            metalness={0.45}
            roughness={0.4}
          />
        </mesh>
      ))}
      <MotionGroup transform={preview.transform}>
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
      </MotionGroup>
    </group>
  );
}
