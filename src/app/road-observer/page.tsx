'use client';

import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';
import { useRef } from 'react';

const RoadObserverPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} width={ROAD_WIDTH} height={ROAD_LENGTH} />
    </div>
  );
};

export default RoadObserverPage;
