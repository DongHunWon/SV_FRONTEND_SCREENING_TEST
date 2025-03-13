'use client';

import { Coordinate, Vehicle } from '@/types/road-observer.type';
import { useEffect, useState } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { RectConfig } from 'konva/lib/shapes/Rect';
import { LineConfig } from 'konva/lib/shapes/Line';

type Shape = RectConfig | LineConfig;

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
  const [isPaused, setIsPaused] = useState(false);
  const [degree, setDegree] = useState(178);
  const { road } = useRoadStream(isPaused);
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    if (road) {
      const observer = road.observer;
      const centerX = observer.position.x + observer.width / 2;
      const centerY = observer.direction === 1 ? observer.position.y + observer.length : observer.position.y;
      const halfFOV = (((observer.direction === 1 ? 360 - degree : degree) / 2) * Math.PI) / 180;
      const distance = 1000;

      const leftX = centerX - distance * Math.sin(halfFOV);
      const leftY = centerY - distance * Math.cos(halfFOV);
      const rightX = centerX + distance * Math.sin(halfFOV);
      const rightY = centerY - distance * Math.cos(halfFOV);

      const rightFOVDegree = radianToDegree(Math.atan2(rightY - centerY, rightX - centerX));
      const leftFOVDegree = radianToDegree(Math.atan2(leftY - centerY, leftX - centerX));

      const newShapes = [
        {
          type: 'line',
          points: [centerX, centerY, leftX, leftY],
          stroke: 'purple',
        },
        {
          type: 'line',
          points: [centerX, centerY, rightX, rightY],
          stroke: 'purple',
        },
        {
          type: 'rect',
          x: observer.position.x,
          y: observer.position.y,
          width: observer.width,
          height: observer.length,
          fill: 'black',
        },
      ];

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

        let color = 'red';
        if (maxDegree <= 270) {
          if (minDegree < 90) {
            if ((rightFOVDegree < minDegree && maxDegree < leftFOVDegree) || 270 <= rightFOVDegree) {
              color = 'green';
            } else if (maxDegree <= 90) {
              if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                const ratio = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              }
            } else {
              if (minDegree <= rightFOVDegree) {
                if (maxDegree <= leftFOVDegree) {
                  const ratio = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                } else {
                  const ratio = (leftFOVDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                }
              } else if (leftFOVDegree <= maxDegree) {
                const ratio = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              }
            }
          } else {
            if (maxDegree < leftFOVDegree) {
              color = 'green';
            } else if (minDegree <= leftFOVDegree && leftFOVDegree <= maxDegree) {
              const ratio = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
              color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
            }
          }
        } else {
          if (leftFOVDegree === 270) {
            color = 'green';
          } else {
            if (180 < minDegree && minDegree < 270) {
              if (minDegree <= leftFOVDegree && rightFOVDegree <= maxDegree) {
                const ratio = (leftFOVDegree - minDegree + maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              } else if (minDegree <= leftFOVDegree) {
                const ratio = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              } else if (270 < rightFOVDegree && rightFOVDegree <= maxDegree) {
                const ratio = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
              }
            } else {
              if (270 <= minDegree) {
                if (270 < rightFOVDegree && rightFOVDegree < minDegree) {
                  color = 'green';
                } else if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                  const ratio = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                }
              } else {
                if (90 < minDegree) {
                  const ratio = degree / 360;
                  color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                } else {
                  const newMinDegree = Math.max(...coordinateDegrees.filter((d) => d <= 90));
                  const newMaxDegree = Math.min(...coordinateDegrees.filter((d) => 270 <= d));
                  if (270 <= rightFOVDegree) {
                    if (rightFOVDegree < newMaxDegree) {
                      color = 'green';
                    } else if (newMaxDegree <= rightFOVDegree) {
                      const ratio = (360 - rightFOVDegree + newMinDegree) / (360 - newMaxDegree + newMinDegree);
                      color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                    }
                  } else {
                    if (rightFOVDegree <= newMinDegree) {
                      const ratio = (newMinDegree - rightFOVDegree) / (360 - newMaxDegree + newMinDegree);
                      color = `rgba(0, 0, 255, ${ratio < 0.1 ? 0.1 : ratio})`;
                    }
                  }
                }
              }
            }
          }
        }

        newShapes.push({
          type: 'rect',
          x,
          y,
          width,
          height: length,
          fill: color,
        });
      });

      setShapes(newShapes);
    }
  }, [road, degree]);

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
      <Stage width={ROAD_WIDTH} height={ROAD_LENGTH} style={{ border: '1px solid black' }}>
        <Layer>
          {shapes.map((shape, index) => {
            if (shape.type === 'rect') {
              return <Rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={shape.fill} />;
            } else if (shape.type === 'line') {
              return <Line key={index} points={shape.points} stroke={shape.stroke} />;
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default RoadObserverPage;
