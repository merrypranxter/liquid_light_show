#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_dye;
uniform sampler2D u_phase;
uniform sampler2D u_palette;
uniform sampler2D u_source;
uniform int u_has_source;
uniform float u_defocus;
uniform float u_film_thickness;  // in meters (e.g. 400e-9)
uniform float u_surface_tension;
uniform vec2 u_resolution;
out vec4 fragColor;

const float PI = 3.14159265359;

// Thin-film spectral interference
vec3 thinFilm(float d) {
  float n = 1.45; // oil refractive index
  float path = 2.0 * n * d; // optical path difference
  // Evaluate at R=630nm, G=530nm, B=460nm
  float r = pow(sin(PI * path / 630e-9), 2.0);
  float g = pow(sin(PI * path / 530e-9), 2.0);
  float b = pow(sin(PI * path / 460e-9), 2.0);
  return vec3(r, g, b);
}

// Simple gaussian blur sample for defocus
vec4 defocusSample(sampler2D tex, vec2 uv, float radius) {
  if (radius < 0.001) return texture(tex, uv);
  vec4 acc = vec4(0);
  float total = 0.0;
  vec2 texelSize = 1.0 / vec2(textureSize(tex, 0));
  // 9-sample gaussian
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 off = vec2(float(x), float(y)) * texelSize * radius * 20.0;
      float w = exp(-float(x*x+y*y) * 0.5);
      acc += w * texture(tex, uv + off);
      total += w;
    }
  }
  return acc / total;
}

void main() {
  // Sample dye with optional defocus
  vec4 dye = defocusSample(u_dye, vUv, u_defocus);
  float density = dot(dye.rgb, vec3(0.333));

  // Palette lookup
  vec3 paletteColor = texture(u_palette, vec2(density, 0.5)).rgb;

  // Phase field → film thickness
  float phase = texture(u_phase, vUv).x; // -1..+1
  float filmD = u_film_thickness * (0.5 + 0.5 * phase);
  vec3 iridescence = vec3(0);
  if (u_film_thickness > 0.0) {
    iridescence = thinFilm(filmD);
  }

  // Backlit warm white light
  vec3 backlight = vec3(1.0, 0.96, 0.88);

  // Combine: palette dye + iridescence + backlit glow
  float iridStrength = u_surface_tension * 0.6;
  vec3 color = paletteColor * (0.4 + 0.6 * density)
             + iridescence * iridStrength * (1.0 - density * 0.5)
             + backlight * max(0.0, 0.15 - density * 0.3);

  // Bloom: bright regions glow outward (approximated by bright add)
  float bloom = pow(max(dot(color, vec3(0.333)) - 0.6, 0.0), 2.0) * 1.5 * (1.0 - u_defocus*0.5);
  color += bloom * backlight;

  // Optional: blend source image through fluid
  if (u_has_source == 1) {
    vec3 src = texture(u_source, vUv).rgb;
    color = mix(color, color * src, 0.4);
  }

  // Gamma + tone
  color = pow(clamp(color, 0.0, 1.0), vec3(0.85));
  fragColor = vec4(color, 1.0);
}
