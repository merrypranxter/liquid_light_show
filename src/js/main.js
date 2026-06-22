// main.js — WebGL2 setup, shader loading, FBO init, render loop
import { FBOPingPong } from './fbo-pingpong.js';
import { FluidSolver } from './solver.js';
import { buildRamp, REGIMES } from './color-maps.js';
import { Source } from './source.js';

const SIM_W = 512, SIM_H = 512;

const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.insertBefore(canvas, document.body.firstChild);

const gl = canvas.getContext('webgl2');
if (!gl) { alert('WebGL2 required'); }

// params
const params = {
  viscosity: 0.02, heat_buoyancy: 0.5, surface_tension: 0.5,
  dye_injection: 0.6, film_thickness_scale: 400, defocus: 0.3,
  regime: 'fillmore_1967'
};

// mouse
const mouse = { x:0, y:0, dx:0, dy:0, down:false, px:0, py:0 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = 1 - (e.clientY - rect.top) / rect.height;
  mouse.dx = nx - mouse.px; mouse.dy = ny - mouse.py;
  mouse.x = nx; mouse.y = ny;
  mouse.px = nx; mouse.py = ny;
});
canvas.addEventListener('mousedown', () => mouse.down = true);
canvas.addEventListener('mouseup', () => mouse.down = false);
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const nx = (t.clientX - rect.left) / rect.width;
  const ny = 1 - (t.clientY - rect.top) / rect.height;
  mouse.dx = nx - mouse.px; mouse.dy = ny - mouse.py;
  mouse.x = nx; mouse.y = ny;
  mouse.px = nx; mouse.py = ny;
  mouse.down = true;
}, { passive: false });
canvas.addEventListener('touchend', () => mouse.down = false);

// UI wiring
const sliders = ['viscosity','heat_buoyancy','surface_tension','dye_injection','film_thickness_scale','defocus'];
sliders.forEach(id => {
  const el = document.getElementById(id);
  const val = document.getElementById('v-' + id);
  el.addEventListener('input', () => {
    params[id] = parseFloat(el.value);
    val.textContent = parseFloat(el.value).toFixed(id === 'film_thickness_scale' ? 0 : 2);
  });
});

function applyRegime(name) {
  const r = REGIMES[name];
  if (!r) return;
  Object.assign(params, r, { regime: name });
  sliders.forEach(id => {
    const el = document.getElementById(id);
    const val = document.getElementById('v-' + id);
    if (r[id] !== undefined) {
      el.value = r[id];
      val.textContent = parseFloat(r[id]).toFixed(id === 'film_thickness_scale' ? 0 : 2);
    }
  });
  // rebuild palette
  if (paletteTex) gl.deleteTexture(paletteTex);
  paletteTex = buildRamp(gl, r.colors);
}

document.querySelectorAll('.regime-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.regime-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyRegime(btn.dataset.regime);
  });
});

const fileInput = document.getElementById('file-input');
document.getElementById('upload-btn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) source.fromImage(e.target.files[0]);
});

// Shader source loading
async function loadShader(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed to load shader: ' + url);
  return r.text();
}

const VS = `#version 300 es
in vec2 a_position;
out vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0, 1);
}`;

function compileShader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s), src.split('\n').map((l,i)=>`${i+1}: ${l}`).join('\n'));
    return null;
  }
  return s;
}

function buildProgram(gl, fsSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VS);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

let paletteTex = null;
const source = new Source(gl);

