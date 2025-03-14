'use client';

import { Coordinate, Vehicle } from '@/types/road-observer.type';
import { useEffect, useState } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';

enum COLOR {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  BLACK = 'black',
}

enum SHAPE_TYPE {
  RECT = 'rect',
  LINE = 'line',
  GROUP = 'group',
}

type CommonShape = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  visible?: boolean;
  strokeWidth?: number;
  vehicle?: Vehicle;
};

type Rect = CommonShape & {
  type: SHAPE_TYPE.RECT;
};
type Line = CommonShape & {
  type: SHAPE_TYPE.LINE;
  points?: number[];
};

type Group = CommonShape & {
  type: SHAPE_TYPE.GROUP;
  text?: string;
  fontSize?: number;
};

type Shape = Rect | Line | Group;

function radianToDegree(radians: number): number {
  let degree = radians * (180 / Math.PI);
  degree = (degree + 360) % 360;
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

      const leftFOVDegree = radianToDegree(Math.atan2(leftY - centerY, leftX - centerX)); // 도로 기준 왼쪽 시야각
      const rightFOVDegree = radianToDegree(Math.atan2(rightY - centerY, rightX - centerX)); // 도로 기준 오른쪽 시야각
      const newShapes: Shape[] = [
        {
          type: SHAPE_TYPE.LINE,
          points: [centerX, centerY, leftX, leftY],
          stroke: COLOR.PURPLE,
        },
        {
          type: SHAPE_TYPE.LINE,
          points: [centerX, centerY, rightX, rightY],
          stroke: COLOR.PURPLE,
        },
        {
          type: SHAPE_TYPE.RECT,
          x: observer.position.x,
          y: observer.position.y,
          width: observer.width,
          height: observer.length,
          fill: COLOR.BLACK,
        },
      ];

      const popupGroups: Shape[] = [];
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

        let color = COLOR.RED;
        let opacity = 1;
        if (maxDegree <= 270) {
          if (minDegree < 90) {
            if ((rightFOVDegree < minDegree && maxDegree < leftFOVDegree) || 270 <= rightFOVDegree) {
              color = COLOR.GREEN;
            } else if (maxDegree <= 90) {
              if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                opacity = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = COLOR.BLUE;
              }
            } else {
              if (minDegree <= rightFOVDegree) {
                if (maxDegree <= leftFOVDegree) {
                  opacity = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = COLOR.BLUE;
                } else {
                  opacity = (leftFOVDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = COLOR.BLUE;
                }
              } else if (leftFOVDegree <= maxDegree) {
                opacity = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
                color = COLOR.BLUE;
              }
            }
          } else {
            if (maxDegree < leftFOVDegree) {
              color = COLOR.GREEN;
            } else if (minDegree <= leftFOVDegree && leftFOVDegree <= maxDegree) {
              opacity = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
              color = COLOR.BLUE;
            }
          }
        } else {
          if (leftFOVDegree === 270) {
            color = COLOR.GREEN;
          } else {
            if (180 < minDegree && minDegree < 270) {
              if (minDegree <= leftFOVDegree && rightFOVDegree <= maxDegree) {
                opacity = (leftFOVDegree - minDegree + maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = COLOR.BLUE;
              } else if (minDegree <= leftFOVDegree) {
                opacity = (leftFOVDegree - minDegree) / (maxDegree - minDegree);
                color = COLOR.BLUE;
              } else if (270 < rightFOVDegree && rightFOVDegree <= maxDegree) {
                opacity = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                color = COLOR.BLUE;
              }
            } else {
              if (270 <= minDegree) {
                if (270 < rightFOVDegree && rightFOVDegree < minDegree) {
                  color = COLOR.GREEN;
                } else if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                  opacity = (maxDegree - rightFOVDegree) / (maxDegree - minDegree);
                  color = COLOR.BLUE;
                }
              } else {
                if (90 < minDegree) {
                  opacity = degree / 360;
                  color = COLOR.BLUE;
                } else {
                  const newMinDegree = Math.max(...coordinateDegrees.filter((d) => d <= 90));
                  const newMaxDegree = Math.min(...coordinateDegrees.filter((d) => 270 <= d));
                  if (270 <= rightFOVDegree) {
                    if (rightFOVDegree < newMaxDegree) {
                      color = COLOR.GREEN;
                    } else if (newMaxDegree <= rightFOVDegree) {
                      opacity = (360 - rightFOVDegree + newMinDegree) / (360 - newMaxDegree + newMinDegree);
                      color = COLOR.BLUE;
                    }
                  } else {
                    if (rightFOVDegree <= newMinDegree) {
                      opacity = (newMinDegree - rightFOVDegree) / (360 - newMaxDegree + newMinDegree);
                      color = COLOR.BLUE;
                    }
                  }
                }
              }
            }
          }
        }

        newShapes.push({
          type: SHAPE_TYPE.RECT,
          x,
          y,
          width,
          height: length,
          fill: color,
          opacity,
          vehicle,
        });

        if (color === COLOR.BLUE) {
          popupGroups.push({
            type: SHAPE_TYPE.GROUP,
            x: x - 25,
            y: y - 30,
            width: 40,
            height: 15,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            text: `${(opacity * 100).toFixed(0)}%`,
            fontSize: 14,
          });
        }
      });
      newShapes.push(...popupGroups);
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
            if (shape.type === SHAPE_TYPE.RECT) {
              return <Rect key={index} {...shape} />;
            } else if (shape.type === SHAPE_TYPE.LINE) {
              return <Line key={index} {...shape} />;
            } else if (shape.type === SHAPE_TYPE.GROUP) {
              return (
                <Group key={index} x={shape.x} y={shape.y}>
                  <Rect width={shape.width} height={shape.height} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />
                  <Text text={shape.text} fontSize={shape.fontSize} fill="black" width={shape.width} align="center" />
                </Group>
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default RoadObserverPage;
