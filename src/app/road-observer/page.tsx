'use client';

import { COLOR, Coordinate, Shape, SHAPE_TYPE, Vehicle } from '@/types/road-observer.type';
import { useEffect, useState } from 'react';
import useRoadStream from '@/hooks/useRoadStream.hook';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';
import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';

const ZONE = {
  1: 1,
  12: 12,
  2: 2,
  23: 23,
  3: 3,
  34: 34,
  4: 4,
  14: 14,
  1234: 1234,
} as const;
type ZONE = keyof typeof ZONE;

type MinMaxInfo = {
  minDegree: number;
  maxDegree: number;
  zone: ZONE;
};

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

function getMinMaxInfo(centerX: number, centerY: number, coordinates: Coordinate[]): MinMaxInfo {
  const xs = coordinates.map((c) => c.x);
  const ys = coordinates.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const getPointDegree = ({ x, y }: Coordinate) => calcAngleOfCoordinate(x - centerX, y - centerY);

  let minDegreeCoordinate: Coordinate;
  let maxDegreeCoordinate: Coordinate;
  let zone: ZONE;
  if (centerX <= minX) {
    // 1, 4 구역
    if (centerY <= minY) {
      // 1 구역
      minDegreeCoordinate = coordinates[1];
      maxDegreeCoordinate = coordinates[3];
      zone = ZONE[1];
    } else if (maxY <= centerY) {
      // 4 구역
      minDegreeCoordinate = coordinates[0];
      maxDegreeCoordinate = coordinates[2];
      zone = ZONE[4];
    } else {
      // 1, 4 경계 구간
      minDegreeCoordinate = coordinates[3];
      maxDegreeCoordinate = coordinates[0];
      zone = ZONE[14];
    }
  } else if (maxX <= centerX) {
    // 2, 3 구역
    if (centerY <= minY) {
      // 2 구역
      minDegreeCoordinate = coordinates[2];
      maxDegreeCoordinate = coordinates[0];
      zone = ZONE[2];
    } else if (maxY <= centerY) {
      // 3 구역
      minDegreeCoordinate = coordinates[3];
      maxDegreeCoordinate = coordinates[1];
      zone = ZONE[3];
    } else {
      // 2, 3 경계 구간
      minDegreeCoordinate = coordinates[2];
      maxDegreeCoordinate = coordinates[1];
      zone = ZONE[23];
    }
  } else {
    // y축 경계 구간
    if (centerY <= minY) {
      // 1, 2 경계 구간
      minDegreeCoordinate = coordinates[1];
      maxDegreeCoordinate = coordinates[0];
      zone = ZONE[12];
    } else if (maxY <= centerY) {
      // 3, 4 경계 구간
      minDegreeCoordinate = coordinates[3];
      maxDegreeCoordinate = coordinates[2];
      zone = ZONE[34];
    } else {
      // 1, 2, 3, 4 경계 구간
      return { minDegree: 360, maxDegree: 360, zone: ZONE[1234] };
    }
  }

  const minDegree = getPointDegree(minDegreeCoordinate);
  const maxDegree = getPointDegree(maxDegreeCoordinate);
  return { minDegree, maxDegree, zone };
}

