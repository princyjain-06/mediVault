import React from 'react';

/**
 * Abstract glossy blue swirl built entirely with SVG gradients + CSS animation.
 * Respects prefers-reduced-motion.
 */
export const BlobVisual: React.FC = () => (
  <div className="relative flex h-full w-full items-center justify-center select-none overflow-hidden">
    {/* Outer soft glow ring */}
    <div
      className="absolute h-72 w-72 rounded-full md:h-80 md:w-80"
      style={{
        background: 'radial-gradient(circle, rgba(147,210,235,0.35) 0%, rgba(201,223,233,0) 70%)',
        animation: 'blobFloat 6s ease-in-out infinite',
      }}
    />

    {/* Main SVG swirl */}
    <svg
      viewBox="0 0 400 400"
      className="h-64 w-64 md:h-72 md:w-72 drop-shadow-xl"
      style={{ animation: 'blobSpin 18s linear infinite' }}
      aria-hidden="true"
    >
      <defs>
        {/* Glossy blue base */}
        <radialGradient id="baseGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#e8f6fc" />
          <stop offset="40%"  stopColor="#93d2eb" />
          <stop offset="80%"  stopColor="#4bacd4" />
          <stop offset="100%" stopColor="#2e86b0" />
        </radialGradient>

        {/* Swirl highlight overlay */}
        <radialGradient id="highlightGrad" cx="30%" cy="25%" r="50%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.65" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        {/* Inner shadow */}
        <radialGradient id="shadowGrad" cx="65%" cy="70%" r="55%">
          <stop offset="0%"   stopColor="#1a6a90" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1a6a90" stopOpacity="0" />
        </radialGradient>

        <clipPath id="circleClip">
          <circle cx="200" cy="200" r="175" />
        </clipPath>

        <filter id="blur4">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Base sphere */}
      <circle cx="200" cy="200" r="175" fill="url(#baseGrad)" />

      {/* Swirl ribbons — clipped to sphere */}
      <g clipPath="url(#circleClip)">
        {/* Ribbon 1 */}
        <path
          d="M 60 310 Q 120 100 260 90 Q 350 80 370 200 Q 390 320 260 350 Q 130 380 60 310 Z"
          fill="none"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="22"
          strokeLinecap="round"
          filter="url(#blur4)"
        />
        {/* Ribbon 2 */}
        <path
          d="M 80 280 Q 150 80 290 100 Q 370 115 355 230 Q 340 345 210 365 Q 80 385 80 280 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="url(#blur4)"
        />
        {/* Ribbon 3 — tighter inner curve */}
        <path
          d="M 110 250 Q 160 130 270 140 Q 340 150 330 240 Q 318 330 220 345 Q 110 360 110 250 Z"
          fill="none"
          stroke="rgba(200,240,255,0.5)"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#blur4)"
        />
        {/* Core twist */}
        <path
          d="M 150 220 Q 180 160 240 165 Q 290 170 285 220 Q 280 275 230 285 Q 155 295 150 220 Z"
          fill="rgba(255,255,255,0.18)"
          filter="url(#blur4)"
        />
      </g>

      {/* Highlight shimmer */}
      <circle cx="200" cy="200" r="175" fill="url(#highlightGrad)" />

      {/* Inner shadow depth */}
      <circle cx="200" cy="200" r="175" fill="url(#shadowGrad)" />
    </svg>

    {/* Subtle reflection below */}
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 h-5 w-40 rounded-full"
      style={{
        background: 'radial-gradient(ellipse, rgba(74,172,212,0.25) 0%, transparent 70%)',
        filter: 'blur(6px)',
      }}
    />

    <style>{`
      @keyframes blobSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes blobFloat {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-12px); }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
      }
    `}</style>
  </div>
);
