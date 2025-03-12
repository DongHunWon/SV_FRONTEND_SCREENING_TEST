/**
 * Road Observer types
 *
 * Please use these types and extend them as needed.
 */

/**
 * direction: 1 for going down, -1 for going up the road (y-axis)
 */
export type Direction = 1 | -1;

/**
 * Vehicle type
 *
 * position: Image coordinates (x, y) for the vehicle
 * width: Vehicle width in pixels
 * length: Vehicle length in pixels
 * speed: Vehicle speed in pixels per frame
 * direction: 1 for going down, -1 for going up the road (y-axis)
 */
export type Vehicle = {
  width: number;
  length: number;
  position: {
    x: number;
    y: number;
  };
  speed: number;
  direction: Direction;
};

/**
 * Observer type
 *
 * fov: field of view in degrees
 * direction: 1 for going down, -1 for going up the road (y-axis)
 */
export type Observer = Vehicle & {
  fov: 178;
};

/**
 * Road type
 *
 * vehicles: List of vehicles on the road
 * observer: Observer object
 * width: Road width in pixels
 * length: Road length in pixels
 */
export type Road = {
  vehicles: Vehicle[];
  observer: Observer;
  width: number;
  length: number;
};
