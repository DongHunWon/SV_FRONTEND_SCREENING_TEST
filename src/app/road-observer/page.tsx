'use client';

import { Coordinate, Vehicle } from '@/types/road-observer.type';
import { useEffect, useState, useRef } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';

function degreeToRadian(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radianToDegree(radians: number): number {
  let degree = radians * (180 / Math.PI);
  degree %= 360;
  return degree < 0 ? degree + 360 : degree;
}

function getVehicleCoordinate({ position: { x, y }, width, length }: Vehicle): Coordinate[] {
  return [
    { x: x, y: y },
    { x: x + width, y: y },
    { x: x + width, y: y + length },
    { x: x, y: y + length },
  ];
}

function calcAngleOfCoordinate(x: number, y: number): number {
  return radianToDegree(Math.atan2(y, x));
}

const RoadObserverPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [degree, setDegree] = useState(50);
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
        const halfFov = (((observer.direction === 1 ? 360 - degree : degree) / 2) * Math.PI) / 180;
        const distance = 1000;

        const leftX = centerX - distance * Math.sin(halfFov);
        const leftY = centerY - distance * Math.cos(halfFov);
        const rightX = centerX + distance * Math.sin(halfFov);
        const rightY = centerY - distance * Math.cos(halfFov);

        // 시야각
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(leftX, leftY);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(rightX, rightY);
        ctx.strokeStyle = 'purple';
        ctx.stroke();
        ctx.closePath();

        // observer
        ctx.fillStyle = 'black';
        ctx.fillRect(observer.position.x, observer.position.y, observer.width, observer.length);

        // 다른 차량
        road.vehicles.forEach((vehicle, index) => {
          const {
            width,
            length,
            position: { x, y },
          } = vehicle;
          const coordinates = getVehicleCoordinate(vehicle);
          const coordinateDegrees = coordinates.map(({ x: dx, y: dy }) => calcAngleOfCoordinate(dx - centerX, dy - centerY));
          const minDegree = Math.min(...coordinateDegrees);
          const maxDegree = Math.max(...coordinateDegrees);

          const d = (180 - degree) / 2;
          let color = 'red';
          if (d <= minDegree && minDegree <= degree + d && d <= maxDegree && maxDegree <= degree + d) {
            color = 'green';
          } else if ((d <= minDegree && minDegree <= degree + d) || (d <= maxDegree && maxDegree <= degree + d)) {
            color = 'blue';
          }

          ctx.fillStyle = color;
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
          <input type="range" min="0" max="180" value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
          <span>{degree}</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={ROAD_WIDTH} height={ROAD_LENGTH} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default RoadObserverPage;
