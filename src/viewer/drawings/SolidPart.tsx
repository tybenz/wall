import { RoundedBox } from "./RoundedBox";
import type { Bounds } from "../../geometry/AssemblyTypes";
export function SolidPart({
  bounds,
  color,
  radius = 0,
  roughness = 0.7,
}: {
  bounds: Bounds;
  color: string;
  radius?: number;
  roughness?: number;
}) {
  const b = bounds;
  const position: [number, number, number] = [
    b.x + b.width / 2,
    b.y + b.height / 2,
    b.z + b.depth / 2,
  ];
  if (radius > 0)
    return (
      <RoundedBox
        args={[b.width, b.height, b.depth]}
        radius={Math.min(radius, b.width / 3, b.height / 3, b.depth / 3)}
        smoothness={3}
        position={position}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={roughness} />
      </RoundedBox>
    );
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[b.width, b.height, b.depth]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}
