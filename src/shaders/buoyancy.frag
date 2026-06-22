#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_velocity;
uniform sampler2D u_dye;
uniform float u_buoyancy;
uniform float u_dt;
out vec4 fragColor;

void main() {
  vec2 vel = texture(u_velocity, vUv).xy;
  // Use dye luminance as temperature proxy
  vec3 dye = texture(u_dye, vUv).rgb;
  float heat = dot(dye, vec3(0.299, 0.587, 0.114));
  float ambient = 0.3;
  // Warm regions rise
  vel.y += u_buoyancy * (heat - ambient) * u_dt;
  fragColor = vec4(vel, 0, 1);
}
