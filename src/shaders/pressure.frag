#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
uniform vec2 u_texelSize;
out vec4 fragColor;

void main() {
  float L = texture(u_pressure, vUv - vec2(u_texelSize.x, 0)).x;
  float R = texture(u_pressure, vUv + vec2(u_texelSize.x, 0)).x;
  float B = texture(u_pressure, vUv - vec2(0, u_texelSize.y)).x;
  float T = texture(u_pressure, vUv + vec2(0, u_texelSize.y)).x;
  float div = texture(u_divergence, vUv).x;
  // Jacobi: p = (L + R + B + T - div) / 4
  float p = (L + R + B + T - div) * 0.25;
  fragColor = vec4(p, 0, 0, 1);
}
