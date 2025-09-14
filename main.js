import { circleSDFMaterial } from './sdfRendering.js';
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

  renderer.render(scene, camera);
}
animate();

// UI Controls
const shapeTypeSelect = document.getElementById('shapeType');
const alphaCheckbox = document.getElementById('alpha');
const hueCheckbox = document.getElementById('hue');
const saturationCheckbox = document.getElementById('saturation');

// Set initial UI state from LoopScene
shapeTypeSelect.value = loopScene.shapeType;
alphaCheckbox.checked = loopScene.colorTransformations.alpha;
hueCheckbox.checked = loopScene.colorTransformations.hue;
saturationCheckbox.checked = loopScene.colorTransformations.saturation;

shapeTypeSelect.addEventListener('change', (e) => {
  loopScene.setShapeType(e.target.value);
});
alphaCheckbox.addEventListener('change', (e) => {
  loopScene.colorTransformations.alpha = e.target.checked;
});
hueCheckbox.addEventListener('change', (e) => {
  loopScene.colorTransformations.hue = e.target.checked;
});
saturationCheckbox.addEventListener('change', (e) => {
  loopScene.colorTransformations.saturation = e.target.checked;
});


// Particle size sliders
const minSizeSlider = document.getElementById('minSize');
const maxSizeSlider = document.getElementById('maxSize');
const minSizeValue = document.getElementById('minSizeValue');
const maxSizeValue = document.getElementById('maxSizeValue');

// Set initial values from LoopScene
minSizeSlider.value = loopScene.minParticleSize;
maxSizeSlider.value = loopScene.maxParticleSize;
minSizeValue.textContent = loopScene.minParticleSize;
maxSizeValue.textContent = loopScene.maxParticleSize;

function updateMinSize(val) {
  loopScene.minParticleSize = val;
  minSizeValue.textContent = val;
  // Ensure min <= max
  if (val > loopScene.maxParticleSize) {
    loopScene.maxParticleSize = val;
    maxSizeSlider.value = val;
    maxSizeValue.textContent = val;
  }
}
function updateMaxSize(val) {
  loopScene.maxParticleSize = val;
  maxSizeValue.textContent = val;
  // Ensure max >= min
  if (val < loopScene.minParticleSize) {
    loopScene.minParticleSize = val;
    minSizeSlider.value = val;
    minSizeValue.textContent = val;
  }
}

minSizeSlider.addEventListener('input', (e) => {
  updateMinSize(parseFloat(e.target.value));
});
maxSizeSlider.addEventListener('input', (e) => {
  updateMaxSize(parseFloat(e.target.value));
});

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
