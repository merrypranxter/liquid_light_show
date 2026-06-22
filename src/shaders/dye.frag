#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_dye;
uniform sampler2D u_velocity;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_time;
out vec4 fragColor;

void main() {
  // Dye is advected in solver.js via advect.frag
  // This pass adds slow global fade toward background
  vec4 dye = texture(u_dye, vUv);
  // Slight diffusion
  vec4 L = texture(u_dye, vUv - vec2(u_texelSize.x,0));
  vec4 R = texture(u_dye, vUv + vec2(u_texelSize.x,0));
  vec4 B = texture(u_dye, vUv - vec2(0,u_texelSize.y));
  vec4 T = texture(u_dye, vUv + vec2(0,u_texelSize.y));
  vec4 laplacian = (L+R+B+T - 4.0*dye);
  dye += 0.0003 * laplacian;
  fragColor = vec4(max(dye.rgb, vec3(0)), 1);
}
