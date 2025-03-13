'use client';

import { Coordinate, Vehicle } from '@/types/road-observer.type';
import { useEffect, useState, useRef } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';

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
  const [degree, setDegree] = useState(178);
  const { road } = useRoadStream(isPaused);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && road) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const observer = road.observer;
        const centerX = observer.position.x + observer.width / 2;
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

        const blindSpotDegree = degree <= 180 ? (180 - degree) / 2 : (360 - degree) / 2; // 사각지대 각도
        const leftFovDegree = degree <= 180 ? degree + blindSpotDegree : degree - (90 - blindSpotDegree); // 도로 기준 왼쪽 시야각
        const rightFovDegree = degree <= 180 ? blindSpotDegree : 360 - (90 - blindSpotDegree); // 도로 기준 오른쪽 시야각

        // 다른 차량
        road.vehicles.forEach((vehicle) => {
          const {
            width,
            length,
            position: { x, y },
          } = vehicle;
          const coordinates = getVehicleCoordinate(vehicle);
          const coordinateDegrees = coordinates.map(({ x: dx, y: dy }) => calcAngleOfCoordinate(dx - centerX, dy - centerY));
          const minDegree = Math.min(...coordinateDegrees);
          const maxDegree = Math.max(...coordinateDegrees);

          //  3 | 4
          // ---c---
          //  2 | 1
          let color = 'red';
          if (maxDegree <= 270) {
            if (minDegree < 90) {
              if ((rightFovDegree < minDegree && maxDegree < leftFovDegree) || 270 <= rightFovDegree) {
                color = 'green';
              } else if (maxDegree <= 90) {
                // 1 구역
                if (minDegree <= rightFovDegree && rightFovDegree <= maxDegree) {
                  const ratio = (maxDegree - rightFovDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                }
              } else {
                // 1, 2 구역
                if (minDegree <= rightFovDegree) {
                  if (maxDegree <= leftFovDegree) {
                    const ratio = (maxDegree - rightFovDegree) / (maxDegree - minDegree);
                    color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                  } else {
                    const ratio = (leftFovDegree - rightFovDegree) / (maxDegree - minDegree);
                    color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                  }
                } else if (leftFovDegree <= maxDegree) {
                  const ratio = (leftFovDegree - minDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                }
              }
            } else {
              // 2, 3 구역
              if (maxDegree < leftFovDegree) {
                color = 'green';
              } else if (minDegree <= leftFovDegree && leftFovDegree <= maxDegree) {
                const ratio = (leftFovDegree - minDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              }
            }
          } else {
            // 한 점이 4구역을 포함하는 경우
            if (leftFovDegree === 270) {
              color = 'green';
            } else {
              if (180 < minDegree && minDegree < 270) {
                // 3, 4 구역
                if (minDegree <= leftFovDegree && rightFovDegree <= maxDegree) {
                  const ratio = (leftFovDegree - minDegree + maxDegree - rightFovDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                } else if (minDegree <= leftFovDegree) {
                  const ratio = (leftFovDegree - minDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                } else if (270 < rightFovDegree && rightFovDegree <= maxDegree) {
                  const ratio = (maxDegree - rightFovDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                }
              } else {
                // 4 구역
                if (270 <= minDegree) {
                  if (270 < rightFovDegree && rightFovDegree < minDegree) {
                    color = 'green';
                  } else if (minDegree <= rightFovDegree && rightFovDegree <= maxDegree) {
                    const ratio = (maxDegree - rightFovDegree) / (maxDegree - minDegree);
                    color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                  }
                } else {
                  if (90 < minDegree) {
                    const ratio = degree / 360;
                    color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                  } else {
                    const newMinDegree = Math.max(...coordinateDegrees.filter((d) => d <= 90));
                    const newMaxDegree = Math.min(...coordinateDegrees.filter((d) => 270 <= d));
                    if (270 <= rightFovDegree) {
                      if (rightFovDegree < newMaxDegree) {
                        color = 'green';
                      } else if (newMaxDegree <= rightFovDegree) {
                        const ratio = (360 - rightFovDegree + newMinDegree) / (360 - newMaxDegree + newMinDegree);
                        color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                      }
                    } else {
                      if (rightFovDegree <= newMinDegree) {
                        const ratio = (newMinDegree - rightFovDegree) / (360 - newMaxDegree + newMinDegree);
                        color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                      }
                    }
                  }
                }
              }
            }
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
          <input type="range" min="0" max="360" value={degree} onChange={(e) => setDegree(Number(e.target.value))} />
          <span>{degree}</span>
        </div>
      </div>
      <canvas ref={canvasRef} width={ROAD_WIDTH} height={ROAD_LENGTH} style={{ border: '1px solid black' }} />
    </div>
  );
};

export default RoadObserverPage;
