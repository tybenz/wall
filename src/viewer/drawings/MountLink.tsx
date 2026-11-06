import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import type { Point } from "../../geometry/MountMotion";
export function MountLink({ start, end }: { start: Point; end: Point }) {
  const { length, center, rotation } = useMemo(() => {
    const a = new Vector3(...start),
      b = new Vector3(...end),
      direction = b.clone().sub(a);
    return {
      length: direction.length(),
      center: a.add(b).multiplyScalar(0.5),
      rotation: new Quaternion().setFromUnitVectors(
        new Vector3(0, 1, 0),
        direction.normalize(),
      ),
    };
  }, [start, end]);
  return (
    <mesh position={center} quaternion={rotation} castShadow receiveShadow>
      <boxGeometry args={[28, Math.max(1, length), 22]} />
      <meshStandardMaterial color="#3a4140" roughness={0.4} />
    </mesh>
  );
}
