precision highp float;

uniform vec3 lightDirection;
uniform float lightFactor;

varying vec3 v_normal;
varying float v_colorScaleFactor;

void main() {
  vec3 normal = normalize(v_normal);
  float light = dot(normal, lightDirection);
  gl_FragColor = vec4(
    vec3(0.6) * v_colorScaleFactor * light * lightFactor,
    1.0
  );
}
