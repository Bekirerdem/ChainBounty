"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function NetworkParticles() {
  const count = 40; // Number of particles (Subnets) - Optimized for performance
  const mesh = useRef<THREE.InstancedMesh>(null);

  // Generate random positions for particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      temp.push({ x, y, z, vx: (Math.random() - 0.5) * 0.01, vy: (Math.random() - 0.5) * 0.01 });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frame loop for animation
  useFrame((state) => {
    if (!mesh.current) return;

    // Update particle positions
    particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off boundaries (simple box)
      if (Math.abs(particle.x) > 10) particle.vx *= -1;
      if (Math.abs(particle.y) > 5) particle.vy *= -1;

      // Update instanced mesh matrix
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.setScalar(0.05); // Particle size
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;

    // Camera parallax based on mouse
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 0.5, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 0.5, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Red Glowing Nodes */}
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#E84142" transparent opacity={0.8} />
      </instancedMesh>
      
      {/* Optional: Add connections or lines here if needed for more complex "Subnet" visuals */}
    </>
  );
}
