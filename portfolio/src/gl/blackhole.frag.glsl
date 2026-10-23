#version 300 es
// Schwarzschild black hole, rs = 1.
// Each pixel integrates a null geodesic using the Binet form of the photon
// equation: a = -1.5 * h^2 * x / |x|^5. Lensing, the photon ring and the
// doubled image of the disk all fall out of that one line.
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTanFov;
uniform vec2 uShift;
uniform vec3 uMouse;   // xy: cursor in view units, z: lens strength
uniform sampler2D uName;
uniform vec4 uPlane;   // z, half width, half height, opacity
uniform float uPlaneY; // the plate's height above the hole (phones lift it clear)
uniform float uHeat;   // 0 far away .. 1 at the horizon
uniform float uLock;   // JARVIS lock-in red
uniform float uDim;
uniform float uIntro;
uniform float uFlash;
uniform int uSteps;
uniform float uSky;        // starlight: up during the approach, before the disk ignites

out vec4 outColor;

const float RIN = 2.9;
const float ROUT = 14.0;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
        mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
        mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}

float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 4; i++) {
    s += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return s;
}

// Observed temperature -> colour. Deliberately warm: no blue, no purple.
vec3 ramp(float t) {
  vec3 c = mix(vec3(0.06, 0.008, 0.003), vec3(0.55, 0.06, 0.02), smoothstep(0.0, 0.3, t));
  c = mix(c, vec3(1.0, 0.33, 0.08), smoothstep(0.25, 0.6, t));
  c = mix(c, vec3(1.0, 0.68, 0.38), smoothstep(0.55, 0.9, t));
  c = mix(c, vec3(1.0, 0.94, 0.86), smoothstep(0.85, 1.3, t));
  return c;
}

vec4 disk(vec3 p, vec3 dir) {
  float r = length(p.xz);
  if (r < RIN || r > ROUT) return vec4(0.0);

  float ang = atan(p.z, p.x);
  float omega = 2.4 * pow(r, -1.5);          // Kepler: inner gas laps the outer gas
  float a = ang - uTime * omega;
  vec2 q = vec2(cos(a), sin(a));
  float lr = log(r);

  float n1 = fbm(vec3(q * 1.4, lr * 7.0));
  float n2 = noise(vec3(q * 6.0, lr * 22.0 + 3.0));
  float dens = smoothstep(0.22, 0.8, n1 * 0.85 + n2 * 0.3);
  dens *= smoothstep(RIN, RIN + 0.5, r) * (1.0 - smoothstep(ROUT * 0.4, ROUT, r));

  // ignition sweeps outward during the intro
  float front = mix(RIN - 1.0, ROUT + 2.0, uIntro);
  dens *= smoothstep(r - 0.2, r + 1.2, front);

  // Novikov-Thorne-ish temperature profile
  float x = RIN / r;
  float T = pow(x, 0.75) * pow(max(1.0 - sqrt(x * 0.92), 0.0), 0.25) * 1.9;

  // relativistic beaming: the approaching side is brighter and hotter
  vec3 tang = normalize(vec3(-p.z, 0.0, p.x));
  float beta = sqrt(0.5 / r);
  float gl = inversesqrt(1.0 - beta * beta);
  float cosT = dot(tang, -dir);
  float g = sqrt(max(1.0 - 1.0 / r, 0.05)) / (gl * (1.0 - beta * cosT));

  float t = T * g;
  t *= mix(1.0, 0.6, uHeat);
  t *= mix(1.0, 0.45, uLock);

  vec3 col = ramp(t) * pow(g, 3.2) * (0.75 + 0.9 * n2) * dens;
  return vec4(col, clamp(dens * 0.95, 0.0, 1.0));
}

vec4 namePlane(vec3 p) {
  vec2 uv = vec2(p.x / uPlane.y, (p.y - uPlaneY) / uPlane.z) * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  // explicit LOD: inside the ray loop, implicit derivatives are undefined, and phone GPUs
  // pick a random mip per 2x2 block, which shows as dashed ghosts around the name
  float m = textureLod(uName, uv, 0.0).r;
  vec3 c = mix(vec3(1.0, 0.94, 0.86), vec3(1.0, 0.22, 0.12), uLock);
  return vec4(c * 1.1, m * uPlane.w);
}

