import type { Project } from "../designer/DesignerTypes";
export type ProfilePoint = readonly [number, number];
export type WallProfile = readonly ProfilePoint[];

/** The finished wall boundary, including the notch occupied by the beam. */
export function resolveWallProfile(project: Project): WallProfile {
  const d = project.distances,
    w = d.wallWidth.mm;
  const half = Math.min(d.beamWidth.mm, w - 2) / 2;
  const center = Math.max(
    half + 1,
    Math.min(w - half - 1, w / 2 + d.beamOffsetX.mm),
  );
  const peak = d.wallHeight.mm;
  const underside = Math.max(1, peak - d.beamDrop.mm);
  return [
    [0, d.wallLeftHeight.mm],
    [center - half, peak],
    [center - half, underside],
    [center + half, underside],
    [center + half, peak],
    [w, d.wallRightHeight.mm],
  ];
}

export function profileHeightAt(profile: WallProfile, x: number): number {
  // At a vertical notch edge, the lower adjacent height is the safe cut limit.
  const heights: number[] = [];
  for (let i = 1; i < profile.length; i++) {
    const [ax, ay] = profile[i - 1],
      [bx, by] = profile[i];
    if (x < ax || x > bx) continue;
    heights.push(
      bx === ax ? Math.min(ay, by) : ay + ((by - ay) * (x - ax)) / (bx - ax),
    );
  }
  return heights.length ? Math.min(...heights) : 0;
}

export function profileCutHeight(
  profile: WallProfile,
  left: number,
  right: number,
): number {
  return Math.min(
    profileHeightAt(profile, left),
    profileHeightAt(profile, right),
    ...profile.filter(([x]) => x > left && x < right).map(([, y]) => y),
  );
}
