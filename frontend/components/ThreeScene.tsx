'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { RGBELoader } from 'three-stdlib';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface ThreeSceneProps {
  variant?: 'hero' | 'auth';
  intensity?: 'normal' | 'high';
  className?: string;
  showQuote?: string;
}

const HDR_URL =
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr';

type MorphSphere = {
  mesh: THREE.Mesh;
  geo: THREE.SphereGeometry;
  basePositions: Float32Array;
  morphAmp: number;
  noiseSeed: number;
};

type BurstParticle = {
  mesh: THREE.Points;
  velocities: THREE.Vector3[];
  lives: number[];
  maxLife: number;
};

function springEase(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.LineSegments ||
      child instanceof THREE.Points
    ) {
      child.geometry?.dispose();
      const mat = child.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    }
  });
}

function createIridescentMaterial(color: string, envMap: THREE.Texture | null): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0,
    metalness: 0.1,
    transmission: 0.9,
    thickness: 2,
    ior: 1.8,
    iridescence: 1,
    iridescenceIOR: 2.3,
    transparent: true,
    envMapIntensity: 3,
  });
  if (envMap) {
    mat.envMap = envMap;
    mat.needsUpdate = true;
  }
  return mat;
}

function setupMorphSphere(
  radius: number,
  segments: number,
  color: string,
  morphAmp: number,
  envMap: THREE.Texture | null
): MorphSphere {
  const geo = new THREE.SphereGeometry(radius, segments, segments);
  const basePositions = geo.attributes.position.array.slice() as Float32Array;
  const mat = createIridescentMaterial(color, envMap);
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, geo, basePositions, morphAmp, noiseSeed: Math.random() * 100 };
}

function applyMorph(
  sphere: MorphSphere,
  time: number,
  noise3D: ReturnType<typeof createNoise3D>,
  extraAmp = 0
) {
  const pos = sphere.geo.attributes.position;
  const arr = pos.array as Float32Array;
  const amp = sphere.morphAmp + extraAmp;
  for (let i = 0; i < arr.length; i += 3) {
    const bx = sphere.basePositions[i];
    const by = sphere.basePositions[i + 1];
    const bz = sphere.basePositions[i + 2];
    const n = noise3D(
      bx * 0.35 + sphere.noiseSeed,
      by * 0.35,
      bz * 0.35 + time * 0.3
    );
    const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
    const scale = 1 + (n * amp) / len;
    arr[i] = bx * scale;
    arr[i + 1] = by * scale;
    arr[i + 2] = bz * scale;
  }
  pos.needsUpdate = true;
  sphere.geo.computeVertexNormals();
}

