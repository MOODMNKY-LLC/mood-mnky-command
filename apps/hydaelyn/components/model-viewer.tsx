"use client";

import {
  Suspense,
  useMemo,
  useState,
  useEffect,
  Component,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Center, Html } from "@react-three/drei";
import type { Group } from "three";

const FIT_SCALE = 1.4;

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url) as unknown as { scene: Group };
  const cloned = useMemo(() => scene.clone(), [scene]);
  return (
    <Center
      onCentered={({ container, width, height, depth }) => {
        if (!container) return;
        const maxDim = Math.max(width, height, depth);
        if (maxDim > 1e-6) {
          const scale = FIT_SCALE / maxDim;
          container.scale.setScalar(Math.min(100, Math.max(0.001, scale)));
        }
      }}
    >
      {/* @ts-expect-error R3F "primitive" not in React 19 JSX.IntrinsicElements; runtime works */}
      <primitive object={cloned} />
    </Center>
  );
}

function Scene({ url, onError }: { url: string; onError?: () => void }) {
  return (
    <>
      {/* @ts-expect-error R3F intrinsic */}
      <ambientLight intensity={0.65} />
      {/* @ts-expect-error R3F intrinsic */}
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      {/* @ts-expect-error R3F intrinsic */}
      <directionalLight position={[-3, 4, -2]} intensity={0.5} />
      <Environment preset="studio" />
      <Suspense
        fallback={
          <Html center className="text-xs text-muted-foreground">
            Loading…
          </Html>
        }
      >
        <ModelWithErrorBoundary url={url} onError={onError} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 + 0.2}
        makeDefault
      />
    </>
  );
}

type ModelWithErrorBoundaryProps = { url: string; onError?: () => void };

class ModelErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError = () => ({ hasError: true });

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center className="text-xs text-muted-foreground text-center px-2">
          Model failed to load
        </Html>
      );
    }
    return this.props.children;
  }
}

function ModelWithErrorBoundary({ url, onError }: ModelWithErrorBoundaryProps) {
  return (
    <ModelErrorBoundary onError={onError}>
      <Model url={url} />
    </ModelErrorBoundary>
  );
}

type ModelViewerProps = {
  modelUrl?: string;
  className?: string;
};

export function ModelViewer({
  modelUrl = "/models/mood-mnky.glb",
  className,
}: ModelViewerProps) {
  const [showFallback, setShowFallback] = useState(false);

  // No HEAD pre-check: it can falsely fail (e.g. Next.js static). Let Canvas try to load.
  // If useGLTF throws, ModelErrorBoundary catches it and we can show fallback.
  useEffect(() => {
    setShowFallback(false);
  }, [modelUrl]);

  const handleModelError = () => {
    setShowFallback(true);
  };

  if (showFallback) {
    return (
      <div
        className={
          className ??
          "aspect-[3/4] w-full min-h-[200px] rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center"
        }
      >
        <p className="text-xs text-muted-foreground text-center px-3">
          Model failed to load. Check <code className="rounded bg-muted px-1">public/models/</code> and
          the file path.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "aspect-[3/4] w-full min-h-[200px] rounded-lg overflow-hidden bg-muted/30"
      }
      style={{ position: "relative" }}
    >
      <Canvas
        key={modelUrl}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Scene url={modelUrl} onError={handleModelError} />
      </Canvas>
    </div>
  );
}
