const loader = new THREE.TextureLoader();
const circleSDFTexture = loader.load('public/images/circle-sdf.png');

// Factory function to create a ShaderMaterial for SDF quads
export function createSDFQuadMaterial(texture, color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      source: { value: texture },
      uColor: { value: color ?? new THREE.Vector4(1, 1, 1, 1) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D source;
      uniform vec4 uColor;
      varying vec2 vUv;
      void main() {
        vec4 pixel = texture2D(source, vUv);
        //vec4 color = vec4(pixel.rgb, step(0.5, pixel.a));
        vec4 color = vec4(pixel.rgb, clamp((pixel.a - 0.5) * 2.0 / fwidth(pixel.a), 0., 1.));
        gl_FragColor = color * uColor;
      }
    `,
    transparent: true
  });
}

export function createSDFCircleMaterial(color) {
  return createSDFQuadMaterial(circleSDFTexture, color);
}

export const circleSDFMaterial = createSDFQuadMaterial(circleSDFTexture, new THREE.Vector4(1, 0, 0, 1));

export class SDFCircle {
  constructor(radius, position, material) {
    this.radius = radius;
    this.material = material ?? createSDFCircleMaterial(new THREE.Vector4(1, 1, 1, 1));
    this.mesh = this.initMesh(position);
  }

  initMesh(position) {
    const quadGeometry = new THREE.PlaneGeometry(this.radius / 2, this.radius / 2);
    const quadMesh = new THREE.Mesh(quadGeometry, this.material);
    quadMesh.position.copy(position);

    return quadMesh;
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }

  setColor(r, g, b, a) {
    this.material.uniforms.uColor.value.set(r, g, b, a);
  }


  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setScale(s) {
    this.mesh.scale.set(s, s, 1);
  }

  get position() {
    return this.mesh.position; 
  }
  set position(value) {
    this.mesh.position.copy(value);
  }
}