import { useEffect, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Normalized face UVs keep textures independent of world-unit dimensions. */
export function RoundedBox({
  args,
  radius = 1,
  smoothness = 3,
  children,
  ...props
}: Omit<ThreeElements["mesh"], "args"> & {
  args: [number, number, number];
  radius?: number;
  smoothness?: number;
}) {
  const [width, height, depth] = args;
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        width,
        height,
        depth,
        smoothness,
        Math.min(radius, width / 3, height / 3, depth / 3),
      ),
    [width, height, depth, smoothness, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh {...props} geometry={geometry}>
      {children}
    </mesh>
  );
}
