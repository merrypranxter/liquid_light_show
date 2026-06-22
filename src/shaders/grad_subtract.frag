#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;
out vec4 fragColor;

void main() {
  float L = texture(u_pressure, vUv - vec2(u_texelSize.x, 0)).x;
  float R = texture(u_pressure, vUv + vec2(u_texelSize.x, 0)).x;
  float B = texture(u_pressure, vUv - vec2(0, u_texelSize.y)).x;
  float T = texture(u_pressure, vUv + vec2(0, u_texelSize.y)).x;
  vec2 vel = texture(u_velocity, vUv).xy;
  vel -= 0.5 * vec2(R - L, T - B);
  fragColor = vec4(vel, 0, 1);
}