export function ThreeScene({ variant = 'hero', className = '', showQuote }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, ndcX: 0, ndcY: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isAuth = variant === 'auth';

    const getSize = () => ({
      width: Math.max(container.clientWidth, 1),
      height: Math.max(container.clientHeight, 1),
    });

    let { width, height } = getSize();
    const isMobile = width < 768;
    const segments = isMobile ? 64 : 128;
    const enableMorph = !isMobile && !isAuth;
    const particleCount = isAuth ? 300 : isMobile ? 500 : 1500;
    const enablePost = !isMobile && !isAuth;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 0.5, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    const disposables: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    let envMap: THREE.Texture | null = null;
    let pmremGenerator: THREE.PMREMGenerator | null = null;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const dirPurple = new THREE.DirectionalLight(0xa855f7, 3);
    dirPurple.position.set(5, 5, 5);
    scene.add(dirPurple);
    const dirBlue = new THREE.DirectionalLight(0x3b82f6, 2);
    dirBlue.position.set(-5, -3, 2);
    scene.add(dirBlue);
    const ptCyan = new THREE.PointLight(0x06b6d4, 5, 30);
    ptCyan.position.set(0, 3, -2);
    scene.add(ptCyan);
    const ptPink = new THREE.PointLight(0xec4899, 2, 30);
    ptPink.position.set(-3, 0, 3);
    scene.add(ptPink);

    const orbsGroup = new THREE.Group();
    scene.add(orbsGroup);

    const parallax = { x: 0, y: 0 };
    const mainGroup = new THREE.Group();
    mainGroup.position.set(-1.4, 0.1, 0);
    orbsGroup.add(mainGroup);

    let mainSphere: MorphSphere | null = null;
    const secondaryOrbs: {
      group: THREE.Group;
      sphere: MorphSphere;
      orbitR: number;
      orbitSpeed: number;
      phase: number;
      startOffset: THREE.Vector3;
    }[] = [];

    const wireGroup = new THREE.Group();
    scene.add(wireGroup);

    // Background wireframe icosahedrons
    if (!isAuth) {
      for (let i = 0; i < 5; i++) {
        const r = 3.2 + i * 0.35;
        const ico = new THREE.IcosahedronGeometry(r, 1);
        const wire = new THREE.WireframeGeometry(ico);
        disposables.push(ico, wire);
        const opacity = 0.04 + i * 0.01;
        const mat = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity,
        });
        materials.push(mat);
        const lines = new THREE.LineSegments(wire, mat);
        lines.position.set((i - 2) * 1.2, (i % 2) * 0.5 - 0.3, -4 - i * 0.5);
        lines.userData.rotSpeed = {
          x: 0.0004 + i * 0.0001,
          y: 0.0006 - i * 0.00005,
          z: 0.0003,
        };
        wireGroup.add(lines);
      }
    }

    const noise3D = createNoise3D();

    function buildOrbs() {
      if (isAuth) return;
      mainSphere = setupMorphSphere(2.2, segments, '#a855f7', enableMorph ? 0.14 : 0, envMap);
      mainGroup.add(mainSphere.mesh);

      const configs = [
        { color: '#3b82f6', radius: 0.55, orbitR: 2.8, speed: 0.35, phase: 0, pos: new THREE.Vector3(2.2, 1.4, 0.3) },
        { color: '#06b6d4', radius: 0.45, orbitR: 2.4, speed: -0.28, phase: 2.1, pos: new THREE.Vector3(1.2, -1.6, 0.5) },
        { color: '#8b5cf6', radius: 0.38, orbitR: 3.1, speed: 0.22, phase: 4.2, pos: new THREE.Vector3(-0.5, -1.2, 1) },
      ];

      configs.forEach((c) => {
        const group = new THREE.Group();
        group.position.copy(c.pos);
        orbsGroup.add(group);
        const sphere = setupMorphSphere(c.radius, Math.min(segments, 64), c.color, enableMorph ? 0.06 : 0, envMap);
        group.add(sphere.mesh);
        secondaryOrbs.push({
          group,
          sphere,
          orbitR: c.orbitR * 0.15,
          orbitSpeed: c.speed,
          phase: c.phase,
          startOffset: c.pos.clone(),
        });
      });
    }

    buildOrbs();

    // Particles
    const pPositions = new Float32Array(particleCount * 3);
    const pVelocities: THREE.Vector3[] = [];
    for (let i = 0; i < particleCount; i++) {
      pPositions[i * 3] = (Math.random() - 0.5) * 24;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
      pVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.004,
          (Math.random() - 0.5) * 0.003
        )
      );
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    disposables.push(particleGeo);
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: isMobile ? 0.025 : 0.018,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
    });
    materials.push(particleMat);
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // HDR environment
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      HDR_URL,
      (texture) => {
        envMap = pmremGenerator!.fromEquirectangular(texture).texture;
        texture.dispose();
        scene.environment = envMap;
        [mainSphere, ...secondaryOrbs.map((o) => o.sphere)].forEach((s) => {
          if (!s) return;
          const m = s.mesh.material as THREE.MeshPhysicalMaterial;
          m.envMap = envMap;
          m.needsUpdate = true;
        });
      },
      undefined,
      () => {
        /* HDR optional — iridescence still works with lights */
      }
    );

    // Burst particles pool
    const bursts: BurstParticle[] = [];

    function spawnBurst(point: THREE.Vector3) {
      const count = 12;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const velocities: THREE.Vector3[] = [];
      const lives: number[] = [];
      for (let i = 0; i < count; i++) {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
        const v = new THREE.Vector3(
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08,
          (Math.random() - 0.5) * 0.08
        );
        velocities.push(v);
        lives.push(1);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      disposables.push(geo);
      const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.04,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      materials.push(mat);
      const mesh = new THREE.Points(geo, mat);
      scene.add(mesh);
      bursts.push({ mesh, velocities, lives, maxLife: 0.5 });
    }

    // Post-processing
    let composer: EffectComposer | null = null;
    if (enablePost) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.8, 0.5, 0.85);
      composer.addPass(bloom);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveringMain = false;
    let hoverRipple = 0;
    let pulseScale = 1;
    let pulseT = 0;
    let rotBoost = 1;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      mouseRef.current.x = (relX - 0.5) * 2;
      mouseRef.current.y = (relY - 0.5) * 2;
      mouseRef.current.ndcX = relX * 2 - 1;
      mouseRef.current.ndcY = -(relY * 2 - 1);
      pointer.set(mouseRef.current.ndcX, mouseRef.current.ndcY);
    };
    window.addEventListener('mousemove', onMouseMove);

    const onScroll = () => {
      /* scroll read in animate */
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Load animation state
    const loadStart = performance.now();
    renderer.domElement.style.opacity = '0';
    renderer.domElement.style.transition = 'opacity 800ms ease';

    const clock = new THREE.Clock();
    let frameId = 0;
    let morphFrame = 0;
    let lastBurst = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const now = performance.now();
      const loadMs = now - loadStart;
      const loadFade = Math.min(1, loadMs / 800);

      // Load timeline
      const mainLoad = Math.min(1, Math.max(0, (loadMs - 200) / 700));
      const mainScale = springEase(mainLoad);
      const secLoad = Math.min(1, Math.max(0, (loadMs - 400) / 800));
      const particleOpacity = Math.min(0.4, Math.max(0, ((loadMs - 600) / 500) * 0.4));
      particleMat.opacity = particleOpacity;

      // Scroll
      const scrollY = window.scrollY;
      const scrollT = Math.min(1, scrollY / 600);
      const scrollScale = THREE.MathUtils.lerp(1, 0.3, scrollT);
      const scrollOpacity = 1 - scrollT;

      orbsGroup.position.x = THREE.MathUtils.lerp(-1.4, 2.5, scrollT);
      orbsGroup.position.y = THREE.MathUtils.lerp(0.1, 2.8, scrollT);
      orbsGroup.scale.setScalar(scrollScale * mainScale);
      orbsGroup.visible = scrollOpacity > 0.02;

      // Parallax (opposite to cursor)
      const targetPX = -mouseRef.current.x * 0.35;
      const targetPY = mouseRef.current.y * 0.35;
      parallax.x += (targetPX - parallax.x) * 0.05;
      parallax.y += (targetPY - parallax.y) * 0.05;
      mainGroup.position.x = -1.4 + parallax.x;
      mainGroup.position.y = 0.1 + parallax.y;

      // Raycast main sphere
      if (mainSphere && !isAuth) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(mainSphere.mesh);
        const wasHover = hoveringMain;
        hoveringMain = hits.length > 0;
        rotBoost = THREE.MathUtils.lerp(rotBoost, hoveringMain ? 3 : 1, 0.08);

        if (hoveringMain && !wasHover) {
          pulseT = 0.3;
          if (hits[0]) spawnBurst(hits[0].point.clone());
        }
        if (hoveringMain) {
          hoverRipple = THREE.MathUtils.lerp(hoverRipple, 0.06, 0.15);
          if (t - lastBurst > 0.35 && hits[0]) {
            spawnBurst(hits[0].point.clone());
            lastBurst = t;
          }
        } else {
          hoverRipple = THREE.MathUtils.lerp(hoverRipple, 0, 0.1);
        }

        if (pulseT > 0) {
          pulseT -= clock.getDelta();
          pulseScale = 1 + Math.sin((0.3 - pulseT) / 0.3 * Math.PI) * 0.05;
        } else {
          pulseScale = THREE.MathUtils.lerp(pulseScale, 1, 0.1);
        }
        mainSphere.mesh.scale.setScalar(pulseScale);
        mainSphere.mesh.rotation.y += 0.003 * rotBoost;
      }

      // Morph (every 2 frames)
      morphFrame++;
      if (enableMorph && morphFrame % 2 === 0) {
        if (mainSphere) applyMorph(mainSphere, t, noise3D, hoverRipple);
        secondaryOrbs.forEach((o) => applyMorph(o.sphere, t * 1.2, noise3D, 0));
      }
      if (mainSphere && !enableMorph) {
        mainSphere.mesh.rotation.y += 0.003 * rotBoost;
      }

      // Secondary orbits
      secondaryOrbs.forEach((o, i) => {
        const angle = t * o.orbitSpeed + o.phase;
        const base = o.startOffset;
        o.group.position.set(
          base.x + Math.cos(angle) * o.orbitR,
          base.y + Math.sin(angle * 0.7) * o.orbitR * 0.6,
          base.z + Math.sin(angle) * o.orbitR * 0.4
        );
        const drift = (1 - secLoad) * 4;
        o.group.position.x += Math.sign(base.x || 1) * drift;
        o.group.position.y += Math.sign(base.y || 1) * drift * 0.5;
        o.sphere.mesh.rotation.y += 0.002 * (i + 1);
      });

      // Wireframes
      wireGroup.children.forEach((child) => {
        const rs = child.userData.rotSpeed;
        if (rs) {
          child.rotation.x += rs.x;
          child.rotation.y += rs.y;
          child.rotation.z += rs.z;
        }
      });
      wireGroup.position.y = -scrollY * 0.0003;

      // Particles float
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3] += pVelocities[i].x;
        arr[i * 3 + 1] += pVelocities[i].y;
        arr[i * 3 + 2] += pVelocities[i].z;
        if (Math.abs(arr[i * 3]) > 12) pVelocities[i].x *= -1;
        if (Math.abs(arr[i * 3 + 1]) > 8) pVelocities[i].y *= -1;
        if (Math.abs(arr[i * 3 + 2]) > 6) pVelocities[i].z *= -1;
      }
      posAttr.needsUpdate = true;
      particles.rotation.y = t * 0.02;

      // Burst update
      for (let b = bursts.length - 1; b >= 0; b--) {
        const burst = bursts[b];
        const pos = burst.mesh.geometry.attributes.position as THREE.BufferAttribute;
        const pArr = pos.array as Float32Array;
        let alive = false;
        for (let i = 0; i < burst.lives.length; i++) {
          burst.lives[i] -= clock.getDelta() / burst.maxLife;
          if (burst.lives[i] > 0) {
            alive = true;
            pArr[i * 3] += burst.velocities[i].x;
            pArr[i * 3 + 1] += burst.velocities[i].y;
            pArr[i * 3 + 2] += burst.velocities[i].z;
          }
        }
        (burst.mesh.material as THREE.PointsMaterial).opacity = alive ? 0.85 : 0;
        pos.needsUpdate = true;
        if (!alive) {
          scene.remove(burst.mesh);
          burst.mesh.geometry.dispose();
          bursts.splice(b, 1);
        }
      }

      // Camera subtle drift
      camera.position.x = Math.sin(t * 0.1) * 0.15 + mouseRef.current.x * 0.2;
      camera.position.y = 0.5 + mouseRef.current.y * 0.15;
      camera.lookAt(0, 0, 0);

      if (composer && enablePost) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }

      renderer.domElement.style.opacity = String(scrollOpacity * loadFade);
    };
    animate();

    const updateSize = () => {
      const size = getSize();
      width = size.width;
      height = size.height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (composer) {
        composer.setSize(width, height);
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
      bursts.forEach((b) => scene.remove(b.mesh));
      disposables.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envMap?.dispose();
      pmremGenerator?.dispose();
      composer?.dispose();
      disposeObject(scene);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant]);

  const isHero = variant === 'hero';

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      aria-hidden
    >
      {isHero && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 40%, #1e1040 0%, #0f0728 40%, #06030f 100%)',
            }}
          />
          <div
            className="absolute inset-0 z-[1] pointer-events-none opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </>
      )}
      {showQuote && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-10">
          <p className="font-display text-3xl md:text-5xl font-bold text-center max-w-lg leading-tight text-[#a855f7]/25">
            {showQuote}
          </p>
        </div>
      )}
    </div>
  );
}
