'use client';

import { useEffect, useState, useRef } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';

const RoadObserverPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [degree, setDegree] = useState(178);
  const { road } = useRoadStream(isPaused);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && road) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const observer = road.observer;
        const centerX = observer.position.x + Math.floor(observer.width / 2);
        const centerY = observer.direction === 1 ? observer.position.y + observer.length : observer.position.y;
        const fovAngle = (((observer.direction === 1 ? 360 - degree : degree) / 2) * Math.PI) / 180;
        const fovDistance = 1000;

        const leftX = centerX - fovDistance * Math.sin(fovAngle);
        const leftY = centerY - fovDistance * Math.cos(fovAngle);
        const rightX = centerX + fovDistance * Math.sin(fovAngle);
        const rightY = centerY - fovDistance * Math.cos(fovAngle);

        // 시야각
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(leftX, leftY);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(rightX, rightY);
        ctx.strokeStyle = 'red';
        ctx.stroke();
        ctx.closePath();

        // observer
        ctx.fillStyle = 'black';
        ctx.fillRect(observer.position.x, observer.position.y, observer.width, observer.length);

        // 다른 차량
        road.vehicles.forEach(({ width, length, position: { x, y } }) => {
          ctx.fillStyle = 'green';
          ctx.fillRect(x, y, width, length);
        });
      }
    }
  }, [road]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: '20px', left: '20px', width: '50px', height: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handlePause}>{isPaused ? '실행' : '정지'}</button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input type="range" min="0" max="360" value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
          <span>{degree}</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={ROAD_WIDTH} height={ROAD_LENGTH} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default RoadObserverPage;
