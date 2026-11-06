import { RoundedBox } from "./RoundedBox";
import type { Bounds } from "../../geometry/AssemblyTypes";
import { useSurfaceTexture } from "./Materials";
export function Soundbar({ bounds, color }: { bounds: Bounds; color: string }) {
  const b = bounds,
    texture = useSurfaceTexture("grille", b.width, b.height);
  return (
    <group>
      <RoundedBox
        args={[b.width, b.height, b.depth]}
        radius={Math.min(18, b.height * 0.35, b.depth * 0.35)}
        smoothness={4}
        position={[b.x + b.width / 2, b.y + b.height / 2, b.z + b.depth / 2]}
        castShadow
      >
        <meshStandardMaterial color={color} map={texture} roughness={0.92} />
      </RoundedBox>
      {[-24, -8, 8, 24].map((x) => (
        <mesh
          key={x}
          position={[
            b.x + b.width / 2 + x,
            b.y + b.height + 0.3,
            b.z + b.depth / 2,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[2, 8]} />
          <meshBasicMaterial color="#6b7273" />
        </mesh>
      ))}
    </group>
  );
}
