"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface Particle {
    x: number;
    y: number;
    z: number;
    originX: number;
    originY: number;
    originZ: number;
    color: THREE.Color;
    vx: number;
    vy: number;
    vz: number;
}

interface ParticleLogoProps {
    imagePath?: string;
    particleSize?: number;
    threshold?: number;
    scale?: number;
    hoverRadius?: number;
    hoverForce?: number;
    returnSpeed?: number;
    invert?: boolean;
}

const ParticleLogoScene: React.FC<ParticleLogoProps> = ({
    imagePath = '/logo-particles.png',
    particleSize = 0.5,
    threshold = 10,
    scale = 0.3,
    hoverRadius = 0.1,
    hoverForce = 0.01,
    returnSpeed = 0.05,
    invert = false
}) => {
    const pointsRef = useRef<THREE.Points>(null);
    const [particles, setParticles] = useState<Particle[]>([]);
    const { raycaster, pointer, camera } = useThree();

    // Geometry attributes
    const positions = useMemo(() => new Float32Array(particles.length * 3), [particles]);
    const colors = useMemo(() => new Float32Array(particles.length * 3), [particles]);

    // Dummy plane for raycasting to get mouse world position at z=0
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const mousePos = useRef(new THREE.Vector3());

    useEffect(() => {
        const image = new Image();
        image.src = imagePath;
        image.crossOrigin = "Anonymous";

        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Reduce resolution for performance if needed, or keep original
            // To prevent too many particles, we might want to scale down the image analysis
            const maxWidth = 450; // Maximum density for solid look
            const aspectRatio = image.width / image.height;
            const width = Math.min(image.width, maxWidth);
            const height = width / aspectRatio;

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);

            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;
            const newParticles: Particle[] = [];

            // Center offsets
            const offsetX = width / 2;
            const offsetY = height / 2;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    // Check if pixel is visible enough
                    let shouldKeep = false;
                    if (invert) {
                        // Keep if darker than threshold (filter out white background)
                        if (r < threshold || g < threshold || b < threshold) {
                            shouldKeep = true;
                        }
                    } else {
                        // Keep if brighter than threshold (standard for black background)
                        if (r > threshold || g > threshold || b > threshold) {
                            shouldKeep = true;
                        }
                    }

                    if (a > 0 && shouldKeep) {
                        const posX = (x - offsetX) * scale;
                        const posY = -(y - offsetY) * scale; // Invert Y for 3D coords
                        const posZ = 0;

                        newParticles.push({
                            x: posX,
                            y: posY,
                            z: posZ,
                            originX: posX,
                            originY: posY,
                            originZ: posZ,
                            // Use original colors from the image
                            color: new THREE.Color(`rgb(${r},${g},${b})`),
                            vx: 0,
                            vy: 0,
                            vz: 0
                        });
                    }
                }
            }
            setParticles(newParticles);
        };
    }, [imagePath, threshold, scale]);

    // Update geometry when particles change
    useEffect(() => {
        if (!pointsRef.current) return;

        for (let i = 0; i < particles.length; i++) {
            positions[i * 3] = particles[i].x;
            positions[i * 3 + 1] = particles[i].y;
            positions[i * 3 + 2] = particles[i].z;

            colors[i * 3] = particles[i].color.r;
            colors[i * 3 + 1] = particles[i].color.g;
            colors[i * 3 + 2] = particles[i].color.b;
        }

        pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        pointsRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }, [particles, positions, colors]);

    useFrame(() => {
        if (!pointsRef.current || particles.length === 0) return;

        // Calculate mouse world position
        raycaster.setFromCamera(pointer, camera);
        raycaster.ray.intersectPlane(plane, mousePos.current);

        const currentPositions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        let needsUpdate = false;

        for (let i = 0; i < particles.length; i++) {
            const particle = particles[i];

            // Current pos
            let px = currentPositions[i * 3];
            let py = currentPositions[i * 3 + 1];
            let pz = currentPositions[i * 3 + 2];

            // Distance to mouse
            const dx = px - mousePos.current.x;
            const dy = py - mousePos.current.y;
            const distSq = dx * dx + dy * dy;

            // Interaction Force (Repulsion)
            if (distSq < hoverRadius * hoverRadius) {
                const dist = Math.sqrt(distSq);
                const force = (hoverRadius - dist) / hoverRadius;
                const angle = Math.atan2(dy, dx);

                particle.vx += Math.cos(angle) * force * hoverForce;
                particle.vy += Math.sin(angle) * force * hoverForce;

                // Add some Z randomness for 3D effect
                particle.vz += (Math.random() - 0.5) * force * hoverForce;
            }

            // Return Force (Spring back to origin)
            const ox = particle.originX;
            const oy = particle.originY;
            const oz = particle.originZ;

            particle.vx += (ox - px) * returnSpeed;
            particle.vy += (oy - py) * returnSpeed;
            particle.vz += (oz - pz) * returnSpeed;

            // Damping (Friction)
            particle.vx *= 0.9;
            particle.vy *= 0.9;
            particle.vz *= 0.9;

            // Update Position
            px += particle.vx;
            py += particle.vy;
            pz += particle.vz;

            // Update Buffer
            currentPositions[i * 3] = px;
            currentPositions[i * 3 + 1] = py;
            currentPositions[i * 3 + 2] = pz;

            // Optimization: Only mark update if creating significant movement
            // But for smooth continuous particles we update every frame
            needsUpdate = true;
        }

        if (needsUpdate) {
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry />
            <pointsMaterial
                size={particleSize}
                vertexColors
                transparent
                opacity={1.0}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.NormalBlending}
            />
        </points>
    );
};

export default function ParticleLogo(props: ParticleLogoProps) {
    return (
        <div className="w-full h-full min-h-[400px]">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
                <color attach="background" args={['#FFFFFF']} />
                <ParticleLogoScene {...props} />
            </Canvas>
        </div>
    );
}
