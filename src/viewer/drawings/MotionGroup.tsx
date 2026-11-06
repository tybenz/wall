import type { ReactNode } from "react";
import type { MountTransform } from "../../geometry/MountMotion";
export function MotionGroup({
  transform: t,
  children,
}: {
  transform: MountTransform;
  children: ReactNode;
}) {
  return (
    <group
      position={[t.pivot[0], 0, t.pivot[2] + t.extension]}
      rotation={[0, t.angle, 0]}
    >
      <group position={[-t.pivot[0], 0, -t.pivot[2]]}>{children}</group>
    </group>
  );
}
