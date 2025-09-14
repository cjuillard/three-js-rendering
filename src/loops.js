import { createSDFCircleMaterial, SDFCircle } from "../sdfRendering.js";
import { dist, map } from "./math-utils.js";

export const ShapeTypes = {
  SPIRAL: "SPIRAL",
  STAR: "STAR",
  FLOWERY: "FLOWERY"
};

export class LoopScene {
  constructor(gridSize, sceneSize) {
    this.gridSize = gridSize;
    this.particles = [];
    this.size = { x: sceneSize.x, y: sceneSize.y };
    this.loopLength = 5;  // length of the loop in seconds
    this.currTime = 0;
    this.shapeType = ShapeTypes.STAR;
    this.colorTransformations = {
      alpha: true,
      hue: true,
      saturation: false
    }
    this.minParticleSize = 2;
    this.maxParticleSize = 4;

    for(let i = 0; i < gridSize; i++) {
      for(let j = 0; j < gridSize; j++) {
        const circle = new SDFCircle(0.1, new THREE.Vector3(i - gridSize / 2, j - gridSize / 2, 0), createSDFCircleMaterial(new THREE.Vector4(1, 1, 1, 1)));
        this.particles.push(circle);
      }
    }
  }

  addToScene(scene) {
    this.particles.forEach(circle => {
      circle.addToScene(scene);
    });
  }

  setShapeType(type) {
    if (Object.values(ShapeTypes).includes(type)) {
      this.shapeType = type;
    } else {
      console.warn(`Invalid shape type: ${type}`);
    }
  }



  #sizePeriodicFunc(p) {
    // Use minParticleSize and maxParticleSize from the instance
    return map(
      Math.sin(Math.PI * 2 * p),
      -1, 1,
      this.minParticleSize,
      this.maxParticleSize
    );
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
    const tmpColor = new THREE.Color();
    for(let i = 0; i < this.gridSize; i++) {
      for(let j = 0; j < this.gridSize; j++) {
        const circle = this.particles[i * this.gridSize + j];

        // Start with a grid of points
        const x = map(i, 0, this.gridSize - 1, -this.size.x / 2, this.size.x / 2);
        const y = map(j, 0, this.gridSize - 1, -this.size.y / 2, this.size.y / 2);

        // Compute some normalized offsets based on the distance from center
        const tOffset = this.#getTOffset(x,y);
        
        // Compute size based on time (looping back to start at every t % 1 === 0)
        const size = this.#sizePeriodicFunc(t-tOffset);

        // Compute position offsets based on time (looping back at t % 1 === 0)
        const xOff = this.#xDeltaPeriodicFunc(t-tOffset);
        const yOff = this.#xDeltaPeriodicFunc(t-tOffset+.25);

        // Compute position offsets based on angle from center
        const angleOffset = this.#getAngleOffsetForPos(x,y);
        const newXOff = this.#xDeltaPeriodicFunc(t-angleOffset);
        const newYOff = this.#xDeltaPeriodicFunc(t-angleOffset + .25);

        // Update circle position and scale based on time and computed size
        switch(this.shapeType) {
          case ShapeTypes.SPIRAL:
            circle.setPosition(x + xOff, y + yOff, 0);
            break;
          case ShapeTypes.STAR:
            circle.setPosition(x + newXOff, y + newYOff, 0);
            break;
          case ShapeTypes.FLOWERY:
            circle.setPosition(x + newXOff + xOff, y + newYOff + yOff, 0);
            break;
        }

        // Fade alpha in and out
        const alpha = this.colorTransformations.alpha ? map(Math.sin((t + tOffset) * 3), -1, 1, 0, 1) : 1;
        circle.setColor(1, 1, 1, alpha);
        
        // Rotate through hue values
        tmpColor.setHSL(this.colorTransformations.hue ? (t + tOffset) % 1 : 0, 
          this.colorTransformations.saturation ? Math.sin((t + tOffset) * 3) : 1, 
          this.colorTransformations.hue ? 0.5 : 1);
        circle.setColor(tmpColor.r, tmpColor.g, tmpColor.b, alpha);
        
        circle.setScale(size);
      }
    }
  }

  setSize(size) {
    this.size.x = size.x;
    this.size.y = size.y;
  }
}