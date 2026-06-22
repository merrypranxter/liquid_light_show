#version 300 es
precision highp float;

in vec2 vUv;
uniform sampler2D u_target;
uniform vec2 u_point;
uniform vec3 u_value;
uniform float u_radius;
out vec4 fragColor;

void main() {
  vec2 d = vUv - u_point;
  d.x *= float(textureSize(u_target, 0).x) / float(textureSize(u_target, 0).y);
  float splat = exp(-dot(d, d) / u_radius);
  vec3 base = texture(u_target, vUv).xyz;
  fragColor = vec4(base + splat * u_value, 1);
}
