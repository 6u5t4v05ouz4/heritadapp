"use client";

import { useEffect, useState } from "react";

export default function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      {/* Base dark layer */}
      <div className="absolute inset-0" style={{ backgroundColor: "#080C14" }} />

      {/* Animated mesh gradients - MUCH more visible */}
      <div
        className="absolute inset-0"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 1s ease-out",
        }}
      >
        {/* Primary gold glow - top right */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-15%",
            right: "-10%",
            width: "65%",
            height: "65%",
            background: "radial-gradient(circle, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.08) 40%, transparent 70%)",
            filter: "blur(40px)",
            animation: "mesh-slow 20s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* Secondary blue glow - bottom left */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: "-15%",
            left: "-10%",
            width: "60%",
            height: "60%",
            background: "radial-gradient(circle, rgba(30,41,59,0.8) 0%, rgba(15,22,35,0.4) 50%, transparent 70%)",
            filter: "blur(50px)",
            animation: "mesh-slow-reverse 25s ease-in-out infinite",
            willChange: "transform",
          }}
        />
        {/* Center glow - gold */}
        <div
          className="absolute rounded-full"
          style={{
            top: "25%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "45%",
            height: "45%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)",
            filter: "blur(50px)",
            animation: "mesh-pulse 15s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />
        {/* Accent spot - top center */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-5%",
            left: "30%",
            width: "40%",
            height: "30%",
            background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "mesh-pulse 18s ease-in-out infinite reverse",
            willChange: "transform, opacity",
          }}
        />
      </div>

      {/* Grid pattern - more visible */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Subtle noise texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Radial vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(8,12,20,0.7) 100%)",
        }}
      />

      {/* Top fade for navbar continuity */}
      <div
        className="absolute top-0 inset-x-0 h-32"
        style={{
          background: "linear-gradient(to bottom, rgba(8,12,20,0.95) 0%, transparent 100%)",
        }}
      />

      {/* Bottom fade into next section */}
      <div
        className="absolute bottom-0 inset-x-0 h-48"
        style={{
          background: "linear-gradient(to top, #080C14 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
