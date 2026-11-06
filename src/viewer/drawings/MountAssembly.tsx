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
      <SolidPart
        bounds={{
          ...b,
          depth: assembly.construction.lagPaths[0].start[2] - b.z,
        }}
        color="#333b3b"
        radius={3}
      />
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
        {assembly.construction.rails.map((bounds, index) => (
          <SolidPart key={index} bounds={bounds} color="#252d2e" radius={2} />
        ))}
      </MotionGroup>
    </group>
  );
}
