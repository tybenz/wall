import type { WallProfile } from "../../geometry/WallProfile";
import { useEffect, useMemo } from "react";
import { ExtrudeGeometry, Path, Shape } from "three";
import type { Bounds, Opening } from "../../geometry/AssemblyTypes";
export function PanelSlab({
  bounds,
  openings = [],
  color,
  topProfile,
}: {
  bounds: Bounds;
  openings?: readonly Opening[];
  color: string;
  topProfile?: WallProfile;
}) {
  const geometry = useMemo(() => {
    const { width: w, height: h, depth } = bounds;
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.lineTo(w, 0);
    if (topProfile) {
      for (const [x, y] of [...topProfile].reverse())
        shape.lineTo(x - bounds.x, y - bounds.y);
    } else {
      shape.lineTo(w, h);
      shape.lineTo(0, h);
    }
    shape.closePath();
    for (const hole of openings) {
      const x = hole.x - bounds.x,
        y = hole.y - bounds.y;
      if (x <= 0 || y <= 0 || x + hole.width >= w || y + hole.height >= h)
        continue;
      const path = new Path();
      path.moveTo(x, y);
      path.lineTo(x, y + hole.height);
      path.lineTo(x + hole.width, y + hole.height);
      path.lineTo(x + hole.width, y);
      path.closePath();
      shape.holes.push(path);
    }
    return new ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  }, [bounds, openings, topProfile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      position={[bounds.x, bounds.y, bounds.z]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
