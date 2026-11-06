import { upgradeConstruction } from "./UpgradeConstruction";
import {
  createElectricalParts,
  initialElectricalMounting,
} from "../electrical/ElectricalTypes";
import { createInitialProject } from "../designer/InitialProject";
import { z } from "zod";
import {
  distanceDefinitions,
  constructionDistanceIds,
  mountConstructionDistanceIds,
  type DistanceId,
} from "../designer/DistanceDefinitions";
import type { Project } from "../designer/DesignerTypes";
const length = z.number().finite().min(1).max(10000);
const evidence = z
  .object({
    kind: z.enum(["manufacturer", "user-listing", "assumption"]),
    source: z.string().max(2000),
    note: z.string().max(4000),
  })
  .strict();
const fact = z
  .object({
    mm: length,
    evidence,
    confidence: z.enum(["confirmed", "provisional"]).default("provisional"),
  })
  .strict();
const product = z
  .object({
    id: z.string().max(100),
    name: z.string().max(200),
    width: fact,
    height: fact,
    depth: fact,
    appearance: z
      .object({
        color: z.string().regex(/^#[0-9a-f]{6}$/i),
        profile: z.enum([
          "screen",
          "square-fluted",
          "round-fluted",
          "grille",
          "smooth",
        ]),
      })
      .strict(),
  })
  .strict();
const distance = z
  .object({
    mm: z.number().finite(),
    kind: z.enum(["measurement", "preference"]),
    confidence: z.enum(["confirmed", "provisional"]),
    note: z.string().max(4000),
  })
  .strict();
const distanceKeys = Object.keys(distanceDefinitions) as [
  DistanceId,
  ...DistanceId[],
];
const electricalSpec = z
  .object({
    plateWidth: fact,
    plateHeight: fact,
    plateDepth: fact,
    bodyWidth: fact,
    bodyHeight: fact,
    bodyDepth: fact,
    openingWidth: fact,
    openingHeight: fact,
  })
  .strict();
const electricalKeys = z.enum([
  "upperPower",
  "upperSignal",
  "lowerPower",
  "lowerSignal",
]);
export const projectSchema = z.preprocess(
  upgradeConstruction,
  z
    .object({
      schemaVersion: z.literal(2),
      upperElectricalPlacement: z.enum(["below", "above"]).default("below"),
      blockingPlacement: z.enum(["follow-mount", "manual"]).default("follow-mount"),
      electricalParts: z
        .record(electricalKeys, electricalSpec)
        .default(createElectricalParts),
      electricalMounting: z
        .record(electricalKeys, z.enum(["drywall", "finish"]))
        .default(() => ({ ...initialElectricalMounting })),
      mountRailOffsets: z
        .object({
          positions: z
            .array(z.number().finite().min(-1500).max(1500))
            .min(1)
            .max(30)
            .refine(
              (values) => new Set(values).size === values.length,
              "Rail shifts must be unique.",
            ),
          confirmed: z.boolean(),
        })
        .strict()
        .default(() => ({
          positions: [-25.4, -12.7, 0, 12.7, 25.4],
          confirmed: false,
        })),
      selectedRailPosition: z.number().int().min(0).max(29).default(2),
      name: z.string().min(1).max(200),
      distances: z.preprocess(
        (value) => {
          if (!value || typeof value !== "object" || Array.isArray(value))
            return value;
          const original = value as Record<string, unknown>;
          const defaults = createInitialProject().distances;
          const added = [
            "wallLeftHeight",
            "wallRightHeight",
            "beamOffsetX",
            "beamWidth",
            "beamDrop",
            "beamProjection",
          ] as const;
          // Upgrade the old untouched rectangular-wall placeholder only. Keep
          // customized measurements and every unrelated saved edit intact.
          const legacyHeight = original.wallHeight;
          const upgradeHeight =
            added.every((id) => !(id in original)) &&
            typeof legacyHeight === "object" &&
            legacyHeight !== null &&
            "mm" in legacyHeight &&
            legacyHeight.mm === 2743.2 &&
            "note" in legacyHeight &&
            typeof legacyHeight.note === "string" &&
            legacyHeight.note.startsWith("Simplified rectangular wall");
          const {
            powerPortOffsetX: _powerPortOffsetX,
            signalPortOffsetX: _signalPortOffsetX,
            powerPortHeight: _powerPortHeight,
            signalPortHeight: _signalPortHeight,
            tvPortHeight: _tvPortHeight,
            powerLeadLength: _powerLeadLength,
            signalLeadLength: _signalLeadLength,
            cableSlack: _cableSlack,
            connectorProjection: _connectorProjection,
            cableBendSpace: _cableBendSpace,
            tvOffsetX: _tvOffsetX,
            consoleOffsetX: _consoleOffsetX,
            panelOffsetX: _panelOffsetX,
            panelOffsetY: _panelOffsetY,
            openingWidth: _openingWidth,
            openingHeight: _openingHeight,
            mountSpacerDepth: _mountSpacerDepth,
            upperBoxHeight: _upperBoxHeight,
            ...current
          } = original;
          return {
            ...Object.fromEntries(
              [...constructionDistanceIds, ...mountConstructionDistanceIds].map(
                (id) => [id, defaults[id]],
              ),
            ),
            mountExtension: defaults.mountExtension,
            cradleThickness: defaults.cradleThickness,
            upperBoxGap: defaults.upperBoxGap,
            supportSpacing: defaults.supportSpacing,
            supportWidth: defaults.supportWidth,
            supportInset: defaults.supportInset,
            ...Object.fromEntries(added.map((id) => [id, defaults[id]])),
            ...current,
            ...(upgradeHeight ? { wallHeight: defaults.wallHeight } : {}),
            ...(typeof original.soundbarGap === "object" &&
            original.soundbarGap !== null &&
            "mm" in original.soundbarGap &&
            original.soundbarGap.mm === 25.4 &&
            "note" in original.soundbarGap &&
            original.soundbarGap.note ===
              "TV bottom to soundbar top; bar assumed flat."
              ? { soundbarGap: defaults.soundbarGap }
              : {}),
          };
        },
        z.record(z.enum(distanceKeys), distance).superRefine((values, ctx) => {
          for (const id of distanceKeys) {
            const { min, max } = distanceDefinitions[id];
            if (values[id].mm < min || values[id].mm > max)
              ctx.addIssue({
                code: "custom",
                path: [id, "mm"],
                message: `Must be between ${min} and ${max} mm.`,
              });
          }
        }),
      ),
      products: z
        .object({
          tv: product,
          console: product,
          slats: product,
          soundbar: product,
          featurePanel: product,
        })
        .strict(),
      studs: z
        .object({
          positions: z
            .array(z.number().finite().min(0).max(10000))
            .max(50)
            .refine(
              (values) => new Set(values).size === values.length,
              "Stud positions must be unique.",
            ),
          confirmed: z.boolean(),
        })
        .strict(),
      soundbarOrientation: z.enum(["flat", "vertical"]),
      mountSwivelDegrees: z.number().finite().min(0).max(70).default(30),
    })
    .strict()
    .superRefine((project, ctx) => {
      if (
        project.selectedRailPosition >=
        project.mountRailOffsets.positions.length
      )
        ctx.addIssue({
          code: "custom",
          path: ["selectedRailPosition"],
          message: "Choose an available rail mounting position.",
        });
    }),
);
export function parseProject(value: unknown): Project {
  const parsed = projectSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "Invalid or unsupported project. " +
        parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .slice(0, 3)
          .join(" "),
    );
  return {
    ...parsed.data,
    distances: Object.fromEntries(
      Object.entries(parsed.data.distances).map(([id, value]) => [
        id,
        { ...value, kind: distanceDefinitions[id as DistanceId].kind },
      ]),
    ) as Project["distances"],
  };
}
export function decodeProject(text: string): Project {
  if (text.length > 500000) throw new Error("Project file is too large.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not a valid JSON project.");
  }
  return parseProject(value);
}
