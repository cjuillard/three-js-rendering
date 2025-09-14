import { circleSDFMaterial } from './sdfRendering.js';
import { LoopScene, SpringyGrid } from './src/loops.js';

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


// --- Mouse Interaction ---
let mouse = { x: 0, y: 0, ndc: new THREE.Vector2(), world: new THREE.Vector2() };
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  // NDC
  mouse.ndc.x = (mouse.x / rect.width) * 2 - 1;
  mouse.ndc.y = -((mouse.y / rect.height) * 2 - 1);
  // World
  const width = camera.right - camera.left;
  const height = camera.top - camera.bottom;
  mouse.world.x = camera.left + (mouse.x / rect.width) * width;
  mouse.world.y = camera.bottom + (1 - mouse.y / rect.height) * height;
});


// --- Pass SpringyGrid to LoopScene ---
const loopScene = new LoopScene(40, getLoopSize());
loopScene.addToScene(scene);



function updatePositions(timeSinceStart, dt) {
  loopScene.setMouseWorldPos(mouse.world);
  loopScene.update(timeSinceStart, dt);
}

// Debug UI for renderer stats (created in HTML)
const debugStats = document.getElementById('debug-stats');
let debugStatsVisible = false;

function updateDebugStats() {
  if (!debugStatsVisible || !debugStats) return;
  const stats = renderer.info;
  debugStats.innerHTML = `
    <b>WebGL Stats</b><br>
    Draw Calls: ${stats.render.calls}<br>
    Triangles: ${stats.render.triangles}<br>
    Points: ${stats.render.points}<br>
    Lines: ${stats.render.lines}<br>
    Geometries: ${stats.memory.geometries}<br>
    Textures: ${stats.memory.textures}<br>
  `;
}


let startTime = null;
let lastTime = null;
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  if (!startTime) startTime = now;
  if (!lastTime) lastTime = now;
  const elapsed = (now - startTime) / 1000.0;
  const dt = Math.min((now - lastTime) / 1000.0, 0.05); // clamp dt
  lastTime = now;

  updatePositions(elapsed, dt);

  renderer.render(scene, camera);
  updateDebugStats();
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

// Loop length slider
const loopLengthSlider = document.getElementById('loopLength');
const loopLengthValue = document.getElementById('loopLengthValue');
// Set initial value from LoopScene
loopLengthSlider.value = loopScene.loopLength;
loopLengthValue.textContent = loopScene.loopLength;
loopLengthSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  loopScene.loopLength = val;
  loopLengthValue.textContent = val;
});
// Toggle UI with spacebar
const uiControls = document.getElementById('ui-controls');
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat) {
    if (uiControls.style.display === 'none') {
      uiControls.style.display = '';
    } else {
      uiControls.style.display = 'none';
    }
    e.preventDefault();
  }
  // Toggle debug stats with 'd'
  if ((e.key === 'd' || e.key === 'D') && !e.repeat) {
    debugStatsVisible = !debugStatsVisible;
    if (debugStats) debugStats.style.display = debugStatsVisible ? '' : 'none';
    if (debugStatsVisible) updateDebugStats();
    e.preventDefault();
  }
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


// Zoom slider control
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');
// Set initial value
zoomSlider.value = 1;
zoomValue.textContent = '1.00x';

function setCameraZoom(zoom) {
  // Clamp zoom
  zoom = Math.max(0.2, Math.min(5, zoom));
  const aspect = window.innerWidth / window.innerHeight;
  const frustumHeight = FRUSTUM_HEIGHT / zoom;
  const frustumWidth = frustumHeight * aspect;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.left = -frustumWidth / 2;
  camera.right = frustumWidth / 2;
  camera.updateProjectionMatrix();
  loopScene.setSize(getLoopSize());
}

zoomSlider.addEventListener('input', (e) => {
  const zoom = parseFloat(e.target.value);
  setCameraZoom(zoom);
  zoomValue.textContent = zoom.toFixed(2) + 'x';
});

// Set initial zoom
setCameraZoom(parseFloat(zoomSlider.value));

// --- SpringyGrid UI Controls ---
const springyGridEnabledCheckbox = document.getElementById('springyGridEnabled');
const springyGridControls = document.getElementById('springyGridControls');
const springKSlider = document.getElementById('springK');
const springKValue = document.getElementById('springKValue');
const dampingSlider = document.getElementById('damping');
const dampingValue = document.getElementById('dampingValue');
const mouseRadiusSlider = document.getElementById('mouseRadius');
const mouseRadiusValue = document.getElementById('mouseRadiusValue');
const mouseForceSlider = document.getElementById('mouseForce');
const mouseForceValue = document.getElementById('mouseForceValue');

// Set initial values from LoopScene's springyGrid
function updateSpringyGridUIFromScene() {
  if (loopScene.springyGrid) {
    springKSlider.value = loopScene.springyGrid.springK;
    springKValue.textContent = loopScene.springyGrid.springK;
    dampingSlider.value = loopScene.springyGrid.damping;
    dampingValue.textContent = loopScene.springyGrid.damping;
    mouseRadiusSlider.value = loopScene.springyGrid.mouseRadius;
    mouseRadiusValue.textContent = loopScene.springyGrid.mouseRadius;
    mouseForceSlider.value = loopScene.springyGrid.mouseForce;
    mouseForceValue.textContent = loopScene.springyGrid.mouseForce;
  }
}
updateSpringyGridUIFromScene();

springKSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  springKValue.textContent = val;
  if (loopScene.springyGrid) loopScene.springyGrid.springK = val;
});
dampingSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  dampingValue.textContent = val;
  if (loopScene.springyGrid) loopScene.springyGrid.damping = val;
});
mouseRadiusSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  mouseRadiusValue.textContent = val;
  if (loopScene.springyGrid) loopScene.springyGrid.mouseRadius = val;
});
mouseForceSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  mouseForceValue.textContent = val;
  if (loopScene.springyGrid) loopScene.springyGrid.mouseForce = val;
});

// Toggle springy grid effect
springyGridEnabledCheckbox.addEventListener('change', (e) => {
  loopScene.springyGridEnabled = e.target.checked;
  springyGridControls.style.opacity = e.target.checked ? '1' : '0.5';
});
// Set initial state
loopScene.springyGridEnabled = springyGridEnabledCheckbox.checked;
springyGridControls.style.opacity = springyGridEnabledCheckbox.checked ? '1' : '0.5';
