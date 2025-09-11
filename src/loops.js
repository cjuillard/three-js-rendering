import { createSDFCircleMaterial, SDFCircle } from "../sdfRendering.js";
import { dist, map } from "./math-utils.js";

export class LoopScene {
  constructor(gridSize, sceneSize) {
    this.gridSize = gridSize;
    this.circles = [];
    this.size = { x: sceneSize.x, y: sceneSize.y };
    this.loopLength = 5;  // length of the loop in seconds
    this.currTime = 0;

    for(let i = 0; i < gridSize; i++) {
      for(let j = 0; j < gridSize; j++) {
        const circle = new SDFCircle(0.1, new THREE.Vector3(i - gridSize / 2, j - gridSize / 2, 0), createSDFCircleMaterial(new THREE.Vector4(1, 1, 1, 1)));
        this.circles.push(circle);
      }
    }
  }

  addToScene(scene) {
    this.circles.forEach(circle => {
      circle.addToScene(scene);
    });
  }

  #sizePeriodicFunc(p)
  {
    return map(Math.sin(Math.PI * 2 * p),-1,1,2,4);
  }

  /**
   * Compute a value to offset the normalize time (t) for a given circle based on its distance from center. 
   */
  #getTOffset(x, y)
  {
    const REPEAT_COUNT = 15;  // Adjust to increase frequency of oscillation across the screen
    return dist(x, y, 0, 0) / this.gridSize * REPEAT_COUNT;
  }

  /** 
   * Computes an angle offset for a given position.
   */
  #getAngleOffsetForPos(x, y)
  {
    const MAX_DIST_TO_OFFSET = this.gridSize / 5;
    const a = Math.atan2(y, x);
    return MAX_DIST_TO_OFFSET * map(a, -Math.PI, Math.PI, 0, 1);
  }

  #xDeltaPeriodicFunc(p) {
    const RANGE = this.gridSize / 50
   return map(Math.sin(Math.PI * 2 * p), -1, 1, -RANGE, RANGE);
  }

  update(timeSinceStart) {
    this.currTime = timeSinceStart;
    const t = this.currTime / this.loopLength;
    for(let i = 0; i < this.gridSize; i++) {
      for(let j = 0; j < this.gridSize; j++) {
        const circle = this.circles[i * this.gridSize + j];

        const x = map(i, 0, this.gridSize - 1, -this.size.x / 2, this.size.x / 2);
        const y = map(j, 0, this.gridSize - 1, -this.size.y / 2, this.size.y / 2);

        const tOffset = this.#getTOffset(x,y);
        const size = this.#sizePeriodicFunc(t-tOffset);

        const xOff = this.#xDeltaPeriodicFunc(t-tOffset);
        const yOff = this.#xDeltaPeriodicFunc(t-tOffset+.25);

        const angleOffset = this.#getAngleOffsetForPos(x,y);
        const newXOff = this.#xDeltaPeriodicFunc(t-angleOffset);
        const newYOff = this.#xDeltaPeriodicFunc(t-angleOffset + .25);

        // Update circle position and scale based on time and computed size
        // circle.setPosition(x + xOff, y + yOff, 0);  // Spiral
        circle.setPosition(x + newXOff, y + newYOff, 0);  // Star
        // circle.setPosition(x + newXOff + xOff, y + newYOff + yOff, 0);  // Flower-ish
        
        circle.setScale(size);
      }
    }
  }

  setSize(size) {
    this.size.x = size.x;
    this.size.y = size.y;
  }
}