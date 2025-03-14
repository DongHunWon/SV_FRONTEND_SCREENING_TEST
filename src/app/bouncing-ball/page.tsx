'use client';

import { useEffect, useRef, useState } from 'react';

interface Ball {
  y: number;
  vy: number;
  radius: number;
}

const INIT_GRAVITY_ACCELERATION = 9.81;
const INIT_BALL = { y: 0, vy: 0, radius: 15 };
const FLOOR_HEIGHT = 700;
const THRESHOLD = 300;

const BouncingBallPage = () => {
  const ballRef = useRef<HTMLDivElement>(null);
  const [ball, setBall] = useState<Ball>(INIT_BALL);
  const [isMoved, setIsMoved] = useState<boolean>(false);
  const [gravityAcceleration, setGravityAcceleration] = useState<number>(INIT_GRAVITY_ACCELERATION);
  const [height, setHeight] = useState<number>(FLOOR_HEIGHT);

  useEffect(() => {
    setTimeout(() => {
      const { y, vy } = ball;

      if (y >= FLOOR_HEIGHT) {
        setIsMoved(false);
        return;
      }

      if (isMoved) {
        const newVy = vy + gravityAcceleration;
        const newY = y + newVy > FLOOR_HEIGHT ? FLOOR_HEIGHT : y + newVy;

        movedBall({ ...ball, y: newY, vy: newVy });
      }
    }, 17);
  }, [ball, isMoved]);

  useEffect(() => {
    let count = 0;
    let lastPressTime = 0;
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;

    movedBall({ ...ball, y: FLOOR_HEIGHT - height });

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
            movedBall({ ...INIT_BALL, y: FLOOR_HEIGHT - height });
          }
        }, THRESHOLD);
      }
    };

    window.addEventListener('keypress', handleKeyDown);
    return () => window.removeEventListener('keypress', handleKeyDown);
  }, [height]);

  const movedBall = (ball: Ball) => {
    const ballEl = ballRef.current;
    if (ballEl) {
      ballEl.style.transform = `translateY(${ball.y}px)`;
      setBall({ ...ball });
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '50px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>제약 조건 : 공기 저항 x</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>중력 가속도 : {gravityAcceleration}</span>
          <input type="range" min="0.1" max="50" value={gravityAcceleration} onChange={(e) => setGravityAcceleration(Number(e.target.value))} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>높이 : {height}</span>
          <input type="range" min="0" max={FLOOR_HEIGHT} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
        </div>
      </div>
      <div
        ref={ballRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: `${FLOOR_HEIGHT - height}}px`,
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
