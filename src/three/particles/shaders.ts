// Vertex/fragment shaders del motor de partículas reactivas. Se escriben
// como strings de JS (no .glsl con glslify) porque Metro, el bundler de
// Expo/React Native, no procesa glslify sin un transformer custom — este
// approach (pasarle el string directo a THREE.ShaderMaterial vía el JSX
// intrínseco <shaderMaterial>) es el estándar en React Three Fiber y no
// pierde nada funcional.

export const particulaVertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aCarga;

  varying vec3 vColor;
  varying float vCarga;

  uniform float uTime;

  void main() {
    vColor = aColor;
    vCarga = aCarga;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Pulso sutil de tamaño, con fase distinta por posición para que no
    // todas las partículas titilen en sincro.
    float pulso = 1.0 + 0.18 * sin(uTime * 2.2 + position.x * 3.1 + position.y * 2.3);

    gl_PointSize = aSize * pulso * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particulaFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vCarga;

  uniform float uOpacidad;

  void main() {
    vec2 centro = gl_PointCoord - vec2(0.5);
    float dist = length(centro) * 2.0;
    float alpha = smoothstep(1.0, 0.0, dist);

    // Carga energética (-1..1) modula el brillo del núcleo: partículas muy
    // "cargadas" (positiva o negativamente) brillan más que las neutras.
    float brillo = 0.55 + 0.45 * abs(vCarga);

    gl_FragColor = vec4(vColor * brillo, alpha * uOpacidad);
  }
`;

export const hiloVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hiloFragmentShader = /* glsl */ `
  varying vec2 vUv;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uFlicker;

  void main() {
    // Franja de energía que "viaja" a lo largo del tubo.
    float flujo = fract(vUv.x * 6.0 - uTime * 1.4);
    float franja = smoothstep(0.0, 0.18, flujo) * smoothstep(0.55, 0.18, flujo);

    float titileo = uFlicker > 0.5 ? (0.7 + 0.3 * sin(uTime * 9.0)) : 1.0;

    float brillo = (0.3 + franja * 1.3) * titileo;
    float alpha = (0.5 + franja * 0.4) * titileo;

    gl_FragColor = vec4(uColor * brillo, alpha);
  }
`;
