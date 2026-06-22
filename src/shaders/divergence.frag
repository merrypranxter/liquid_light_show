#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;
out vec4 fragColor;

void main() {
  float L = texture(u_velocity, vUv - vec2(u_texelSize.x, 0)).x;
  float R = texture(u_velocity, vUv + vec2(u_texelSize.x, 0)).x;
  float B = texture(u_velocity, vUv - vec2(0, u_texelSize.y)).y;
  float T = texture(u_velocity, vUv + vec2(0, u_texelSize.y)).y;
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0, 0, 1);
}
