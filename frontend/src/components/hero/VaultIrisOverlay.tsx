"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";

const PETAL_COUNT = 6;

export default function VaultIrisOverlay() {
  const { progress } = useScrollProgress();

  // Texto HERITA: começa desfocado/brilhante e vai ganhando definição
  // No final (scroll 100%) está totalmente nítido e visível
  const textOpacity = progress < 0.3
    ? 0.4 + (progress / 0.3) * 0.6  // 0.4 -> 1.0
    : 1;

  const textBlur = progress < 0.5
    ? 6 - (progress / 0.5) * 6  // 6px -> 0px
    : 0;

  const glowIntensity = progress < 0.4
    ? 1 - (progress / 0.4)  // 1.0 -> 0.0
    : 0;

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none overflow-hidden"
    >
      {/* Dark overlay que clareia conforme abre */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(8, 12, 20, ${0.85 * (1 - progress)})`,
          transition: "none",
        }}
      />

      {/* Grid sutil - sempre visível */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage: `
            linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "120px 120px",
        }}
      />

      {/* Anel central que expande - alinhado com HERITA */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full border border-accent-primary/30"
        style={{
          top: "32%",
          width: `${120 + progress * 400}px`,
          height: `${120 + progress * 400}px`,
          opacity: 0.3 + (progress * 0.3),
          transition: "none",
          boxShadow: `0 0 ${20 + progress * 40}px rgba(212,175,55,${0.1 + progress * 0.2})`,
        }}
      />

      {/* Pétalas da iris */}
      {Array.from({ length: PETAL_COUNT }).map((_, i) => {
        const angle = (360 / PETAL_COUNT) * i;
        const openDistance = 30 + (progress * 200); // 30px -> 230px
        const scale = 1 + progress * 0.8; // 1.0 -> 1.8 (aumenta conforme abre)
        const petalOpacity = progress < 0.8 ? 1 - (progress * 0.6) : 0.4;

        return (
          <div
            key={i}
            className="absolute left-1/2"
            style={{
              top: "32%",
              width: "240px",
              height: "400px",
              opacity: petalOpacity,
              transform: `
                translate(-50%, -50%)
                rotate(${angle}deg)
                translateY(${-openDistance}px)
                scale(${scale})
              `,
              transformOrigin: "center bottom",
              transition: "none",
            }}
          >
            {/* Forma da pétala */}
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(180deg, 
                  rgba(8,12,20,${0.98 - progress * 0.4}) 0%, 
                  rgba(15,22,35,${0.95 - progress * 0.3}) 60%, 
                  rgba(212,175,55,${0.15 + progress * 0.15}) 100%
                )`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                borderTop: `2px solid rgba(212,175,55,${0.3 + progress * 0.4})`,
                boxShadow: `0 -10px ${30 + progress * 30}px rgba(212,175,55,${0.1 + progress * 0.15})`,
              }}
            />
          </div>
        );
      })}

      {/* Texto HERITA - posicionado mais acima */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{
          top: "32%",
          opacity: textOpacity,
          filter: `blur(${textBlur}px)`,
          transition: "none",
        }}
      >
        <h1
          className="font-playfair font-bold text-accent-primary tracking-[0.3em] uppercase"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 6rem)",
            textShadow: progress > 0.7
              ? `
                0 0 30px rgba(212,175,55,0.6),
                0 0 60px rgba(212,175,55,0.4),
                0 0 90px rgba(212,175,55,0.2)
              `
              : `
                0 0 ${20 + glowIntensity * 50}px rgba(212,175,55,${0.4 + glowIntensity * 0.5}),
                0 0 ${40 + glowIntensity * 80}px rgba(212,175,55,${0.2 + glowIntensity * 0.4})
              `,
          }}
        >
          HERITA
        </h1>
        <p
          className="mt-4 text-text-secondary text-sm tracking-[0.2em] uppercase font-sans"
          style={{
            opacity: textOpacity * 0.8,
            filter: `blur(${textBlur * 0.5}px)`,
          }}
        >
          Digital Legacy Protocol
        </p>
      </div>

      {/* Partículas douradas sutilíssimas - valores determinísticos */}
      {Array.from({ length: 12 }).map((_, i) => {
        // Valores seedeados pelo índice para evitar hydration mismatch
        const seed = (n: number) => ((i * 9301 + 49297) % 233280) / 233280 * n;
        return (
          <div
            key={`particle-${i}`}
            className="absolute rounded-full bg-accent-primary"
            style={{
              width: `${2 + seed(3)}px`,
              height: `${2 + seed(3)}px`,
              left: `${10 + (i * 7.5)}%`,
              top: `${20 + (i % 4) * 20}%`,
              opacity: 0.3 * (1 - progress) * (0.3 + seed(0.7)),
              filter: `blur(1px)`,
              animation: `float-particle ${8 + seed(8)}s ease-in-out infinite`,
              animationDelay: `${seed(5)}s`,
            }}
          />
        );
      })}
    </div>
  );
}