const RoadObserverPage = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [degree, setDegree] = useState(360);
  const { road } = useRoadStream(isPaused);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>();

  useEffect(() => {
    if (road) {
      const observer = road.observer;
      const direction = observer.direction;
      const centerX = observer.position.x + observer.width / 2;
      const centerY = direction === 1 ? observer.position.y + observer.length : observer.position.y;
      const halfFOV = (((direction === 1 ? 360 - degree : degree) / 2) * Math.PI) / 180;
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
        const id = index + '';
        const coordinates = getVehicleCoordinate(vehicle);
        const { minDegree, maxDegree, zone } = getMinMaxInfo(centerX, centerY, coordinates);
        let fullRange = maxDegree - minDegree;

        let color = COLOR.RED;
        let opacity = 1;

        if (leftFOVDegree === 90) {
          color = direction === 1 ? COLOR.RED : COLOR.GREEN;
        } else if (leftFOVDegree === 270) {
          color = direction === 1 ? COLOR.GREEN : COLOR.RED;
        } else {
          switch (zone) {
            case ZONE[1]:
              if (rightFOVDegree <= 90) {
                if (rightFOVDegree < minDegree) {
                  color = direction === 1 ? COLOR.GREEN : COLOR.RED;
                } else if (maxDegree < rightFOVDegree) {
                  color = direction === 1 ? COLOR.RED : COLOR.GREEN;
                } else if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? maxDegree - rightFOVDegree : rightFOVDegree - minDegree) / fullRange;
                }
              } else {
                color = direction === 1 ? COLOR.GREEN : COLOR.RED;
              }
              break;
            case ZONE[4]:
              if (270 <= rightFOVDegree) {
                if (rightFOVDegree < minDegree) {
                  color = direction === 1 ? COLOR.GREEN : COLOR.RED;
                } else if (maxDegree < rightFOVDegree) {
                  color = direction === 1 ? COLOR.RED : COLOR.GREEN;
                } else if (minDegree <= rightFOVDegree && rightFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? maxDegree - rightFOVDegree : rightFOVDegree - minDegree) / fullRange;
                }
              } else {
                color = direction === 1 ? COLOR.RED : COLOR.GREEN;
              }
              break;
            case ZONE[12]:
              if (leftFOVDegree <= 180) {
                if (rightFOVDegree < minDegree && maxDegree < leftFOVDegree) {
                  color = direction === 1 ? COLOR.GREEN : COLOR.RED;
                } else if (minDegree <= rightFOVDegree && leftFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? leftFOVDegree - rightFOVDegree : fullRange - (leftFOVDegree - rightFOVDegree)) / fullRange;
                } else if (minDegree <= rightFOVDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? maxDegree - rightFOVDegree : rightFOVDegree - minDegree) / fullRange;
                } else if (leftFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? leftFOVDegree - minDegree : maxDegree - leftFOVDegree) / fullRange;
                }
              } else {
                color = direction === 1 ? COLOR.GREEN : COLOR.RED;
              }
              break;
            case ZONE[2]:
            case ZONE[23]:
            case ZONE[3]:
              if (leftFOVDegree < minDegree) {
                color = direction === 1 ? COLOR.RED : COLOR.GREEN;
              } else if (maxDegree < leftFOVDegree) {
                color = direction === 1 ? COLOR.GREEN : COLOR.RED;
              } else if (minDegree <= leftFOVDegree && leftFOVDegree <= maxDegree) {
                color = COLOR.BLUE;
                opacity = (direction === 1 ? leftFOVDegree - minDegree : maxDegree - leftFOVDegree) / fullRange;
              }
              break;
            case ZONE[34]:
              if (180 < leftFOVDegree) {
                if (leftFOVDegree < minDegree && maxDegree < rightFOVDegree) {
                  color = direction === 1 ? COLOR.RED : COLOR.GREEN;
                } else if (minDegree <= leftFOVDegree && rightFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? fullRange - (rightFOVDegree - leftFOVDegree) : rightFOVDegree - leftFOVDegree) / fullRange;
                } else if (minDegree <= leftFOVDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? leftFOVDegree - minDegree : maxDegree - leftFOVDegree) / fullRange;
                } else if (rightFOVDegree <= maxDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? maxDegree - rightFOVDegree : rightFOVDegree - minDegree) / fullRange;
                }
              } else {
                color = direction === 1 ? COLOR.RED : COLOR.GREEN;
              }
              break;
            case ZONE[14]:
              fullRange = 360 - fullRange;
              if (rightFOVDegree <= 90) {
                if (minDegree < rightFOVDegree) {
                  color = direction === 1 ? COLOR.RED : COLOR.GREEN;
                } else if (rightFOVDegree <= minDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? minDegree - rightFOVDegree : fullRange - (minDegree - rightFOVDegree)) / fullRange;
                }
              } else {
                if (rightFOVDegree < maxDegree) {
                  color = direction === 1 ? COLOR.GREEN : COLOR.RED;
                } else if (maxDegree <= rightFOVDegree) {
                  color = COLOR.BLUE;
                  opacity = (direction === 1 ? fullRange - (rightFOVDegree - maxDegree) : rightFOVDegree - maxDegree) / fullRange;
                }
              }
              break;
            case ZONE[1234]:
              fullRange = 360;
              if (leftFOVDegree <= 180) {
                color = COLOR.BLUE;
                opacity = (direction === 1 ? leftFOVDegree - rightFOVDegree : fullRange - (leftFOVDegree - rightFOVDegree)) / fullRange;
              } else {
                color = COLOR.BLUE;
                opacity = (direction === 1 ? fullRange - (rightFOVDegree - leftFOVDegree) : rightFOVDegree - leftFOVDegree) / fullRange;
              }
              break;
            default:
              break;
          }
        }

        newShapes.push({
          id,
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
            x: x - 20 < 0 ? 0 : ROAD_WIDTH < x + 20 ? ROAD_WIDTH - 40 : x - 20,
            y: Math.max(0, y - 20),
            width: 40,
            height: 15,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
            text: `${(opacity * 100).toFixed(0)}%`,
            fontSize: 14,
            visible: id === selectedVehicle,
          });
        }
      });
      newShapes.push(...popupGroups);
      setShapes(newShapes);
    }
  }, [road, degree, selectedVehicle]);

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleVehicleClick = (id?: string) => {
    setSelectedVehicle(id);
  };

  if (!road) {
    return <p>Loading...</p>;
  }
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
              return <Rect key={index} {...shape} onClick={() => handleVehicleClick(shape.id)} />;
            } else if (shape.type === SHAPE_TYPE.LINE) {
              return <Line key={index} {...shape} />;
            } else if (shape.type === SHAPE_TYPE.GROUP && shape.visible) {
              return (
                <Group key={index} x={shape.x} y={shape.y}>
                  <Rect width={shape.width} height={shape.height} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />
                  <Text width={shape.width} fill={COLOR.BLACK} text={shape.text} fontSize={shape.fontSize} align="center" />
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
