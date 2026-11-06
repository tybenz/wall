import { RoundedBox } from "./RoundedBox";
import type { Bounds } from "../../geometry/AssemblyTypes";
import { useSurfaceTexture } from "./Materials";
import { SolidPart } from "./SolidPart";
export function Television({
  bounds,
  screenOn,
  color,
}: {
  bounds: Bounds;
  screenOn: boolean;
  color: string;
}) {
  const b = bounds,
    texture = useSurfaceTexture("screen"),
    frontThickness = Math.min(10, b.depth * 0.25);
  return (
    <group>
      <SolidPart
        bounds={{
          ...b,
          width: b.width * 0.94,
          height: b.height * 0.72,
          x: b.x + b.width * 0.03,
          depth: b.depth - frontThickness,
        }}
        color={color}
        radius={9}
      />
      <SolidPart
        bounds={{
          ...b,
          z: b.z + b.depth - frontThickness,
          depth: frontThickness,
        }}
        color={color}
        radius={3}
        roughness={0.25}
      />
      <RoundedBox
        args={[
          Math.max(1, b.width - 13),
          Math.max(1, b.height - 19),
          Math.min(2, b.depth * 0.05),
        ]}
        radius={1}
        position={[
          b.x + b.width / 2,
          b.y + b.height / 2 + 3,
          b.z + b.depth + 0.3,
        ]}
      >
        <meshBasicMaterial
          map={screenOn ? texture : null}
          color={screenOn ? "#ffffff" : "#151e23"}
        />
      </RoundedBox>
      <SolidPart
        bounds={{
          x: b.x + b.width / 2 - 12,
          y: b.y - 5,
          z: b.z + b.depth - 8,
          width: 24,
          height: 5,
          depth: 5,
        }}
        color="#242526"
      />
    </group>
  );
}
