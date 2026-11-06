import {
  createElectricalParts,
  electricalParts,
  type ElectricalDimensionId,
  type ElectricalCatalog,
} from "../electrical/ElectricalTypes";
import { inches } from "../shared/Units";
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const mm = (value: unknown, fallback: number) => {
  const r = record(value);
  return r && typeof r.mm === "number" && Number.isFinite(r.mm)
    ? r.mm
    : fallback;
};
/** Preserve legacy assembly datums without presenting inferred component facts as measured. */
export function upgradeConstruction(value: unknown): unknown {
  const root = record(value);
  if (!root) return value;
  const distances = record(root.distances);
  if (!distances) return value;
  const d = { ...distances };
  const inferred = (value: number, note: string) => ({
    mm: value,
    kind: "measurement",
    confidence: "provisional",
    note,
  });
  const mountHeight = mm(d.mountHeight, inches(9)),
    oldOffset = mm(d.mountOffsetY, inches(-2));
  const products = record(root.products),
    tv = record(products?.tv),
    tvHeight = mm(tv?.height, inches(32.7));
  const existingHookModel = "tvTopToMountHole" in d;
  if (!existingHookModel && "mountOffsetY" in d) {
    // Neutral rail reference + default hook/plate relation reconstructs the old wall plate top.
    d.tvTopToMountHole = inferred(
      tvHeight / 2 - oldOffset - mountHeight / 2,
      "Inferred from the previous mount-center placeholder to preserve wall plate height; measure actual TV mounting holes.",
    );
    d.railReferenceHoleBelowHook = inferred(
      inches(2),
      "Unmeasured reference rail hole below hook; paired with inferred TV datum for legacy positioning.",
    );
    d.hookAbovePlateTop = inferred(
      inches(2),
      "Unmeasured assembled hook / wall plate relation; legacy geometry preserved, not measured hardware.",
    );
  }
  if (!("lagTopRowInset" in d) && "lagRowSpacing" in d) {
    const spacing = mm(d.lagRowSpacing, mountHeight / 2);
    d.lagTopRowInset = inferred(
      (mountHeight - spacing) / 2,
      "Inferred from previous symmetric lag rows; verify actual upper row.",
    );
    d.lagBottomRowInset = inferred(
      (mountHeight + spacing) / 2,
      "Inferred from previous symmetric lag rows; verify actual lower row.",
    );
    d.lagColumnSpacing = inferred(
      mm(d.supportSpacing, inches(16)),
      "Previously inferred from spacer centers; verify actual mount hole columns.",
    );
  }
  let catalog: unknown = root.electricalParts;
  if (catalog === undefined && ("plateWidth" in d || "boxWidth" in d)) {
    const parts = createElectricalParts();
    const gap = Math.min(
      mm(d.electricalPlateGap, inches(0.5)),
      mm(d.plateWidth, 150) / 4,
      mm(d.boxWidth, 130) / 4,
    );
    if (!("electricalPlateGap" in d))
      d.electricalPlateGap = {
        mm: gap,
        kind: "preference",
        confidence: "provisional",
        note: "Initial gap chosen while splitting the previous combined envelope.",
      };
    catalog = Object.fromEntries(
      electricalParts.map((part) => {
        const spec = parts[part.id];
        const plateWidth = (mm(d.plateWidth, 150) - gap) / 2;
        const openingWidth = (mm(d.boxWidth, 130) - gap) / 2;
        const updates: Partial<Record<ElectricalDimensionId, number>> = {
          plateWidth,
          plateHeight: mm(d.plateHeight, 130),
          openingWidth,
          openingHeight: mm(d.boxHeight, 110),
          bodyWidth: Math.min(spec.bodyWidth.mm, openingWidth - 2),
          bodyHeight: Math.min(spec.bodyHeight.mm, mm(d.boxHeight, 110) - 2),
          bodyDepth:
            mm(d.boxDepth, inches(2.25)) + mm(d.drywallThickness, inches(0.5)),
        };
        return [
          part.id,
          {
            ...spec,
            ...Object.fromEntries(
              Object.entries(updates).map(([id, v]) => [
                id,
                {
                  mm: v,
                  confidence: "provisional",
                  evidence: {
                    kind: "assumption",
                    source: "legacy-combined-electrical-envelope",
                    note: "Inferred from the earlier combined envelope; verify this separate component and opening.",
                  },
                },
              ]),
            ),
          },
        ];
      }),
    ) as ElectricalCatalog;
  }
  for (const key of [
    "mountOffsetY",
    "lagRowSpacing",
    "plateWidth",
    "plateHeight",
    "boxWidth",
    "boxHeight",
    "boxDepth",
  ])
    delete d[key];
  return {
    ...root,
    distances: d,
    ...(catalog === undefined ? {} : { electricalParts: catalog }),
  };
}
