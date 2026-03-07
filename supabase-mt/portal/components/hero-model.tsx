'use client'

import { useState, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, Center } from '@react-three/drei'
import type { Group } from 'three'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const MODELS = [
  { id: 'mood-mnky' as const, url: '/models/mood-mnky.glb', label: 'MOOD' },
  { id: 'sage-mnky' as const, url: '/models/sage-mnky.glb', label: 'SAGE' },
  { id: 'code-mnky' as const, url: '/models/code-mnky.glb', label: 'CODE' },
] as const

type ModelId = (typeof MODELS)[number]['id']

function HeroModelMesh({ url, rotationY }: { url: string; rotationY: number }) {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(url)

  useFrame((_, delta) => {
    if (ref.current) {
      const k = Math.min(1, delta * 8)
      ref.current.rotation.y += (rotationY - ref.current.rotation.y) * k
    }
  })

  return (
    <group ref={ref} scale={1.85}>
      <primitive object={scene} />
    </group>
  )
}

function Scene({ modelUrl, rotationY }: { modelUrl: string; rotationY: number }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Suspense fallback={null}>
        <Center>
          <HeroModelMesh url={modelUrl} rotationY={rotationY} />
        </Center>
        <Environment preset="studio" />
      </Suspense>
    </>
  )
}

export function HeroModel() {
  const [modelId, setModelId] = useState<ModelId>('mood-mnky')
  const [rotationY, setRotationY] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)
  const current = MODELS.find((m) => m.id === modelId) ?? MODELS[0]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    setRotationY(x * Math.PI * 2)
  }

  return (
    <div className="relative w-full flex flex-col gap-0">
      <div
        ref={viewportRef}
        className="relative w-full aspect-square min-h-[200px] rounded-t-2xl overflow-hidden bg-muted/30 cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
      >
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <Scene modelUrl={current.url} rotationY={rotationY} key={current.id} />
        </Canvas>
      </div>
      <div className="flex shrink-0 justify-center gap-2 p-2 rounded-b-2xl bg-background/60 backdrop-blur-sm border-t border-border/50">
        {MODELS.map((m) => (
          <Badge
            key={m.id}
            variant={modelId === m.id ? 'default' : 'secondary'}
            role="button"
            tabIndex={0}
            onClick={() => setModelId(m.id)}
            onKeyDown={(e) => e.key === 'Enter' && setModelId(m.id)}
            className={cn(
              'cursor-pointer transition-colors',
              modelId !== m.id && 'hover:bg-secondary/80'
            )}
          >
            {m.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}

MODELS.forEach((m) => useGLTF.preload(m.url))
