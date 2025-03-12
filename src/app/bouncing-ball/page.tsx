'use client';

import { useEffect, useRef, useState } from 'react';

interface Ball {
  y: number;
  vy: number;
  ay: number;
  radius: number;
}

const INIT_BALL = { y: 0, vy: 0, ay: 0.5, radius: 15 };
const FLOOR_HEIGHT = 700;
const THRESHOLD = 300;

const BouncingBallPage = () => {
  const ballRef = useRef<HTMLDivElement>(null);
  const [ball, setBall] = useState<Ball>(INIT_BALL);
  const [isMoved, setIsMoved] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      const { y, vy, ay } = ball;

      if (y >= FLOOR_HEIGHT) {
        setIsMoved(false);
        return;
      }

      if (isMoved) {
        const newVy = vy + ay;
        const newY = y + newVy > FLOOR_HEIGHT ? FLOOR_HEIGHT : y + newVy;

        movedBall({ ...ball, y: newY, vy: newVy });
      }
    }, 17);
  }, [ball, isMoved]);

  useEffect(() => {
    let count = 0;
    let lastPressTime = 0;
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();

        const now = Date.now();
        if (now - lastPressTime > THRESHOLD) {
          count = 1;
        } else {
          count += 1;
        }
        lastPressTime = now;

        clearTimeout(timer);
        timer = setTimeout(() => {
          if (count === 2) {
            setIsMoved(true);
          } else if (count === 3) {
            movedBall(INIT_BALL);
          }
        }, THRESHOLD);
      }
    };

    window.addEventListener('keypress', handleKeyDown);
    return () => window.removeEventListener('keypress', handleKeyDown);
  }, []);

  const movedBall = (ball: Ball) => {
    const ballEl = ballRef.current;
    if (ballEl) {
      ballEl.style.transform = `translateY(${ball.y}px)`;
      setBall({ ...ball });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={ballRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: `${INIT_BALL.y}px`,
          width: `${ball.radius * 2}px`,
          height: `${ball.radius * 2}px`,
          backgroundColor: 'red',
          borderRadius: '50%',
        }}
      ></div>
      <div
        style={{
          position: 'absolute',
          top: `${FLOOR_HEIGHT + ball.radius * 2}px`,
          width: '100%',
          borderTop: '1px solid black',
        }}
      ></div>
    </div>
  );
};

export default BouncingBallPage;
