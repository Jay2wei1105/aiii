"use client";

import React from 'react';
import Navbar from '@/components/nav_delta';
import ParticleLogo from '@/components/ParticleLogo';

export default function ParticleDemoPage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            <div className="flex-grow flex flex-col items-center justify-center pt-20">
                <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    3D Particle Logo Interaction
                </h1>

                <div className="w-full max-w-4xl h-[600px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20 bg-zinc-900/50 backdrop-blur-sm">
                    <ParticleLogo
                        imagePath="/logo-particles.png"
                        scale={0.03}
                        particleSize={0.05}
                        threshold={20}
                        hoverRadius={3}
                        hoverForce={0.5}
                    />
                </div>

                <p className="mt-6 text-zinc-500 text-sm">
                    Move your mouse over the particles to interact. Scroll to rotate.
                </p>
            </div>
        </div>
    );
}
