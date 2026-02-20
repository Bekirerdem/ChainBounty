import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import dynamic from "next/dynamic";
import NetworkParticles from "./3d/NetworkParticles";

const Scene = dynamic(() => import("./3d/Scene"), { ssr: false });

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);
  const badgeRef    = useRef<HTMLDivElement>(null);
  const line1Ref    = useRef<HTMLSpanElement>(null);
  const line2Ref    = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef  = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // 1. Badge drops in from above
    tl.fromTo(badgeRef.current,
      { y: -16, opacity: 0 },
      { y: 0,   opacity: 1, duration: 0.9 },
      0.4
    );

    // 2. Headline lines rise up — each on its own ref, no class collision
    tl.fromTo([line1Ref.current, line2Ref.current],
      { y: 56, opacity: 0 },
      { y: 0,  opacity: 1, duration: 1.1, stagger: 0.18 },
      "-=0.5"
    );

    // 3. Subtitle fades in after headline settles
    tl.fromTo(subtitleRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.9 },
      "-=0.4"
    );

    // 4. Buttons pop up last
    tl.fromTo(buttonsRef.current,
      { scale: 0.94, opacity: 0 },
      { scale: 1,    opacity: 1, duration: 0.7, ease: "back.out(1.5)" },
      "-=0.5"
    );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
    >
      {/* 3D Particle Background */}
      <Scene>
        <NetworkParticles />
      </Scene>

      {/* Readability gradient — bottom fade to page bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/40 to-[#0a0a0a] pointer-events-none z-0" />

      {/* ── CONTENT ── */}
      <div className="container mx-auto px-6 z-10 flex flex-col items-center text-center relative">

        {/* Badge */}
        <div ref={badgeRef} style={{ marginBottom: "2rem", opacity: 0 }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 14px",
              border: "1px solid rgba(232,65,66,0.35)",
              background: "rgba(232,65,66,0.07)",
              backdropFilter: "blur(12px)",
              fontFamily: "var(--font-heading)",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#E84142",
              boxShadow: "0 0 20px rgba(232,65,66,0.18)",
            }}
          >
            ● Built on Avalanche ICM
          </span>
        </div>

        {/* Headline — two lines, each individually animated */}
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(3.2rem, 9vw, 6.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.02,
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <span ref={line1Ref} style={{ display: "block", color: "#f5f5f5" }}>
              Cross-Chain
            </span>
          </div>
          <div style={{ overflow: "hidden" }}>
            <span ref={line2Ref} style={{ display: "block", color: "#E84142" }}>
              Bounty Platform
            </span>
          </div>
        </h1>

        {/* Subtitle — one clean paragraph, no forced <br> */}
        <p
          ref={subtitleRef}
          style={{
            fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
            color: "#888",
            maxWidth: "520px",
            lineHeight: 1.7,
            fontWeight: 400,
            marginBottom: "3rem",
            opacity: 0,
          }}
        >
          Escrow on C-Chain. Submissions on App-Chain.
          <br />
          Payments settled trustlessly via Avalanche ICM.
        </p>

        {/* CTA Buttons */}
        <div
          ref={buttonsRef}
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            opacity: 0,
          }}
        >
          <Link href="/bounties" className="btn-avax" style={{ textDecoration: "none" }}>
            Explore Bounties
          </Link>
          <Link
            href="/create"
            className="btn-ghost"
            style={{
              textDecoration: "none",
              backdropFilter: "blur(8px)",
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            Post a Bounty
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute animate-bounce"
        style={{
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          opacity: 0.4,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#888",
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: "1px",
            height: "40px",
            background: "linear-gradient(to bottom, #E84142, transparent)",
          }}
        />
      </div>
    </section>
  );
}
