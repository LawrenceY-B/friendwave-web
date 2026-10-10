import * as THREE from "three";

// The landing page's backdrop: a quiet field of fine dots swelling like a calm sea near the
// bottom of the screen. Monochrome and theme-aware (dark dots on light, light dots on dark),
// so it adds depth without competing with the page. Scroll drifts the camera; the pointer
// sends a soft ripple through it.

export interface WaveScene {
  setPointer(x: number, y: number): void; // -1..1 (NDC)
  setScroll(progress: number): void; // 0..1 down the page
  resize(): void;
  dispose(): void;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixel;
  uniform vec3 uMouse;
  uniform float uRipple;
  varying float vFade;
  float swell(vec2 p, float t) {
    return sin(p.x * 0.16 + t * 0.55) * 0.7
         + sin(p.y * 0.21 + t * 0.42) * 0.55
         + sin((p.x + p.y) * 0.09 + t * 0.7) * 0.4;
  }
  void main() {
    vec3 p = position;
    p.y = swell(p.xz, uTime);
    float d = distance(p.xz, uMouse.xz);
    p.y += sin(d * 0.9 - uTime * 3.0) * exp(-d * 0.16) * uRipple * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    // Fade into the distance and toward the near edge, so the field has no hard borders
    vFade = smoothstep(70.0, 18.0, -mv.z) * smoothstep(2.0, 9.0, -mv.z);
    gl_PointSize = uPixel * clamp(1.6 * (24.0 / -mv.z), 1.0, 3.2); // near dots stay small
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vFade;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(uColor, uAlpha * vFade);
  }
`;

export function createWaveScene(
  canvas: HTMLCanvasElement,
  { mobile, reduced }: { mobile: boolean; reduced: boolean }
): WaveScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);

  const segments = mobile ? 110 : 170;
  const geometry = new THREE.PlaneGeometry(110, 80, segments, Math.round(segments * 0.75));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -18);
  const uniforms = {
    uTime: { value: 0 },
    uPixel: { value: dpr },
    uMouse: { value: new THREE.Vector3(0, 0, 999) },
    uRipple: { value: 0 },
    uColor: { value: new THREE.Color() },
    uAlpha: { value: 0.5 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Points(geometry, material));

  const pointer = new THREE.Vector2(0, -0.6);
  const pointerSmooth = new THREE.Vector2(0, -0.6);
  let hasPointer = false;
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  let scroll = 0;
  let scrollSmooth = 0;
  let ripple = 0;
  let time = 0;
  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;
  let portrait = false;

  function render() {
    if (!reduced) time += Math.min(clock.getDelta(), 0.1);
    pointerSmooth.lerp(pointer, 0.05);
    scrollSmooth += (scroll - scrollSmooth) * 0.06;
    ripple += ((hasPointer ? 1 : 0) - ripple) * 0.04;
    uniforms.uTime.value = reduced ? 3 : time;
    uniforms.uRipple.value = ripple;

    // Low over the water, looking slightly up, so the horizon sits in the lower part of the
    // screen under the headline; scrolling drifts the camera gently forward
    camera.position.set(pointerSmooth.x * 0.8, 3.2 + scrollSmooth * 1.5, 10 - scrollSmooth * 6);
    camera.lookAt(0, portrait ? 7.5 : 4.6, -20); // tall phone screens need the horizon lower still

    raycaster.setFromCamera(pointerSmooth, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) uniforms.uMouse.value.copy(hit);
    renderer.render(scene, camera);
  }

  // Same palette as the app: neutral-900 dots on light, white dots on dark
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = () => {
    uniforms.uColor.value.set(dark.matches ? "#ffffff" : "#171717");
    uniforms.uAlpha.value = dark.matches ? 0.34 : 0.28;
    if (reduced) render();
  };
  dark.addEventListener("change", applyTheme);

  function loop() {
    render();
    frame = requestAnimationFrame(loop);
  }
  const start = () => {
    if (running || reduced) return;
    running = true;
    clock.getDelta();
    loop();
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibility);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = w < h;
    camera.fov = portrait ? 62 : 50;
    camera.updateProjectionMatrix();
    if (reduced) render();
  }

  applyTheme();
  resize();
  if (reduced) render();
  else start();

  return {
    setPointer(x, y) {
      hasPointer = true;
      pointer.set(x, y);
    },
    setScroll(p) {
      scroll = p;
      if (reduced) {
        scrollSmooth = p;
        render();
      }
    },
    resize,
    dispose() {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      dark.removeEventListener("change", applyTheme);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
