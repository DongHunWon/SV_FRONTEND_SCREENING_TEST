import { NextResponse } from 'next/server';
import { Road, Vehicle, Observer } from '@/types/road-observer.type';
import { ROAD_LENGTH, ROAD_WIDTH } from '@/consts/road-observer.const';

const CENTER_LINE_RANGE = [ROAD_WIDTH - 4, ROAD_WIDTH + 4];
const INITIAL_VEHICLE_COUNT = 100;
const FRAME_RATE = 30; // 10 ~ 120 FPS
const ANIMATION_SPEED = (30 / FRAME_RATE) * 0.1;
const FOV = 178;

const vehicleSizes = [
  { width: 3, length: 4 },
  { width: 4, length: 6 },
  { width: 4, length: 6 },
  { width: 4, length: 6 },
  { width: 4, length: 6 },
  { width: 4, length: 8 },
  { width: 4, length: 8 },
  { width: 4, length: 8 },
  { width: 6, length: 12 },
  { width: 6, length: 20 },
];

const getRandomVehicleSize = () => {
  return vehicleSizes[Math.floor(Math.random() * vehicleSizes.length)];
};

const getDirection = (x: number): Observer['direction'] => {
  if (x < CENTER_LINE_RANGE[0]) return 1;
  if (x > CENTER_LINE_RANGE[1]) return -1;
  return Math.random() < 0.5 ? 1 : -1;
};

class Simulation {
  private vehicles: Vehicle[];
  private observer: Observer;

  constructor() {
    this.vehicles = this._initializeVehicles(INITIAL_VEHICLE_COUNT);
    this.observer = this._initializeObserver();
  }

  update(): Road {
    this.vehicles = this._updateVehicles(this.vehicles, ROAD_LENGTH);
    this.observer = this._updatePosition(this.observer, ROAD_LENGTH);
    return {
      vehicles: this.vehicles,
      observer: this.observer,
      width: ROAD_WIDTH,
      length: ROAD_LENGTH,
    };
  }

  private _initializeVehicles(count: number): Vehicle[] {
    const vehicles: Vehicle[] = [];
    while (vehicles.length < count) {
      const x = Math.floor(Math.random() * 75);
      if (x >= CENTER_LINE_RANGE[0] && x <= CENTER_LINE_RANGE[1]) continue;

      const { width, length } = getRandomVehicleSize();
      vehicles.push({
        width,
        length,
        position: {
          x,
          y: Math.floor(Math.random() * (ROAD_LENGTH - 10)),
        },
        speed: Math.random() * 2 + 1,
        direction: getDirection(x),
      });
    }
    return vehicles;
  }

  private _initializeObserver(): Observer {
    const x = Math.floor(Math.random() * 75);
    const { width, length } = getRandomVehicleSize();
    return {
      width,
      length,
      position: {
        x,
        y: 180,
      },
      speed: 1,
      direction: getDirection(x),
      fov: FOV,
    };
  }

  private _updateVehicles(vehicles: Vehicle[], roadLength: number): Vehicle[] {
    return vehicles.map((vehicle) => this._updatePosition(vehicle, roadLength));
  }

  private _updatePosition<T extends Vehicle>(
    vehicle: T,
    roadLength: number
  ): T {
    const newY = (() => {
      const _newY =
        vehicle.position.y +
        vehicle.speed * vehicle.direction * ANIMATION_SPEED;
      if (_newY > roadLength) return 0;
      if (_newY < 0) return roadLength;
      return _newY;
    })();

    return {
      ...vehicle,
      position: {
        ...vehicle.position,
        y: newY,
      },
    };
  }
}

const simulation = new Simulation();

export async function GET({ signal }: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const intervalId = setInterval(() => {
        try {
          const road = simulation.update();
          controller.enqueue(`data: ${JSON.stringify(road)}\n\n`);
        } catch (error) {
          console.error('Error in SSE interval:', error);
          clearInterval(intervalId);
          controller.close();
        }
      }, 1000 / FRAME_RATE);

      signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      })

      return () => clearInterval(intervalId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
