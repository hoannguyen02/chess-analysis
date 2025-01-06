import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const ConfettiEffect: React.FC = () => {
  useEffect(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };

    function fire(particleRatio: number, opts: Record<string, any>) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    // Trigger multiple bursts of confetti
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    return () => {
      confetti.reset(); // Reset confetti on unmount
    };
  }, []);

  return null; // No UI element is rendered
};

export default ConfettiEffect;
