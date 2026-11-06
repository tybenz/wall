import type { Project } from "../designer/DesignerTypes";
import {
  distanceDefinitions,
  type DistanceId,
} from "../designer/DistanceDefinitions";
/** Saved layout choices are replayed against the current wall and selected parts. */
export function applyLayoutAlternative(
  current: Project,
  saved: Project,
): Project {
  return {
    ...current,
    upperElectricalPlacement: saved.upperElectricalPlacement,
    blockingPlacement: saved.blockingPlacement,
    electricalMounting: saved.electricalMounting,
    selectedRailPosition: current.mountRailOffsets.positions.includes(
      saved.mountRailOffsets.positions[saved.selectedRailPosition],
    )
      ? current.mountRailOffsets.positions.indexOf(
          saved.mountRailOffsets.positions[saved.selectedRailPosition],
        )
      : current.selectedRailPosition,
    distances: Object.fromEntries(
      (Object.keys(distanceDefinitions) as DistanceId[]).map((id) => [
        id,
        distanceDefinitions[id].kind === "measurement"
          ? current.distances[id]
          : { ...saved.distances[id], kind: "preference" },
      ]),
    ) as Project["distances"],
    products: {
      ...current.products,
      ...Object.fromEntries(
        Object.keys(current.products).map((key) => {
          const id = key as keyof Project["products"];
          return [
            id,
            {
              ...current.products[id],
              appearance: {
                ...current.products[id].appearance,
                color: saved.products[id].appearance.color,
              },
            },
          ];
        }),
      ),
    },
    soundbarOrientation: saved.soundbarOrientation,
    mountSwivelDegrees: saved.mountSwivelDegrees,
  };
}
