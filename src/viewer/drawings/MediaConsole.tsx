import { RoundedBox } from "./RoundedBox";
import type { Bounds } from "../../geometry/AssemblyTypes";
import { useSurfaceTexture } from "./Materials";
import { RepeatedRibs } from "./RepeatedRibs";
import { SolidPart } from "./SolidPart";
export function MediaConsole({
  bounds,
  color,
  pitch,
}: {
  bounds: Bounds;
  color: string;
  pitch: number;
}) {
  const b = bounds,
    leg = Math.min(105, b.height * 0.18),
    top = Math.min(22, b.height * 0.04);
  const grain = useSurfaceTexture("wood", b.width, b.height);
  const body = { ...b, y: b.y + leg, height: b.height - leg - top };
  return (
    <group>
      <RoundedBox
        args={[b.width, body.height, b.depth]}
        radius={Math.min(28, b.depth * 0.15, body.height * 0.1)}
        smoothness={4}
        position={[
          b.x + b.width / 2,
          body.y + body.height / 2,
          b.z + b.depth / 2,
        ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} map={grain} roughness={0.67} />
      </RoundedBox>
      <RoundedBox
        args={[b.width + 2, top, b.depth + 2]}
        radius={Math.min(6, top / 3)}
        smoothness={3}
        position={[
          b.x + b.width / 2,
          b.y + b.height - top / 2,
          b.z + b.depth / 2,
        ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={color} map={grain} roughness={0.55} />
      </RoundedBox>
      <RepeatedRibs
        bounds={{
          x: b.x + 20,
          y: body.y + 12,
          z: b.z + b.depth - 3,
          width: b.width - 40,
          height: body.height - 24,
          depth: 8,
        }}
        pitch={pitch}
        color={color}
        rounded={false}
      />
      {[0.25, 0.75].map((fraction) => (
        <SolidPart
          key={fraction}
          bounds={{
            x: b.x + b.width * fraction - 12,
            y: b.y,
            z: b.z + b.depth - 15,
            width: 24,
            height: b.height - top,
            depth: 30,
          }}
          color={color}
          radius={4}
        />
      ))}
      {[0.25, 0.75].map((fraction) => (
        <SolidPart
          key={`back-${fraction}`}
          bounds={{
            x: b.x + b.width * fraction - 14,
            y: b.y,
            z: b.z + 24,
            width: 28,
            height: leg + 15,
            depth: 35,
          }}
          color={color}
          radius={4}
        />
      ))}
      {[0.25, 0.5, 0.75].map((fraction) => (
        <SolidPart
          key={`seam-${fraction}`}
          bounds={{
            x: b.x + b.width * fraction - 1,
            y: body.y + 13,
            z: b.z + b.depth + 5.1,
            width: 2,
            height: body.height - 26,
            depth: 0.8,
          }}
          color="#382e25"
        />
      ))}
    </group>
  );
}
