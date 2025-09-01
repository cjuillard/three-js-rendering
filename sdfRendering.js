const loader = new THREE.TextureLoader();
const sdfTexture = loader.load('public/images/circle-sdf.png');

// Factory function to create a ShaderMaterial for SDF quads
export function createSDFQuadMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      source: { value: texture }
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
      varying vec2 vUv;
      void main() {
        vec4 pixel = texture2D(source, vUv);
        //vec4 color = vec4(pixel.rgb, step(0.5, pixel.a));
        vec4 color = vec4(pixel.rgb, clamp((pixel.a - 0.5) * 2.0 / fwidth(pixel.a), 0., 1.));
        gl_FragColor = color;
      }
    `,
    transparent: true
  });
}

export const circleSDFMaterial = createSDFQuadMaterial(sdfTexture);