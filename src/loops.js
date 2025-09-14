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
    this.minParticleSize = .1;
    this.maxParticleSize = .2;

    for(let i = 0; i < gridSize; i++) {
      for(let j = 0; j < gridSize; j++) {
        const circle = new SDFCircle(0.1, new THREE.Vector3(i - gridSize / 2, j - gridSize / 2, 0), createSDFCircleMaterial(new THREE.Vector4(1, 1, 1, 1)));
        this.particles.push(circle);
      }
    }

  this.springyGridEnabled = true; // default enabled, can be toggled by UI
  this.#initSpringyGrid();
  }

  #initSpringyGrid() {
    const GRID_CELL_COUNT = 100; // Rows or columns count (whichever is larger in world space)
    let gridWidth, gridHeight;
    if (this.size.x > this.size.y) {
      gridWidth = GRID_CELL_COUNT;
      gridHeight = Math.ceil(GRID_CELL_COUNT * (this.size.y / this.size.x));
    } else {
      gridHeight = GRID_CELL_COUNT;
      gridWidth = Math.ceil(GRID_CELL_COUNT * (this.size.x / this.size.y));
    }
    const cellWorldWidth = this.size.x / gridWidth;
    const cellWorldHeight = this.size.y / gridHeight;
    let springyGrid = new SpringyGrid(gridWidth, gridHeight, cellWorldWidth, cellWorldHeight, {
      springK: 40.0,
      damping: 0.95,
      mouseRadius: 5.0,
      mouseForce: 100
    });

    this.springyGrid = springyGrid;
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

  update(timeSinceStart, dt) {
    this.currTime = timeSinceStart;
    const t = this.currTime / this.loopLength;
    const tmpColor = new THREE.Color();


    if (this.springyGrid && this.springyGridEnabled) {
      if(this.mouseWorldPos) {
        this.springyGrid.applyMouseForce(this.mouseWorldPos.x, this.mouseWorldPos.y, dt);
      }
      this.springyGrid.update(dt);
    }

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

        // --- SPRINGY GRID OFFSET ---

        let gridOffset = { x: 0, y: 0 };
        if (this.springyGrid && this.springyGridEnabled) {
          // Map (x, y) in world space to grid cell using SpringyGrid
          gridOffset = this.springyGrid.getOffsetForWorld(x + this.size.x / 2, y + this.size.y / 2);
        }

        // Update circle position and scale based on time and computed size
        switch(this.shapeType) {
          case ShapeTypes.SPIRAL:
            circle.setPosition(x + xOff + gridOffset.x, y + yOff + gridOffset.y, 0);
            break;
          case ShapeTypes.STAR:
            circle.setPosition(x + newXOff + gridOffset.x, y + newYOff + gridOffset.y, 0);
            break;
          case ShapeTypes.FLOWERY:
            circle.setPosition(x + newXOff + xOff + gridOffset.x, y + newYOff + yOff + gridOffset.y, 0);
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

  setMouseWorldPos(worldPos) {
    this.mouseWorldPos = worldPos;
  }

  setSize(size) {
    this.size.x = size.x;
    this.size.y = size.y;

    // Reinitialize springy grid with new size
    this.#initSpringyGrid();
  }
}

/**
 * Encapsulates a 2D grid of springy 2D vectors
 */
export class SpringyGrid {
  constructor(gridWidth, gridHeight, cellWorldWidth, cellWorldHeight, params = {}) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.cellWorldWidth = cellWorldWidth;
    this.cellWorldHeight = cellWorldHeight;
    // Center the grid at (0,0) in world space
    this.gridOffset = {
      x: -this.gridWidth * this.cellWorldWidth / 2,
      y: -this.gridHeight * this.cellWorldHeight / 2
    }
    // Simulation parameters (can be tweaked)
    this.springK = params.springK ?? 8.0;
    this.damping = params.damping ?? 0.7;
    this.mouseRadius = params.mouseRadius ?? 2.0;
    this.mouseForce = params.mouseForce ?? 2.5;
    // Grid of {offset: THREE.Vector2, velocity: THREE.Vector2}
    this.grid = [];
    for (let y = 0; y < gridHeight; y++) {
      const row = [];
      for (let x = 0; x < gridWidth; x++) {
        row.push({
          offset: new THREE.Vector2(0, 0),
          velocity: new THREE.Vector2(0, 0)
        });
      }
      this.grid.push(row);
    }
  }

  // Apply a mouse force at world position (mx, my)
  applyMouseForce(mx, my, dt) {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        // Cell center in world space
        const cellWorldX = (x + 0.5) * this.cellWorldWidth + this.gridOffset.x;
        const cellWorldY = (y + 0.5) * this.cellWorldHeight + this.gridOffset.y;
        const dx = cellWorldX - mx;
        const dy = cellWorldY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouseRadius) {
          const forceMag = (1 - dist / this.mouseRadius) * this.mouseForce;
          const fx = (dx / (dist + 0.001)) * forceMag;
          const fy = (dy / (dist + 0.001)) * forceMag;
          this.grid[y][x].velocity.x += fx * dt;
          this.grid[y][x].velocity.y += fy * dt;
        }
      }
    }
  }

  // Update the grid (spring and damping)
  update(dt) {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        // Spring force toward (0,0)
        cell.velocity.x += -this.springK * cell.offset.x * dt;
        cell.velocity.y += -this.springK * cell.offset.y * dt;
        // Damping
        cell.velocity.multiplyScalar(this.damping);
        // Integrate
        cell.offset.x += cell.velocity.x * dt;
        cell.offset.y += cell.velocity.y * dt;
      }
    }
  }

  // Get the offset for a world position (x, y)
  getOffsetForWorld(x, y) {
    // Map world x/y to grid indices
    const gridX = Math.floor(x / this.cellWorldWidth);
    const gridY = Math.floor(y / this.cellWorldHeight);
    if (
      gridY >= 0 && gridY < this.gridHeight &&
      gridX >= 0 && gridX < this.gridWidth &&
      this.grid[gridY] && this.grid[gridY][gridX]
    ) {
      return this.grid[gridY][gridX].offset;
    }
    return { x: 0, y: 0 };
  }

  // Optionally: reset grid
  reset() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].offset.set(0, 0);
        this.grid[y][x].velocity.set(0, 0);
      }
    }
  }
}