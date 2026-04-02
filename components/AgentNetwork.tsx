/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, Trail } from '@react-three/drei'
import * as THREE from 'three'

function NetworkNodes() {
  const group = useRef<THREE.Group>(null)

  // Generate deterministic-looking random positions for nodes
  const nodes = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 20; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        )
      )
    }
    return pts
  }, [])

  // Rotate the whole network slowly
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
    }
  })

  // Determine connections (just simple distance-based or index-based)
  const lines = useMemo(() => {
    const l: [THREE.Vector3, THREE.Vector3][] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 6) {
          l.push([nodes[i], nodes[j]])
        }
      }
    }
    return l
  }, [nodes])

  return (
    <group ref={group}>
      {/* Nodes */}
      {nodes.map((pos, i) => (
        <Float key={`node-${i}`} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={pos}>
            <sphereGeometry args={[i % 3 === 0 ? 0.2 : 0.1, 16, 16]} />
            <meshBasicMaterial color={i % 4 === 0 ? '#fcd34d' : '#67e8f9'} />
          </mesh>
        </Float>
      ))}

      {/* Connections */}
      {lines.map((line, i) => (
        <Line
          key={`line-${i}`}
          points={line}
          color="#22d3ee"
          opacity={0.15}
          transparent
          lineWidth={1}
        />
      ))}
      
      {/* Moving packets to simulate data/webhooks */}
      <DataPacket path={lines[0] || [new THREE.Vector3(), new THREE.Vector3()]} color="#fcd34d" speed={0.5} />
      <DataPacket path={lines[5] || [new THREE.Vector3(), new THREE.Vector3()]} color="#67e8f9" speed={0.3} delay={1} />
      <DataPacket path={lines[10] || [new THREE.Vector3(), new THREE.Vector3()]} color="#67e8f9" speed={0.6} delay={2} />
    </group>
  )
}

function DataPacket({ path, color, speed, delay = 0 }: { path: THREE.Vector3[], color: string, speed: number, delay?: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!mesh.current) return
    const t = ((state.clock.elapsedTime - delay) * speed) % 1
    if (t < 0) {
      mesh.current.visible = false
      return
    }
    mesh.current.visible = true
    mesh.current.position.lerpVectors(path[0], path[1], t)
  })

  return (
    <Trail width={0.5} color={color} length={2} decay={1} attenuation={(t) => t * t}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Trail>
  )
}

export function AgentNetwork() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <fog attach="fog" args={['#030307', 5, 25]} />
        <NetworkNodes />
      </Canvas>
    </div>
  )
}
