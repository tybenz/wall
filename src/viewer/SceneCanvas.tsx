import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import type { Project } from "../designer/DesignerTypes";
import type { Assembly } from "../geometry/AssemblyTypes";
import type { ViewSnapshot } from "./ViewStore";
import { AssemblyDrawing } from "./drawings/AssemblyDrawing";
export default function SceneCanvas({
  camera,
  project,
  assembly,
  state,
}: {
  camera: OrthographicCamera;
  project: Project;
  assembly: Assembly;
  state: ViewSnapshot;
}) {
  return (
    <Canvas
      orthographic
      camera={camera}
      frameloop="demand"
      dpr={[1, 2]}
      shadows
      fallback={
        <div className="canvas-fallback">
          3D rendering requires WebGL. Editing and project export remain
          available.
        </div>
      }
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#f0eee8"]} />
      <ambientLight intensity={1.35} />
      <hemisphereLight args={["#ffffff", "#b5a893", 1.3]} />
      <directionalLight
        position={[-2000, 5000, 5000]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5000}
        shadow-camera-right={5000}
        shadow-camera-top={5000}
        shadow-camera-bottom={-5000}
        shadow-camera-near={10}
        shadow-camera-far={20000}
        shadow-bias={-0.0003}
        shadow-normalBias={1}
      />
      <directionalLight position={[4000, 1000, 2000]} intensity={0.6} />
      <Suspense fallback={null}>
        <AssemblyDrawing project={project} assembly={assembly} state={state} />
      </Suspense>
    </Canvas>
  );
}
