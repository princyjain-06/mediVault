import React, { useRef, useState, useEffect } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { HowItWorks } from './HowItWorks';
import { PrivacySection } from './PrivacySection';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);
  const [footerHeight, setFooterHeight] = useState<number>(0);
  const [isRevealActive, setIsRevealActive] = useState<boolean>(true);

  useEffect(() => {
    const updateFooterMetrics = () => {
      if (!footerRef.current) return;
      const height = footerRef.current.offsetHeight;
      setFooterHeight(height);

      // Disable curtain reveal fallback conditions:
      // 1. Mobile screen (< 768px) where fixed position footers can glitch with mobile browsers
      // 2. User has prefers-reduced-motion turned on
      // 3. Footer height is unusually tall (> 75% of viewport)
      const isMobile = window.innerWidth < 768;
      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isTallerThanScreen = height > window.innerHeight * 0.75;

      setIsRevealActive(!isMobile && !isReducedMotion && !isTallerThanScreen);
    };

    updateFooterMetrics();

    const resizeObserver = new ResizeObserver(() => {
      updateFooterMetrics();
    });

    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }
    window.addEventListener('resize', updateFooterMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFooterMetrics);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full font-sans overflow-x-clip"
      style={{ backgroundColor: '#C9DFE9' }}
    >
      {/* Top spacing & container for the main white sheet */}
      <div className="p-4 sm:p-6 md:p-10 pb-0">
        {/* 
          Main White Card:
          Sits on top (z-10), with rounded bottom corners (32px), shadow-2xl.
          Bottom margin dynamically set to the footer height for the curtain reveal.
        */}
        <main
          style={{
            marginBottom: isRevealActive ? `${footerHeight}px` : undefined,
          }}
          className="relative z-10 w-full max-w-6xl mx-auto bg-white rounded-[32px] shadow-2xl p-6 sm:p-10 md:p-12 transition-[margin] duration-150"
        >
          <LandingNavbar />
          <HeroSection />
          <HowItWorks />
          <PrivacySection />
        </main>
      </div>

      {/* 
        Footer (Curtain Reveal):
        Sits fixed behind the content (z-0) on desktop.
        Falls back to normal flow (relative z-10) on mobile / reduced-motion.
      */}
      <LandingFooter
        ref={footerRef}
        className={
          isRevealActive
            ? "fixed bottom-0 left-0 right-0 z-0 pointer-events-auto"
            : "relative z-10"
        }
      />
    </div>
  );
};
