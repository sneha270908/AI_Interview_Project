'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MiniShapeProps {
  type: 'cube' | 'sphere' | 'torus';
}

export function MiniShape({ type }: MiniShapeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(80, 80);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    let geometry: THREE.BufferGeometry;
    if (type === 'cube') geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    else if (type === 'sphere') geometry = new THREE.IcosahedronGeometry(0.8, 1);
    else geometry = new THREE.TorusGeometry(0.6, 0.25, 8, 20);

    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x00d4ff });
    const mesh = new THREE.LineSegments(edges, material);
    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.015;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [type]);

  return <div ref={ref} className="w-20 h-20" />;
}
