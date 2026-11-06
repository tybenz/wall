import { useMemo, useEffect } from "react";
import { DataTexture, RepeatWrapping, RGBAFormat, SRGBColorSpace } from "three";
export function useSurfaceTexture(
  kind: "wood" | "grille" | "screen",
  width = 300,
  height = 1800,
) {
  const texture = useMemo(() => {
    const w = kind === "screen" ? 512 : 128,
      h = kind === "screen" ? 256 : 256,
      data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4,
          noise = (Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
        if (kind === "screen") {
          const u = x / w,
            v = y / h;
          let color = [177 - 35 * v, 191 - 36 * v, 190 - 30 * v];
          if (v < 0.47 + 0.075 * Math.sin(u * 5) + 0.035 * Math.sin(u * 15))
            color = [105 + v * 30, 137 + v * 20, 133 + v * 20];
          if (v < 0.32 + 0.055 * Math.sin(u * 7 + 2))
            color = [64 + v * 25, 106 + v * 30, 103 + v * 30];
          if (v < 0.16 + 0.045 * Math.sin(u * 8 - 1)) color = [43, 77, 76];
          for (let c = 0; c < 3; c++)
            data[i + c] = Math.max(0, color[c] + noise * 2);
        } else {
          const grain =
            kind === "wood"
              ? 228 +
                9 * Math.sin(x * 0.63 + Math.sin(y * 0.03) * 1.2) +
                5 * Math.sin(x * 2.3 + y * 0.01) +
                noise * 6
              : x % 4 === 0 && y % 4 === 0
                ? 105
                : 200;
          data[i] = grain;
          data[i + 1] = grain;
          data[i + 2] = grain;
        }
        data[i + 3] = 255;
      }
    const result = new DataTexture(data, w, h, RGBAFormat);
    result.colorSpace = SRGBColorSpace;
    result.wrapS = result.wrapT = RepeatWrapping;
    if (kind !== "screen")
      result.repeat.set(
        Math.max(0.1, width / (kind === "wood" ? 220 : 70)),
        Math.max(0.1, height / (kind === "wood" ? 1800 : 70)),
      );
    result.needsUpdate = true;
    return result;
  }, [kind, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
