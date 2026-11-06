import { Line } from "@react-three/drei";
import type { Assembly } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
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
      {state.showSupports && (
        <>
          {c.supports.map((bounds, index) => (
            <SolidPart
              key={`support-${index}`}
              bounds={bounds}
              color="#d7bf9b"
            />
          ))}
          <SolidPart
            bounds={getPart(assembly, "mountSpacer").bounds}
            color="#3a3630"
          />
        </>
      )}
      {state.showElectrical && state.level >= 3 && (
        <>
          {c.boxes.map((b, index) => (
            <group key={index}>
              <SolidPart bounds={b} color="#54727a" radius={4} />
              <SolidPart
                bounds={{
                  x: b.x + 7,
                  y: b.y + 7,
                  z: b.z + b.depth,
                  width: b.width - 14,
                  height: b.height - 14,
                  depth: 3,
                }}
                color="#e0dfd6"
                radius={3}
              />
              {[-1, 1].map((side) => (
                <group key={side}>
                  <SolidPart
                    bounds={{
                      x: b.x + b.width / 2 + side * 30 - 12,
                      y: b.y + 25,
                      z: b.z + b.depth + 3,
                      width: 24,
                      height: 28,
                      depth: 2,
                    }}
                    color={side < 0 ? "#383f3e" : "#4c6062"}
                  />
                  <SolidPart
                    bounds={{
                      x: b.x + b.width / 2 + side * 30 - 12,
                      y: b.y + 77,
                      z: b.z + b.depth + 3,
                      width: 24,
                      height: 28,
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