(async () => {
  const [advFS, pressFS, gradFS, divFS, splatFS, buoyFS, dyeFS, projFS] = await Promise.all([
    loadShader('src/shaders/advect.frag'),
    loadShader('src/shaders/pressure.frag'),
    loadShader('src/shaders/grad_subtract.frag'),
    loadShader('src/shaders/divergence.frag'),
    loadShader('src/shaders/splat.frag'),
    loadShader('src/shaders/buoyancy.frag'),
    loadShader('src/shaders/dye.frag'),
    loadShader('src/shaders/projection.frag'),
  ]);

  const programs = {
    advect:       buildProgram(gl, advFS),
    pressure:     buildProgram(gl, pressFS),
    gradSubtract: buildProgram(gl, gradFS),
    divergence:   buildProgram(gl, divFS),
    splat:        buildProgram(gl, splatFS),
    buoyancy:     buildProgram(gl, buoyFS),
    dye:          buildProgram(gl, dyeFS),
    projection:   buildProgram(gl, projFS),
  };

  // FBOs
  const HF = gl.HALF_FLOAT, RG32 = gl.RG16F, RG = gl.RG, R32 = gl.R16F, R = gl.RED;
  const RGBA32 = gl.RGBA16F, RGBA_ = gl.RGBA;
  const fbos = {
    vel:   new FBOPingPong(gl, SIM_W, SIM_H, RG32,   RG,   HF),
    div:   new FBOPingPong(gl, SIM_W, SIM_H, R32,    R,    HF),
    prs:   new FBOPingPong(gl, SIM_W, SIM_H, R32,    R,    HF),
    dye:   new FBOPingPong(gl, SIM_W, SIM_H, RGBA32, RGBA_, HF),
    phase: new FBOPingPong(gl, SIM_W, SIM_H, R32,    R,    HF),
  };

  paletteTex = buildRamp(gl, REGIMES['fillmore_1967'].colors);

  const solver = new FluidSolver(gl, programs, fbos, SIM_W, SIM_H);

  // Seed phase field with random oil/water domains
  seedPhase(gl, fbos.phase, SIM_W, SIM_H);

  // FPS
  let lastTime = performance.now(), frameCount = 0;
  const fpsEl = document.getElementById('fps');

  function render(now) {
    requestAnimationFrame(render);
    const dt = Math.min((now - (render._last || now)) / 1000, 0.016);
    render._last = now;

    frameCount++;
    if (now - lastTime > 1000) {
      fpsEl.textContent = frameCount + ' fps';
      frameCount = 0; lastTime = now;
    }

    // Auto-inject dye from random sources
    autoInject(solver, params, now);

    solver.step(params, dt, mouse);
    mouse.dx = 0; mouse.dy = 0;

    // Draw to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const proj = programs.projection;
    gl.useProgram(proj);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fbos.dye.read.tex);
    gl.uniform1i(gl.getUniformLocation(proj, 'u_dye'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fbos.phase.read.tex);
    gl.uniform1i(gl.getUniformLocation(proj, 'u_phase'), 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, paletteTex);
    gl.uniform1i(gl.getUniformLocation(proj, 'u_palette'), 2);
    gl.activeTexture(gl.TEXTURE3);
    if (source.active) gl.bindTexture(gl.TEXTURE_2D, source.tex);
    else gl.bindTexture(gl.TEXTURE_2D, null);
    gl.uniform1i(gl.getUniformLocation(proj, 'u_source'), 3);
    gl.uniform1i(gl.getUniformLocation(proj, 'u_has_source'), source.active ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(proj, 'u_defocus'), params.defocus);
    gl.uniform1f(gl.getUniformLocation(proj, 'u_film_thickness'), params.film_thickness_scale * 1e-9);
    gl.uniform1f(gl.getUniformLocation(proj, 'u_surface_tension'), params.surface_tension);
    gl.uniform2f(gl.getUniformLocation(proj, 'u_resolution'), canvas.width, canvas.height);

    const quad = solver.quad;
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = gl.getAttribLocation(proj, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  requestAnimationFrame(render);
})();

function seedPhase(gl, phaseFBO, w, h) {
  const data = new Float32Array(w * h);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  gl.bindTexture(gl.TEXTURE_2D, phaseFBO.read.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, w, h, 0, gl.RED, gl.HALF_FLOAT,
    new Uint16Array(data.buffer.slice(0, data.byteLength)));
}

let autoTimer = 0;
const sources = [];
for (let i = 0; i < 5; i++) {
  sources.push({ x: Math.random(), y: Math.random(), t: Math.random()*100 });
}

function autoInject(solver, params, now) {
  autoTimer += 1;
  if (autoTimer % 3 !== 0) return;
  const t = now * 0.001;
  for (const src of sources) {
    // drift source slowly
    src.x += (Math.random()-0.5)*0.002;
    src.y += (Math.random()-0.5)*0.002;
    src.x = Math.max(0.05, Math.min(0.95, src.x));
    src.y = Math.max(0.05, Math.min(0.95, src.y));
    // inject force
    const fakeMouse = {
      down: true,
      x: src.x, y: src.y,
      dx: (Math.random()-0.5)*0.003,
      dy: (Math.random()-0.5)*0.003 + params.heat_buoyancy * 0.001
    };
    solver._addForce(fakeMouse, params, 0.016);
  }
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
