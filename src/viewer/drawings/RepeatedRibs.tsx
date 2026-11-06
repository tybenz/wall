import { profileCutHeight, type WallProfile } from "../../geometry/WallProfile";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
} from "three";
import type { Bounds, Opening } from "../../geometry/AssemblyTypes";
import { useSurfaceTexture } from "./Materials";
export function RepeatedRibs({
  bounds,
  pitch,
  color,
  rounded,
  openings = [],
  topProfile,
}: {
  bounds: Bounds;
  pitch: number;
  color: string;
  rounded: boolean;
  openings?: readonly Opening[];
  topProfile?: WallProfile;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const texture = useSurfaceTexture("wood", pitch, bounds.height);
  const geometry = useMemo(
    () =>
      rounded
        ? new CylinderGeometry(1, 1, 1, 12, 1, false, -Math.PI / 2, Math.PI)
        : new BoxGeometry(1, 1, 1),
    [rounded],
  );
  const ribs = useMemo(() => {
    const result: Bounds[] = [];
    const count = Math.min(1000, Math.ceil(bounds.width / pitch));
    for (let index = 0; index < count; index++) {
      const x = bounds.x + index * pitch,
        ribWidth = Math.min(pitch * 0.89, bounds.x + bounds.width - x);
      const top = topProfile
        ? profileCutHeight(topProfile, x, x + ribWidth)
        : bounds.y + bounds.height;
      let spans: [number, number][] = [[bounds.y, top]];
      for (const opening of openings)
        if (x < opening.x + opening.width && x + ribWidth > opening.x) {
          spans = spans.flatMap(([a, b]) => {
            if (opening.y >= b || opening.y + opening.height <= a)
              return [[a, b]];
            const pieces: [number, number][] = [];
            if (opening.y > a) pieces.push([a, opening.y]);
            if (opening.y + opening.height < b)
              pieces.push([opening.y + opening.height, b]);
            return pieces;
          });
        }
      for (const [a, b] of spans)
        if (b > a)
          result.push({
            x,
            y: a,
            z: bounds.z,
            width: ribWidth,
            height: b - a,
            depth: bounds.depth,
          });
    }
    return result;
  }, [bounds, pitch, openings, topProfile]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new Object3D();
    ribs.forEach((rib, index) => {
      dummy.position.set(
        rib.x + rib.width / 2,
        rib.y + rib.height / 2,
        rib.z + (rounded ? 0 : rib.depth / 2),
      );
      dummy.scale.set(
        rounded ? rib.width / 2 : rib.width,
        rib.height,
        rib.depth,
      );
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
      mesh.current!.setColorAt(
        index,
        new Color(color).multiplyScalar(
          0.93 + 0.07 * Math.sin(index * 13.37) ** 2,
        ),
      );
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [ribs, color, rounded]);
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, ribs.length]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial map={texture} roughness={0.83} />
    </instancedMesh>
  );
}
