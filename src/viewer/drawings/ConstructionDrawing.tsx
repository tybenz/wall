import { Line } from "@react-three/drei";
import type { Assembly } from "../../geometry/AssemblyTypes";
import type { ViewSnapshot } from "../ViewStore";
import { SolidPart } from "./SolidPart";
export function ConstructionDrawing({
  assembly,
  state,
}: {
  assembly: Assembly;
  state: ViewSnapshot;
}) {
  const { construction: c } = assembly;
  return (
    <group>
      {state.level === 4 &&
        c.studs.map((bounds, index) => (
          <SolidPart key={`stud-${index}`} bounds={bounds} color="#bda27c" />
        ))}
      {state.level === 4 &&
        c.blocking.map((bounds, index) => (
          <SolidPart key={`block-${index}`} bounds={bounds} color="#b8976b" />
        ))}
      {state.showSupports && state.level < 4 && (
        <>
          {c.supports.map((bounds, index) => (
            <SolidPart
              key={`support-${index}`}
              bounds={bounds}
              color={bounds.role === "mount" ? "#93a87d" : "#d7bf9b"}
            />
          ))}
          {state.level >= 2 &&
            c.lagPaths.map((path, index) => (
              <Line
                key={`lag-${index}`}
                points={[[...path.start], [...path.end]]}
                color="#6c8055"
                lineWidth={2}
                dashed
                dashSize={12}
                gapSize={8}
              />
            ))}
        </>
      )}
      {state.showElectrical && state.level >= 1 && (
        <>
          {c.plates.map((b, index) => (
            <group key={index}>
              <SolidPart bounds={c.boxes[index]} color="#54727a" radius={4} />
              <SolidPart
                bounds={{
                  x: b.x,
                  y: b.y,
                  z: b.z,
                  width: b.width,
                  height: b.height,
                  depth: 3,
                }}
                color="#e0dfd6"
                radius={3}
              />
              {[-1, 1].map((side) => (
                <group key={side}>
                  <SolidPart
                    bounds={{
                      x:
                        b.x +
                        b.width / 2 +
                        side * b.width * 0.2 -
                        b.width * 0.08,
                      y: b.y + b.height * 0.2,
                      z: b.z + 3,
                      width: b.width * 0.16,
                      height: b.height * 0.2,
                      depth: 2,
                    }}
                    color={side < 0 ? "#383f3e" : "#4c6062"}
                  />
                  <SolidPart
                    bounds={{
                      x:
                        b.x +
                        b.width / 2 +
                        side * b.width * 0.2 -
                        b.width * 0.08,
                      y: b.y + b.height * 0.6,
                      z: b.z + 3,
                      width: b.width * 0.16,
                      height: b.height * 0.2,
                      depth: 2,
                    }}
                    color={side < 0 ? "#383f3e" : "#4c6062"}
                  />
                </group>
              ))}
            </group>
          ))}
          {state.level === 4 &&
            c.routes.map((route, index) => (
              <Line
                key={index}
                points={route.map((point) => [...point])}
                color={index === 0 ? "#c08a48" : "#5d8b91"}
                lineWidth={3}
              />
            ))}
        </>
      )}
    </group>
  );
}