vec3 stars(vec3 d) {
  vec3 col = vec3(0.0);
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    vec3 p = d * (70.0 + fl * 95.0);
    vec3 id = floor(p);
    vec3 f = p - id - 0.5;
    float h = hash13(id + fl * 13.7);
    float thr = 0.86 + fl * 0.035;
    if (h > thr) {
      vec3 o = (hash33(id) - 0.5) * 0.7;
      float b = (h - thr) / (1.0 - thr);
      float tw = 0.7 + 0.3 * sin(uTime * (0.8 + 3.0 * b) + h * 40.0);
      float s = (1.0 - smoothstep(0.0, 0.17, length(f - o))) * b * tw;
      vec3 tint = mix(vec3(1.0, 0.8, 0.62), vec3(0.92, 0.92, 1.0), hash13(id + 5.0));
      col += tint * s * (1.7 - fl * 0.45);
    }
  }
  return col;
}

vec3 background(vec3 d) {
  vec3 col = stars(d);
  float n = fbm(d * 2.2 + 4.0);
  float b = d.y * 2.4 + 0.3 * sin(d.x * 2.0); // pow() of a negative base is undefined in GLSL
  float band = exp(-b * b);
  col += vec3(0.4, 0.13, 0.06) * pow(n, 3.4) * 0.05 * (0.15 + band);
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;

  // the cursor is a tiny lens of its own
  vec2 dm = uv - uMouse.xy;
  float dm2 = dot(dm, dm);
  uv -= uMouse.z * dm / (dm2 + 0.0003) * (1.0 - smoothstep(0.0, 0.08, dm2));

  vec2 s = uv - uShift;
  vec3 rd = normalize(uCamFwd + (s.x * uCamRight + s.y * uCamUp) * 2.0 * uTanFov);

  vec3 pos = uCamPos;
  vec3 vel = rd;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);

  vec3 col = vec3(0.0);
  float trans = 1.0;
  float minR = 1e4;
  bool absorbed = false;

  // from far out (the approach) rays need a few dozen extra steps to arrive
  int budget = uSteps + (dot(uCamPos, uCamPos) > 1600.0 ? 48 : 0);
  for (int i = 0; i < 448; i++) {
    if (i >= budget) break;
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    minR = min(minR, r);

    // steps grow with distance; past 40 rs nothing needs the 2-unit cap
    float dt = clamp(0.09 * r, 0.012, r > 40.0 ? 0.09 * r : 2.0) * mix(0.45, 1.0, smoothstep(1.4, 4.5, r));
    vel += -1.5 * h2 * pos / (r2 * r2 * r) * dt;
    vec3 npos = pos + vel * dt;

    if (pos.y * npos.y < 0.0) {
      vec3 p = mix(pos, npos, pos.y / (pos.y - npos.y));
      vec4 d = disk(p, normalize(vel));
      col += trans * d.rgb;
      trans *= 1.0 - d.a;
    }

    if (uPlane.w > 0.001 && pos.z < uPlane.x && npos.z >= uPlane.x) {
      vec3 p = mix(pos, npos, (uPlane.x - pos.z) / (npos.z - pos.z));
      vec4 nm = namePlane(p);
      col += trans * nm.rgb * nm.a;
      trans *= 1.0 - nm.a * 0.92;
    }

    pos = npos;
    if (dot(pos, pos) < 1.0) { absorbed = true; break; }
    if (r > 60.0 && dot(pos, vel) > 0.0) break;
    if (trans < 0.01) break;
  }

  if (!absorbed) {
    col += trans * background(normalize(vel)) * uSky;
    float glow = exp(-max(minR - 1.5, 0.0) * 2.4);
    vec3 gc = mix(mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.2, 0.08), uHeat), vec3(1.0, 0.1, 0.05), uLock);
    col += gc * glow * (0.14 + uFlash * 1.6) * (uIntro + uSky * 0.6 * (1.0 - uIntro));
  }

  col *= uDim;

  // lock-in: collapse everything toward a single red
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(col, vec3(lum * 1.5, lum * 0.16, lum * 0.08), uLock * 0.85);

  // ACES fit, then gamma
  col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));

  vec2 vq = (frag / uRes - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  col *= mix(0.5, 1.0, 1.0 - smoothstep(0.3, 1.2, length(vq)));
  col += (hash13(vec3(frag, fract(uTime) * 91.0)) - 0.5) / 255.0;

  outColor = vec4(col, 1.0);
}
