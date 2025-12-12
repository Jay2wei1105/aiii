"use client";

import React from "react";
import Navbar from "@/components/nav_delta";
import Footer from "@/components/footer_delta";
import ParticleLogo from "@/components/ParticleLogo";

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-white">
      {/* Fullscreen Particle Logo - Behind everything */}
      <div className="absolute inset-0 z-0">
        <ParticleLogo
          imagePath="/logo-particles.png"
          particleSize={0.005}
          threshold={240}
          scale={0.012}
          hoverRadius={0.4}
          hoverForce={0.02}
          returnSpeed={0.15}
          invert={true}
        />
      </div>

      {/* Navbar - On top */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Title Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20 pointer-events-none mt-8">
        <h1 className="text-5xl md:text-7xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        </h1>
        <p className="text-sm md:text-base text-gray-600">
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <Footer />
      </div>
    </div>
  );
}