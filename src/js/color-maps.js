// color-maps.js — palette ramps for each aesthetic regime
export const REGIMES = {
  fillmore_1967: {
    colors: ['#0a0010','#8338ec','#ff006e','#ffbe0b','#00f0ff','#ffffff'],
    viscosity: 0.02, heat_buoyancy: 0.5, surface_tension: 0.7,
    dye_injection: 0.7, film_thickness_scale: 300, defocus: 0.35,
  },
  boiling_acid: {
    colors: ['#000000','#ff0000','#ff00ff','#00ff00','#00ffff','#ffff00'],
    viscosity: 0.001, heat_buoyancy: 2.0, surface_tension: 0.1,
    dye_injection: 0.9, film_thickness_scale: 150, defocus: 0.1,
  },
  oil_slick: {
    colors: ['#000000','#050510','#0a0a20','#101030','#0a0a0a','#050505'],
    viscosity: 0.03, heat_buoyancy: 0.2, surface_tension: 0.9,
    dye_injection: 0.1, film_thickness_scale: 800, defocus: 0.2,
  },
  ink_in_water: {
    colors: ['#000000','#ff006e','#00f0ff','#ffbe0b','#8338ec','#000000'],
    viscosity: 0.05, heat_buoyancy: 0.0, surface_tension: 0.3,
    dye_injection: 0.3, film_thickness_scale: 50, defocus: 0.4,
  },
};

export function buildRamp(gl, hexColors) {
  const N = 256;
  const data = new Uint8Array(N * 4);
  const stops = hexColors.map(h => {
    const r = parseInt(h.slice(1,3),16);
    const g = parseInt(h.slice(3,5),16);
    const b = parseInt(h.slice(5,7),16);
    return [r,g,b];
  });
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const seg = t * (stops.length - 1);
    const lo = Math.floor(seg);
    const hi = Math.min(lo + 1, stops.length - 1);
    const f = seg - lo;
    data[i*4+0] = Math.round(stops[lo][0] * (1-f) + stops[hi][0] * f);
    data[i*4+1] = Math.round(stops[lo][1] * (1-f) + stops[hi][1] * f);
    data[i*4+2] = Math.round(stops[lo][2] * (1-f) + stops[hi][2] * f);
    data[i*4+3] = 255;
  }
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
