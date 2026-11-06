import { Box3, OrthographicCamera, Vector3 } from "three";
import type { Assembly } from "../geometry/AssemblyTypes";
import type { CameraPreset } from "./ViewStore";
export type Point3 = readonly [number, number, number];
export function createCamera(
  assembly: Assembly,
  width: number,
  height: number,
  preset: CameraPreset,
  zoom = 1,
): OrthographicCamera {
  const box = new Box3();
  for (const part of assembly.parts) {
    const b = part.bounds;
    box.expandByPoint(new Vector3(b.x, b.y, b.z));
    box.expandByPoint(
      new Vector3(b.x + b.width, b.y + b.height, b.z + b.depth),
    );
  }
  const center = box.getCenter(new Vector3());
  const direction =
    preset === "front"
      ? new Vector3(0, 0, 1)
      : preset === "side"
        ? new Vector3(1, 0, 0)
        : new Vector3(1, 1, 1).normalize();
  const camera = Object.assign(new OrthographicCamera(-1, 1, 1, -1, 1, 50000), {
    manual: true,
  });
  camera.position.copy(center).addScaledVector(direction, 15000);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  let maxX = 1,
    maxY = 1;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const point = new Vector3(x, y, z).applyMatrix4(
          camera.matrixWorldInverse,
        );
        maxX = Math.max(maxX, Math.abs(point.x));
        maxY = Math.max(maxY, Math.abs(point.y));
      }
  const aspect = width / height,
    halfHeight = Math.max(maxY, maxX / aspect) * 1.23;
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
  return camera;
}
export function projectPoint(
  point: Point3,
  camera: OrthographicCamera,
  width: number,
  height: number,
): [number, number] {
  const projected = new Vector3(...point).project(camera);
  return [((projected.x + 1) * width) / 2, ((1 - projected.y) * height) / 2];
}
