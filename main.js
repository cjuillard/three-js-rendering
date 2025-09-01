import { circleSDFMaterial, createSDFCircleMaterial, createSDFQuadMaterial, SDFCircle} from './sdfRendering.js';
import { LoopScene } from './src/loops.js';

const FRUSTUM_HEIGHT = 10;

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(0x222233);

const scene = new THREE.Scene();

function createOrthoCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumWidth = FRUSTUM_HEIGHT * aspect;
  const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2, frustumWidth / 2,
    FRUSTUM_HEIGHT / 2, -FRUSTUM_HEIGHT / 2,
    0.1, 1000
  );
  camera.position.z = 5;
  return camera;
}
let camera = createOrthoCamera();

// Function to create a triangle mesh
function createTriangle(color, position) {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 1, 0,
    -1, -1, 0,
    1, -1, 0
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const material = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  return mesh;
}


// Add a few triangles with different colors and positions
scene.add(createTriangle(0xff5555, new THREE.Vector3(-2, 0, 0)));
scene.add(createTriangle(0x55ff55, new THREE.Vector3(2, 0, 0)));
scene.add(createTriangle(0x5555ff, new THREE.Vector3(0, 2, 0)));

const quadSize = 3.0; // Size of the quad
const quadGeometry = new THREE.PlaneGeometry(quadSize, quadSize);

const quadMesh = new THREE.Mesh(quadGeometry, circleSDFMaterial);
quadMesh.position.set(0, -1.5, 0); // Place below the triangles
scene.add(quadMesh);

function getLoopSize() {
  // The width and height of the orthographic camera's view frustum
  const width = camera.right - camera.left;
  const height = camera.top - camera.bottom;
  return new THREE.Vector2(width, height);
}
const loopScene = new LoopScene(40, getLoopSize());
loopScene.addToScene(scene);

function updatePositions(timeSinceStart) {
  loopScene.update(timeSinceStart);
}

let startTime = null;
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  if (!startTime) startTime = now;
  const elapsed = (now - startTime) / 1000.0;

  updatePositions(elapsed);
  // Animate scale with a sine wave
  const scale = 1 + 0.5 * Math.sin(elapsed * 2.0); // oscillates between 0.5 and 1.5
  quadMesh.scale.set(scale, scale, 1);
  renderer.render(scene, camera);
}
animate();

// Handle resizing
window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;
  const frustumWidth = FRUSTUM_HEIGHT * aspect;
  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.top = FRUSTUM_HEIGHT / 2;
  camera.bottom = -FRUSTUM_HEIGHT / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  loopScene.setSize(getLoopSize());
});
