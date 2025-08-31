// Three.js scene setup to render a few triangles
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(0x222233);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

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

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});
