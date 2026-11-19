import React, { useEffect, useState } from 'react';

const WORDS = ['Organized.', 'Tracked.', 'Understood.'];
const INTERVAL_MS = 2500;

export const AnimatedWord: React.FC = () => {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 350); // duration of fade-out
    }, INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className="text-teal-600 inline-block transition-all duration-300"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {WORDS[index]}
    </span>
  );
};
