precision highp float;

uniform sampler2D depthTex;
uniform float nearPlane;
uniform float farPlane;

varying vec2 v_uv;

float LinearizeDepth(float depth) {
  float z = depth * 2.0 - 1.0; // Back to NDC 
  return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
}

void main () {
  float depth = texture2D(depthTex, v_uv).r;
  gl_FragColor = vec4(vec3(LinearizeDepth(depth) / farPlane), 1.0);
}
