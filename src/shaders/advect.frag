#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_dissipation;
out vec4 fragColor;

void main() {
  // Semi-Lagrangian backtrace
  vec2 vel = texture(u_velocity, vUv).xy;
  vec2 prevPos = vUv - vel * u_dt * u_texelSize * vec2(textureSize(u_velocity, 0));
  // Clamp to edge
  prevPos = clamp(prevPos, u_texelSize, 1.0 - u_texelSize);
  fragColor = u_dissipation * texture(u_source, prevPos);
}
