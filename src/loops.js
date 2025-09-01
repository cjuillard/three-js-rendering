import { createSDFCircleMaterial, SDFCircle } from "../sdfRendering.js";

export class LoopScene {
  constructor(gridSize, sceneSize) {
    this.gridSize = gridSize;
    this.circles = [];
    this.size = { x: sceneSize.x, y: sceneSize.y };

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

  update(timeSinceStart) {
    for(let i = 0; i < this.gridSize; i++) {
      for(let j = 0; j < this.gridSize; j++) {
        const circle = this.circles[i * this.gridSize + j];
        // Update circle position based on time
        const speed = 0.5;
        circle.setPosition(
          // TODO need an ortho cam or something like that for this to work
          Math.sin(timeSinceStart * speed + i) * this.size.x / 2,
          Math.cos(timeSinceStart * speed + j) * this.size.y / 2,
          // Math.sin(timeSinceStart * speed + i) * 2,
          // Math.cos(timeSinceStart * speed + j) * 2,
          0
        );
      }
    }
  }

  setSize(size) {
    this.size.x = size.x;
    this.size.y = size.y;
  }
}